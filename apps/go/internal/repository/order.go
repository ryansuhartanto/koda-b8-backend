package repository

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/model"
	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/sqid"
)

type OrderError struct {
	Status int
	Detail string
}

func (e *OrderError) Error() string { return e.Detail }

const createdAt = `TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`

const orderColumns = `o.id, ` + createdAt + `, o.status, o.payment_method,
	COALESCE(o.promo_code, ''), o.discount_idr, o.subtotal_idr, o.ship_cost_idr, o.total_idr,
	o.ship_name, o.ship_phone, o.ship_email, o.ship_address, o.ship_method, COALESCE(o.ship_note, '')`

func scanOrder(row pgx.Row) (model.Order, error) {
	var o model.Order

	err := row.Scan(
		&o.ID, &o.CreatedAt, &o.Status, &o.PaymentMethod,
		&o.PromoCode, &o.DiscountIdr, &o.SubtotalIdr, &o.ShipCostIdr, &o.TotalIdr,
		&o.ShipName, &o.ShipPhone, &o.ShipEmail, &o.ShipAddress, &o.ShipMethod, &o.ShipNote,
	)

	return o, err
}

func Orders(ctx context.Context, pool *pgxpool.Pool, codec *sqid.Codec, idUser int64) ([]model.Order, error) {
	rows, err := pool.Query(ctx,
		`SELECT `+orderColumns+`
		FROM orders o
		WHERE o.id_user = $1 AND o.deleted_at IS NULL
		ORDER BY o.created_at DESC, o.id DESC`, idUser)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []model.Order{}
	ids := []int64{}

	for rows.Next() {
		order, err := scanOrder(rows)
		if err != nil {
			return nil, err
		}

		order.Items = []model.OrderItem{}
		orders = append(orders, order)
		ids = append(ids, order.ID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	items, err := orderItems(ctx, pool, codec, ids)
	if err != nil {
		return nil, err
	}

	for i := range orders {
		if lines, ok := items[orders[i].ID]; ok {
			orders[i].Items = lines
		}
	}

	return orders, nil
}

func orderItems(ctx context.Context, pool *pgxpool.Pool, codec *sqid.Codec, idOrders []int64) (map[int64][]model.OrderItem, error) {
	items := map[int64][]model.OrderItem{}

	if len(idOrders) == 0 {
		return items, nil
	}

	rows, err := pool.Query(ctx,
		`SELECT id_order, id, COALESCE(id_variant, 0), product_name, variant_name, unit_price_idr, quantity
		FROM order_items
		WHERE id_order = ANY($1)
		ORDER BY id`, idOrders)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			idOrder   int64
			idVariant int64
			item      model.OrderItem
		)

		if err := rows.Scan(&idOrder, &item.ID, &idVariant, &item.ProductName, &item.VariantName, &item.UnitPriceIdr, &item.Quantity); err != nil {
			return nil, err
		}

		if item.IDVariant, err = variantSqid(codec, idVariant); err != nil {
			return nil, err
		}

		items[idOrder] = append(items[idOrder], item)
	}

	return items, rows.Err()
}

func variantSqid(codec *sqid.Codec, idVariant int64) (string, error) {
	if idVariant == 0 {
		return "", nil
	}

	return codec.Encode(idVariant)
}

type cartLine struct {
	idVariant   int64
	productName string
	variantName string
	priceIdr    int64
	inventory   int
	quantity    int
}

