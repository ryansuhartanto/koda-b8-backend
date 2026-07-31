import { Router } from "express";

import { pool } from "#/lib/db";
import { problem } from "#/lib/problem";
import type { Product } from "#/model/product";

// every ordering ends on id so that pagination cannot repeat or skip a row
const sorts: Record<string, string> = {
	newest: "p.created_at DESC, p.id DESC",
	price_asc: "p.price_idr ASC, p.id ASC",
	price_desc: "p.price_idr DESC, p.id DESC",
	rating: "p.rating DESC, p.id DESC",
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_OFFSET = 2147483647;

const columns = `
	p.id, p.slug, p.name,
	COALESCE(p.brand, '') AS brand, COALESCE(c.name, '') AS category,
	COALESCE(p.img, '') AS img, COALESCE(p.summary, '') AS summary,
	p.price_idr, COALESCE(p.original_price_idr, 0) AS original_price_idr, p.stock,
	p.rating, p.rating_count, p.tags
FROM products p
LEFT JOIN categories c ON c.id = p.id_category AND c.deleted_at IS NULL
WHERE p.deleted_at IS NULL`;

function intQuery(
	raw: unknown,
	key: string,
	fallback: number,
	min: number,
	max: number,
): number {
	if (raw === undefined || raw === "") {
		return fallback;
	}

	const value = Number(raw);

	if (
		typeof raw !== "string" ||
		!/^-?\d+$/.test(raw) ||
		value < min ||
		value > max
	) {
		throw new RangeError(`${key} must be an integer between ${min} and ${max}`);
	}

	return value;
}

export const router: Router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         slug: { type: string }
 *         name: { type: string }
 *         brand: { type: string }
 *         category: { type: string }
 *         img: { type: string }
 *         summary: { type: string }
 *         price_idr: { type: integer }
 *         original_price_idr: { type: integer }
 *         stock: { type: integer }
 *         rating: { type: number }
 *         rating_count: { type: integer }
 *         tags: { type: array, items: { type: string }, uniqueItems: false }
 *       required:
 *         [brand, category, id, img, name, original_price_idr, price_idr,
 *          rating, rating_count, slug, stock, summary, tags]
 *
 * /products:
 *   get:
 *     summary: List products
 *     tags: [products]
 *     parameters:
 *       - in: query
 *         name: search
 *         description: Match against the product name
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         description: Category name
 *         schema: { type: string }
 *       - in: query
 *         name: tag
 *         description: One of baru, unggulan, promo
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         description: One of newest, price_asc, price_desc, rating
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, rating]
 *       - in: query
 *         name: limit
 *         description: Rows to return, 1 to 100
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         description: Rows to skip
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: "#/components/schemas/Product" } }
 *       "400":
 *         description: Invalid query
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "500":
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 */
router.get("/products", async (req, res) => {
	const { search, category, tag } = req.query;
	const sort = req.query["sort"] ?? "newest";

	if (typeof sort !== "string" || sorts[sort] === undefined) {
		problem(
			res,
			400,
			"sort must be one of newest, price_asc, price_desc, rating",
		);
		return;
	}

	let limit: number;
	let offset: number;

	try {
		limit = intQuery(req.query["limit"], "limit", DEFAULT_LIMIT, 1, MAX_LIMIT);
		offset = intQuery(req.query["offset"], "offset", 0, 0, MAX_OFFSET);
	} catch (error) {
		problem(res, 400, error);
		return;
	}

	const filters: string[] = [];
	const args: unknown[] = [];

	if (typeof search === "string" && search !== "") {
		args.push(search);
		filters.push(`AND p.name ILIKE '%' || $${args.length} || '%'`);
	}

	if (typeof category === "string" && category !== "") {
		args.push(category);
		filters.push(`AND c.name = $${args.length}`);
	}

	if (typeof tag === "string" && tag !== "") {
		args.push(tag);
		filters.push(`AND $${args.length} = ANY(p.tags)`);
	}

	args.push(limit, offset);

	try {
		const { rows } = await pool.query<Product>(
			`SELECT ${columns} ${filters.join(" ")} ORDER BY ${sorts[sort]} LIMIT $${args.length - 1} OFFSET $${args.length}`,
			args,
		);

		const products: Product[] = rows;

		res.json(products);
	} catch (error) {
		problem(res, 500, error);
	}
});

/**
 * @openapi
 * /products/{slug}:
 *   get:
 *     summary: Fetch one product by slug
 *     tags: [products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Product slug
 *         schema: { type: string }
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Product" }
 *       "404":
 *         description: No such product
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "500":
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 */
router.get("/products/:slug", async (req, res) => {
	try {
		const { rows } = await pool.query<Product>(
			`SELECT ${columns} AND p.slug = $1`,
			[req.params.slug],
		);

		const [product] = rows;

		if (product === undefined) {
			problem(res, 404, "no such product");
			return;
		}

		res.json(product);
	} catch (error) {
		problem(res, 500, error);
	}
});
