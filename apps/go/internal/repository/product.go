package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/model"
	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/sqid"
)

var ProductSort = map[string]string{
	"newest":     "p.created_at DESC, p.id DESC",
	"price_asc":  "p.price_idr ASC, p.id ASC",
	"price_desc": "p.price_idr DESC, p.id DESC",
	"rating":     "p.rating DESC NULLS LAST, p.id DESC",
}

type ProductFilter struct {
	Search   string
	Category string
	Brand    string
	Sort     string
	Limit    int
	Offset   int
}

const productColumns = `
	p.id, p.name, COALESCE(p.description, ''),
	COALESCE(p.brand, ''), COALESCE(p.category, ''),
	COALESCE(p.img_url, ''), COALESCE(p.img_alt, ''),
	p.price_idr, p.original_price_idr,
	p.inventory,
	COALESCE(p.rating, 0)::FLOAT, p.rating_count
FROM products_summary p`

func scanProduct(row pgx.Row, codec *sqid.Codec) (model.Product, error) {
	var (
		p  model.Product
		id int64
	)

	err := row.Scan(
		&id, &p.Name, &p.Description,
		&p.Brand, &p.Category, &p.ImgURL, &p.ImgAlt,
		&p.PriceIdr, &p.OriginalPriceIdr,
		&p.Inventory,
		&p.Rating, &p.RatingCount,
	)
	if err != nil {
		return p, err
	}

	if p.ID, err = codec.Encode(id); err != nil {
		return p, err
	}

	p.Path = model.ProductPath(p.ID, p.Name)

	return p, nil
}

func Products(ctx context.Context, pool *pgxpool.Pool, codec *sqid.Codec, filter ProductFilter) ([]model.Product, error) {
	query := strings.Builder{}
	query.WriteString("SELECT" + productColumns)

	args := []any{}
	where := []string{}

	if filter.Search != "" {
		args = append(args, filter.Search)
		where = append(where, fmt.Sprintf("p.name ILIKE '%%' || $%d || '%%'", len(args)))
	}

	if filter.Category != "" {
		args = append(args, filter.Category)
		where = append(where, fmt.Sprintf("p.category = $%d", len(args)))
	}

	if filter.Brand != "" {
		args = append(args, filter.Brand)
		where = append(where, fmt.Sprintf("p.brand = $%d", len(args)))
	}

	if len(where) > 0 {
		query.WriteString(" WHERE " + strings.Join(where, " AND "))
	}

	args = append(args, filter.Limit, filter.Offset)
	fmt.Fprintf(&query, " ORDER BY %s LIMIT $%d OFFSET $%d", ProductSort[filter.Sort], len(args)-1, len(args))

	rows, err := pool.Query(ctx, query.String(), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []model.Product{}

	for rows.Next() {
		p, err := scanProduct(rows, codec)
		if err != nil {
			return nil, err
		}

		products = append(products, p)
	}

	return products, rows.Err()
}

func ProductByID(ctx context.Context, pool *pgxpool.Pool, codec *sqid.Codec, id int64) (model.Product, error) {
	p, err := scanProduct(pool.QueryRow(ctx, "SELECT"+productColumns+" WHERE p.id = $1", id), codec)
	if err != nil {
		return p, err
	}

	p.Variants, err = productVariants(ctx, pool, codec, id)

	return p, err
}

func productVariants(ctx context.Context, pool *pgxpool.Pool, codec *sqid.Codec, id int64) ([]model.ProductVariant, error) {
	rows, err := pool.Query(ctx, `
		SELECT pv.id, pv.name, COALESCE(pv.description, ''), pv.inventory, pp.price_idr, pp.original_price_idr
		FROM products_variants pv
		JOIN products_price pp ON pp.id_variant = pv.id
		WHERE pv.id_product = $1 AND pv.deleted_at IS NULL
		ORDER BY pv.position ASC, pv.id ASC`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	variants := []model.ProductVariant{}

	for rows.Next() {
		var (
			v       model.ProductVariant
			variant int64
		)

		if err := rows.Scan(&variant, &v.Name, &v.Description, &v.Inventory, &v.PriceIdr, &v.OriginalPriceIdr); err != nil {
			return nil, err
		}

		if v.ID, err = codec.Encode(variant); err != nil {
			return nil, err
		}

		variants = append(variants, v)
	}

	return variants, rows.Err()
}
