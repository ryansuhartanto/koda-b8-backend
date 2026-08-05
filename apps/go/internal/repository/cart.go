package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/model"
	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/sqid"
)

func CartItems(ctx context.Context, pool *pgxpool.Pool, codec *sqid.Codec, idUser int64) ([]model.CartItem, error) {
	rows, err := pool.Query(ctx,
		`SELECT ci.id_variant, p.id, p.name, pv.name, COALESCE((
			SELECT pi.url FROM products_images pi
			WHERE pi.id_product = p.id AND (pi.id_variant = pv.id OR pi.id_variant IS NULL)
			ORDER BY pi.id_variant NULLS LAST, pi.id ASC LIMIT 1
		), ''), pp.price_idr, ci.quantity
		FROM cart_items ci
		JOIN products_variants pv ON pv.id = ci.id_variant AND pv.deleted_at IS NULL
		JOIN products p ON p.id = pv.id_product AND p.deleted_at IS NULL
		JOIN products_price pp ON pp.id_variant = pv.id
		WHERE ci.id_user = $1
		ORDER BY ci.created_at, ci.id_variant`, idUser)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []model.CartItem{}

	for rows.Next() {
		var (
			item      model.CartItem
			idVariant int64
			idProduct int64
		)

		if err := rows.Scan(&idVariant, &idProduct, &item.Name, &item.VariantName, &item.Img, &item.PriceIdr, &item.Quantity); err != nil {
			return nil, err
		}

		if item.IDVariant, err = codec.Encode(idVariant); err != nil {
			return nil, err
		}

		product, err := codec.Encode(idProduct)
		if err != nil {
			return nil, err
		}

		item.Path = model.ProductPath(product, item.Name)

		items = append(items, item)
	}

	return items, rows.Err()
}

// SELECT rather than a literal id, so a soft-deleted variant is rejected with no
// check-then-insert window
func SetCartItem(ctx context.Context, pool *pgxpool.Pool, idUser, idVariant int64, quantity int) (bool, error) {
	tag, err := pool.Exec(ctx,
		`INSERT INTO cart_items (id_user, id_variant, quantity)
		SELECT $1, pv.id, $3
		FROM products_variants pv
		JOIN products p ON p.id = pv.id_product AND p.deleted_at IS NULL
		WHERE pv.id = $2 AND pv.deleted_at IS NULL
		ON CONFLICT (id_user, id_variant) DO UPDATE SET quantity = EXCLUDED.quantity`,
		idUser, idVariant, quantity)

	return tag.RowsAffected() > 0, err
}

func DeleteCartItem(ctx context.Context, pool *pgxpool.Pool, idUser, idVariant int64) error {
	_, err := pool.Exec(ctx,
		`DELETE FROM cart_items WHERE id_user = $1 AND id_variant = $2`, idUser, idVariant)

	return err
}
