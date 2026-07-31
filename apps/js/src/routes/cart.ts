import { Router } from "express";

import { pool } from "#/lib/db";
import { problem } from "#/lib/problem";
import { auth } from "#/middleware/auth";
import type { CartItem, CartRequest } from "#/model/cart";

function toCartRequest(body: unknown): CartRequest | undefined {
	const { id_product, quantity } = (body ?? {}) as Record<string, unknown>;

	if (
		!Number.isInteger(id_product) ||
		!Number.isInteger(quantity) ||
		(quantity as number) < 1
	) {
		return undefined;
	}

	return { id_product: id_product as number, quantity: quantity as number };
}

export const router: Router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         id_product: { type: integer }
 *         slug: { type: string }
 *         name: { type: string }
 *         img: { type: string }
 *         price_idr: { type: integer }
 *         quantity: { type: integer }
 *       required: [id_product, img, name, price_idr, quantity, slug]
 *     CartRequest:
 *       type: object
 *       properties:
 *         id_product: { type: integer }
 *         quantity: { type: integer, minimum: 1 }
 *       required: [id_product, quantity]
 *
 * /cart:
 *   get:
 *     summary: List the caller's cart
 *     tags: [cart]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: "#/components/schemas/CartItem" } }
 *       "401":
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "500":
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *   post:
 *     summary: Set the quantity of one cart line
 *     tags: [cart]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       description: Line
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CartRequest"
 *             summary: body
 *             description: Line
 *     responses:
 *       "204":
 *         description: No Content
 *       "400":
 *         description: Invalid body
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "401":
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
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
router.get("/cart", auth, async (req, res) => {
	try {
		const { rows } = await pool.query<CartItem>(
			`SELECT ci.id_product, p.slug, p.name, COALESCE(p.img, '') AS img, p.price_idr, ci.quantity
			FROM cart_items ci
			JOIN products p ON p.id = ci.id_product AND p.deleted_at IS NULL
			WHERE ci.id_user = $1
			ORDER BY ci.created_at, ci.id_product`,
			[req.idUser],
		);

		const items: CartItem[] = rows;

		res.json(items);
	} catch (error) {
		problem(res, 500, error);
	}
});

router.post("/cart", auth, async (req, res) => {
	const body = toCartRequest(req.body);

	if (body === undefined) {
		problem(res, 400, "id_product and a quantity of at least 1 are required");
		return;
	}

	try {
		// SELECT rather than a literal id, so a soft-deleted product is rejected with no
		// check-then-insert window
		const { rowCount } = await pool.query(
			`INSERT INTO cart_items (id_user, id_product, quantity)
			SELECT $1, p.id, $3 FROM products p WHERE p.id = $2 AND p.deleted_at IS NULL
			ON CONFLICT (id_user, id_product) DO UPDATE SET quantity = EXCLUDED.quantity`,
			[req.idUser, body.id_product, body.quantity],
		);

		if (rowCount === 0) {
			problem(res, 404, "no such product");
			return;
		}

		res.sendStatus(204);
	} catch (error) {
		problem(res, 500, error);
	}
});

/**
 * @openapi
 * /cart/{id_product}:
 *   delete:
 *     summary: Remove one product from the cart
 *     tags: [cart]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id_product
 *         required: true
 *         description: Product id
 *         schema: { type: integer }
 *     responses:
 *       "204":
 *         description: No Content
 *       "400":
 *         description: Invalid product id
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "401":
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "500":
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 */
router.delete("/cart/:id_product", auth, async (req, res) => {
	const raw = req.params["id_product"];
	const idProduct = typeof raw === "string" ? raw : "";

	if (!/^-?\d+$/.test(idProduct)) {
		problem(res, 400, "id_product must be an integer");
		return;
	}

	try {
		// no 404 branch, because DELETE is idempotent
		await pool.query(
			"DELETE FROM cart_items WHERE id_user = $1 AND id_product = $2",
			[req.idUser, Number(idProduct)],
		);

		res.sendStatus(204);
	} catch (error) {
		problem(res, 500, error);
	}
});
