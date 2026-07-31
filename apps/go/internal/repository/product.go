package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ryansuhartanto/koda-b8-backend/apps/go/internal/model"
)

// every ordering ends on id so that pagination cannot repeat or skip a row
var ProductSort = map[string]string{
	"newest":     "p.created_at DESC, p.id DESC",
	"price_asc":  "p.price_idr ASC, p.id ASC",
	"price_desc": "p.price_idr DESC, p.id DESC",
	"rating":     "p.rating DESC, p.id DESC",
}

type ProductFilter struct {
	Search   string
	Category string
	Tag      string
	Sort     string
	Limit    int
	Offset   int
}

const productColumns = `
	p.id, p.slug, p.name,
	COALESCE(p.brand, ''), COALESCE(c.name, ''), COALESCE(p.img, ''), COALESCE(p.summary, ''),
	p.price_idr, COALESCE(p.original_price_idr, 0), p.stock,
	p.rating, p.rating_count, p.tags
FROM products p
LEFT JOIN categories c ON c.id = p.id_category AND c.deleted_at IS NULL
WHERE p.deleted_at IS NULL`

func scanProduct(row pgx.Row) (model.Product, error) {
	var p model.Product

	err := row.Scan(
		&p.ID, &p.Slug, &p.Name,
		&p.Brand, &p.Category, &p.Img, &p.Summary,
		&p.PriceIdr, &p.OriginalPriceIdr, &p.Stock,
		&p.Rating, &p.RatingCount, &p.Tags,
	)

	return p, err
}

func Products(ctx context.Context, pool *pgxpool.Pool, filter ProductFilter) ([]model.Product, error) {
	query := strings.Builder{}
	query.WriteString("SELECT" + productColumns)

	args := []any{}

	if filter.Search != "" {
		args = append(args, filter.Search)
		fmt.Fprintf(&query, " AND p.name ILIKE '%%' || $%d || '%%'", len(args))
	}

	if filter.Category != "" {
		args = append(args, filter.Category)
		fmt.Fprintf(&query, " AND c.name = $%d", len(args))
	}

	if filter.Tag != "" {
		args = append(args, filter.Tag)
		fmt.Fprintf(&query, " AND $%d = ANY(p.tags)", len(args))
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
		p, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}

		products = append(products, p)
	}

	return products, rows.Err()
}

func ProductBySlug(ctx context.Context, pool *pgxpool.Pool, slug string) (model.Product, error) {
	return scanProduct(pool.QueryRow(ctx, "SELECT"+productColumns+" AND p.slug = $1", slug))
}