func CreateOrder(ctx context.Context, pool *pgxpool.Pool, codec *sqid.Codec, idUser int64, req model.OrderRequest) (model.Order, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return model.Order{}, err
	}
	defer tx.Rollback(ctx)

	var shipName, shipPhone, shipEmail, shipAddress string

	err = tx.QueryRow(ctx,
		`SELECT a.name, a.phone, u.email, a.address
		FROM saved_address a
		JOIN users u ON u.id = a.id_user
		WHERE a.id = $1 AND a.id_user = $2 AND a.deleted_at IS NULL`,
		req.IDAddress, idUser,
	).Scan(&shipName, &shipPhone, &shipEmail, &shipAddress)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Order{}, &OrderError{http.StatusNotFound, "no such address"}
		}

		return model.Order{}, err
	}

	var shipCostIdr int64

	err = tx.QueryRow(ctx,
		`SELECT cost_idr FROM shipping_methods WHERE name = $1 AND deleted_at IS NULL`,
		req.ShipMethod).Scan(&shipCostIdr)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Order{}, &OrderError{http.StatusNotFound, "no such shipping method"}
		}

		return model.Order{}, err
	}

	lines, err := lockCart(ctx, tx, idUser)
	if err != nil {
		return model.Order{}, err
	}

	var subtotalIdr int64

	for _, line := range lines {
		if line.quantity > line.inventory {
			return model.Order{}, &OrderError{http.StatusConflict, fmt.Sprintf("not enough stock for %s", line.productName)}
		}

		subtotalIdr += line.priceIdr * int64(line.quantity)
	}

	order, err := scanOrder(tx.QueryRow(ctx,
		`INSERT INTO orders AS o (
			id_user, payment_method, promo_code, discount_idr, subtotal_idr, ship_cost_idr,
			ship_name, ship_phone, ship_email, ship_address, ship_method, ship_note
		) VALUES ($1, $2, NULLIF($3, ''), 0, $4, $5, $6, $7, $8, $9, $10, NULLIF($11, ''))
		RETURNING `+orderColumns,
		idUser, req.PaymentMethod, req.PromoCode, subtotalIdr, shipCostIdr,
		shipName, shipPhone, shipEmail, shipAddress, req.ShipMethod, req.ShipNote))
	if err != nil {
		return model.Order{}, err
	}

	order.Items = []model.OrderItem{}

	for _, line := range lines {
		var (
			item      model.OrderItem
			idVariant int64
		)

		err := tx.QueryRow(ctx,
			`INSERT INTO order_items (id_order, id_variant, product_name, variant_name, unit_price_idr, quantity)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id, COALESCE(id_variant, 0), product_name, variant_name, unit_price_idr, quantity`,
			order.ID, line.idVariant, line.productName, line.variantName, line.priceIdr, line.quantity,
		).Scan(&item.ID, &idVariant, &item.ProductName, &item.VariantName, &item.UnitPriceIdr, &item.Quantity)
		if err != nil {
			return model.Order{}, err
		}

		if item.IDVariant, err = variantSqid(codec, idVariant); err != nil {
			return model.Order{}, err
		}

		order.Items = append(order.Items, item)

		if _, err := tx.Exec(ctx,
			`UPDATE products_variants SET inventory = inventory - $1 WHERE id = $2`,
			line.quantity, line.idVariant); err != nil {
			return model.Order{}, err
		}
	}

	if _, err := tx.Exec(ctx, `DELETE FROM cart_items WHERE id_user = $1`, idUser); err != nil {
		return model.Order{}, err
	}

	return order, tx.Commit(ctx)
}

func lockCart(ctx context.Context, tx pgx.Tx, idUser int64) ([]cartLine, error) {
	// ordered by id so that two checkouts touching the same variants take the row locks in
	// the same sequence and cannot deadlock
	rows, err := tx.Query(ctx,
		`SELECT pv.id, p.name, pv.name, pp.price_idr, pv.inventory, ci.quantity
		FROM cart_items ci
		JOIN products_variants pv ON pv.id = ci.id_variant AND pv.deleted_at IS NULL
		JOIN products p ON p.id = pv.id_product AND p.deleted_at IS NULL
		JOIN products_price pp ON pp.id_variant = pv.id
		WHERE ci.id_user = $1
		ORDER BY pv.id
		FOR UPDATE OF pv`, idUser)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lines := []cartLine{}

	for rows.Next() {
		var line cartLine

		if err := rows.Scan(&line.idVariant, &line.productName, &line.variantName, &line.priceIdr, &line.inventory, &line.quantity); err != nil {
			return nil, err
		}

		lines = append(lines, line)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(lines) == 0 {
		return nil, &OrderError{http.StatusConflict, "cart is empty"}
	}

	return lines, nil
}
