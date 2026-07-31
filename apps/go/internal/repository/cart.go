package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/model"
)

func CartItems(ctx context.Context, pool *pgxpool.Pool, idUser int64) ([]model.CartItem, error) {
	rows, err := pool.Query(ctx,
		`SELECT ci.id_product, p.slug, p.name, COALESCE(p.img, ''), p.price_idr, ci.quantity
		FROM cart_items ci
		JOIN products p ON p.id = ci.id_product AND p.deleted_at IS NULL
		WHERE ci.id_user = $1
		ORDER BY ci.created_at, ci.id_product`, idUser)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []model.CartItem{}

	for rows.Next() {
		var item model.CartItem

		if err := rows.Scan(&item.IDProduct, &item.Slug, &item.Name, &item.Img, &item.PriceIdr, &item.Quantity); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

// SELECT rather than a literal id, so a soft-deleted product is rejected with no
// check-then-insert window
func SetCartItem(ctx context.Context, pool *pgxpool.Pool, idUser, idProduct int64, quantity int) (bool, error) {
	tag, err := pool.Exec(ctx,
		`INSERT INTO cart_items (id_user, id_product, quantity)
		SELECT $1, p.id, $3 FROM products p WHERE p.id = $2 AND p.deleted_at IS NULL
		ON CONFLICT (id_user, id_product) DO UPDATE SET quantity = EXCLUDED.quantity`,
		idUser, idProduct, quantity)

	return tag.RowsAffected() > 0, err
}

func DeleteCartItem(ctx context.Context, pool *pgxpool.Pool, idUser, idProduct int64) error {
	_, err := pool.Exec(ctx,
		`DELETE FROM cart_items WHERE id_user = $1 AND id_product = $2`, idUser, idProduct)

	return err
}
