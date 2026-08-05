import { Router } from "express";

import { pool } from "#/lib/db";
import { problem } from "#/lib/problem";
import { slugify } from "#/lib/slug";
import { decode, encode, productPath } from "#/lib/sqid";
import type {
	Product,
	ProductRow,
	ProductVariant,
	ProductVariantRow,
} from "#/model/product";

const sorts: Record<string, string> = {
	newest: "p.created_at DESC, p.id DESC",
	price_asc: "p.price_idr ASC, p.id ASC",
	price_desc: "p.price_idr DESC, p.id DESC",
	rating: "p.rating DESC NULLS LAST, p.id DESC",
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_OFFSET = 2147483647;

// price, stock and rating all live one table away from products, so each is folded to a single row per product
const columns = `
	p.id, p.name, COALESCE(p.description, '') AS description,
	COALESCE(p.brand, '') AS brand, COALESCE(p.category, '') AS category,
	COALESCE(p.img_url, '') AS img_url, COALESCE(p.img_alt, '') AS img_alt,
	p.price_idr, p.original_price_idr,
	p.inventory,
	COALESCE(p.rating, 0)::FLOAT AS rating, p.rating_count
FROM products_summary p
WHERE TRUE`;

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

function toProduct({ id, ...rest }: ProductRow): Product {
	const sqid = encode(id);

	return { id: sqid, path: productPath(sqid, rest.name), ...rest };
}

export const router: Router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         description: { type: string }
 *         inventory: { type: integer }
 *         price_idr: { type: integer }
 *         original_price_idr: { type: integer }
 *       required: [id, inventory, name, original_price_idr, price_idr]
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         path: { type: string }
 *         name: { type: string }
 *         description: { type: string }
 *         brand: { type: string }
 *         category: { type: string }
 *         img_url: { type: string }
 *         img_alt: { type: string }
 *         price_idr: { type: integer }
 *         original_price_idr: { type: integer }
 *         inventory: { type: integer }
 *         rating: { type: number }
 *         rating_count: { type: integer }
 *         variants:
 *           type: array
 *           items: { $ref: "#/components/schemas/ProductVariant" }
 *           uniqueItems: false
 *       required:
 *         [brand, category, id, img_alt, img_url, inventory, name,
 *          original_price_idr, path, price_idr, rating, rating_count]
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
 *         name: brand
 *         description: Brand name
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
	const { search, category, brand } = req.query;
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
		filters.push(`AND p.category = $${args.length}`);
	}

	if (typeof brand === "string" && brand !== "") {
		args.push(brand);
		filters.push(`AND p.brand = $${args.length}`);
	}

	args.push(limit, offset);

	try {
		const { rows } = await pool.query<ProductRow>(
			`SELECT ${columns} ${filters.join(" ")} ORDER BY ${sorts[sort]} LIMIT $${args.length - 1} OFFSET $${args.length}`,
			args,
		);

		const products: Product[] = rows.map(toProduct);

		res.json(products);
	} catch (error) {
		problem(res, 500, error);
	}
});

/**
 * @openapi
 * /products/{sqid}/{slug}:
 *   get:
 *     summary: Fetch one product
 *     tags: [products]
 *     parameters:
 *       - in: path
 *         name: sqid
 *         required: true
 *         description: Product sqid
 *         schema: { type: string }
 *       - in: path
 *         name: slug
 *         description: Decorative slug, ignored when resolving and corrected by redirect
 *         schema: { type: string }
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Product" }
 *       "302":
 *         description: Slug is absent or stale
 *         content:
 *           application/json:
 *             schema: { type: string }
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
async function productBySqid(
	rawSqid: string,
	rawSlug: string,
	res: Parameters<Parameters<Router["get"]>[1]>[1],
): Promise<void> {
	const id = decode(rawSqid);

	if (id === undefined) {
		problem(res, 404, "no such product");
		return;
	}

	try {
		const { rows } = await pool.query<ProductRow>(
			`SELECT ${columns} AND p.id = $1`,
			[id],
		);

		const [row] = rows;

		if (row === undefined) {
			problem(res, 404, "no such product");
			return;
		}

		const product = toProduct(row);

		if (rawSlug !== slugify(product.name)) {
			res.redirect(302, product.path);
			return;
		}

		const { rows: variants } = await pool.query<ProductVariantRow>(
			`SELECT pv.id, pv.name, COALESCE(pv.description, '') AS description,
				pv.inventory, pp.price_idr, pp.original_price_idr
			FROM products_variants pv
			JOIN products_price pp ON pp.id_variant = pv.id
			WHERE pv.id_product = $1 AND pv.deleted_at IS NULL
			ORDER BY pv.position ASC, pv.id ASC`,
			[id],
		);

		product.variants = variants.map(
			(row): ProductVariant => ({
				id: encode(row.id),
				name: row.name,
				description: row.description,
				inventory: row.inventory,
				price_idr: row.price_idr,
				original_price_idr: row.original_price_idr,
			}),
		);

		res.json(product);
	} catch (error) {
		problem(res, 500, error);
	}
}

router.get("/products/:sqid", async (req, res) => {
	await productBySqid(req.params.sqid, "", res);
});

router.get("/products/:sqid/*slug", async (req, res) => {
	const raw = (req.params as Record<string, string | string[]>)["slug"];

	await productBySqid(
		req.params.sqid,
		Array.isArray(raw) ? raw.join("/") : (raw ?? ""),
		res,
	);
});
