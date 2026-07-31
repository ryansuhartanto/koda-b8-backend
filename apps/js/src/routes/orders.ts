import { Router } from "express";

import { pool } from "#/lib/db";
import { problem } from "#/lib/problem";
import { auth } from "#/middleware/auth";
import type { Order, OrderItem, OrderRequest } from "#/model/order";

const createdAt = `TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

const columns = `o.id, ${createdAt} AS created_at, o.status, o.payment_method,
	COALESCE(o.promo_code, '') AS promo_code, o.discount_idr, o.subtotal_idr, o.ship_cost_idr, o.total_idr,
	o.ship_name, o.ship_phone, o.ship_email, o.ship_address, o.ship_city, o.ship_province,
	o.ship_postal_code, o.ship_method, COALESCE(o.ship_note, '') AS ship_note`;

function toOrderRequest(body: unknown): OrderRequest | undefined {
	const raw = (body ?? {}) as Record<string, unknown>;
	const promoCode = raw["promo_code"] ?? "";
	const shipNote = raw["ship_note"] ?? "";

	if (
		!Number.isInteger(raw["id_address"]) ||
		typeof raw["payment_method"] !== "string" ||
		raw["payment_method"] === "" ||
		typeof raw["ship_method"] !== "string" ||
		raw["ship_method"] === "" ||
		typeof promoCode !== "string" ||
		typeof shipNote !== "string"
	) {
		return undefined;
	}

	return {
		id_address: raw["id_address"] as number,
		payment_method: raw["payment_method"],
		ship_method: raw["ship_method"],
		promo_code: promoCode,
		ship_note: shipNote,
	};
}

export const router: Router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         id_product: { type: integer }
 *         product_name: { type: string }
 *         unit_price_idr: { type: integer }
 *         quantity: { type: integer }
 *       required: [id, id_product, product_name, quantity, unit_price_idr]
 *     Order:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         created_at: { type: string }
 *         status: { type: string }
 *         payment_method: { type: string }
 *         promo_code: { type: string }
 *         discount_idr: { type: integer }
 *         subtotal_idr: { type: integer }
 *         ship_cost_idr: { type: integer }
 *         total_idr: { type: integer }
 *         ship_name: { type: string }
 *         ship_phone: { type: string }
 *         ship_email: { type: string }
 *         ship_address: { type: string }
 *         ship_city: { type: string }
 *         ship_province: { type: string }
 *         ship_postal_code: { type: string }
 *         ship_method: { type: string }
 *         ship_note: { type: string }
 *         items:
 *           { type: array, items: { $ref: "#/components/schemas/OrderItem" }, uniqueItems: false }
 *       required:
 *         [created_at, discount_idr, id, items, payment_method, promo_code, ship_address,
 *          ship_city, ship_cost_idr, ship_email, ship_method, ship_name, ship_note,
 *          ship_phone, ship_postal_code, ship_province, status, subtotal_idr, total_idr]
 *     OrderRequest:
 *       type: object
 *       properties:
 *         id_address: { type: integer }
 *         payment_method: { type: string }
 *         ship_method: { type: string }
 *         promo_code: { type: string }
 *         ship_note: { type: string }
 *       required: [id_address, payment_method, ship_method]
 *
 * /orders:
 *   get:
 *     summary: List the caller's orders, newest first
 *     tags: [orders]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: "#/components/schemas/Order" } }
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
 *     summary: Turn the caller's cart into an order
 *     tags: [orders]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       description: Checkout
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/OrderRequest"
 *             summary: body
 *             description: Checkout
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Order" }
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
 *         description: No such address or shipping method
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "409":
 *         description: Empty cart or insufficient stock
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "500":
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 */
router.get("/orders", auth, async (req, res) => {
	try {
		const { rows } = await pool.query<Omit<Order, "items">>(
			`SELECT ${columns}
			FROM orders o
			WHERE o.id_user = $1 AND o.deleted_at IS NULL
			ORDER BY o.created_at DESC, o.id DESC`,
			[req.idUser],
		);

		const lines = await pool.query<OrderItem & { id_order: number }>(
			`SELECT id_order, id, COALESCE(id_product, 0) AS id_product, product_name, unit_price_idr, quantity
			FROM order_items
			WHERE id_order = ANY($1)
			ORDER BY id`,
			[rows.map((order) => order.id)],
		);

		const orders: Order[] = [];

		for (const order of rows) {
			const items: OrderItem[] = [];

			for (const { id_order: idOrder, ...item } of lines.rows) {
				if (idOrder === order.id) {
					items.push(item);
				}
			}

			orders.push(Object.assign(order, { items }));
		}

		res.json(orders);
	} catch (error) {
		problem(res, 500, error);
	}
});

router.post("/orders", auth, async (req, res) => {
	const body = toOrderRequest(req.body);

	if (body === undefined) {
		problem(
			res,
			400,
			"id_address, payment_method and ship_method are required",
		);
		return;
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const address = await client.query<{
			name: string;
			phone: string;
			email: string;
			address: string;
			city: string;
			province: string;
			postal_code: string;
		}>(
			`SELECT a.name, a.phone, u.email, a.address, a.city, a.province, a.postal_code
			FROM addresses a
			JOIN users u ON u.id = a.id_user
			WHERE a.id = $1 AND a.id_user = $2 AND a.deleted_at IS NULL`,
			[body.id_address, req.idUser],
		);

		const [ship] = address.rows;

		if (ship === undefined) {
			await client.query("ROLLBACK");
			problem(res, 404, "no such address");
			return;
		}

		const method = await client.query<{ cost_idr: number }>(
			"SELECT cost_idr FROM shipping_methods WHERE name = $1 AND deleted_at IS NULL",
			[body.ship_method],
		);

		const [shipping] = method.rows;

		if (shipping === undefined) {
			await client.query("ROLLBACK");
			problem(res, 404, "no such shipping method");
			return;
		}

		// ordered by id so that two checkouts touching the same products take the row locks in
		// the same sequence and cannot deadlock
		const cart = await client.query<{
			id: number;
			name: string;
			price_idr: number;
			stock: number;
			quantity: number;
		}>(
			`SELECT p.id, p.name, p.price_idr, p.stock, ci.quantity
			FROM cart_items ci
			JOIN products p ON p.id = ci.id_product AND p.deleted_at IS NULL
			WHERE ci.id_user = $1
			ORDER BY p.id
			FOR UPDATE OF p`,
			[req.idUser],
		);

		if (cart.rows.length === 0) {
			await client.query("ROLLBACK");
			problem(res, 409, "cart is empty");
			return;
		}

		let subtotalIdr = 0;

		for (const line of cart.rows) {
			if (line.quantity > line.stock) {
				await client.query("ROLLBACK");
				problem(res, 409, `not enough stock for ${line.name}`);
				return;
			}

			subtotalIdr += line.price_idr * line.quantity;
		}

		const created = await client.query<Omit<Order, "items">>(
			`INSERT INTO orders AS o (
				id_user, payment_method, promo_code, discount_idr, subtotal_idr, ship_cost_idr, total_idr,
				ship_name, ship_phone, ship_email, ship_address, ship_city, ship_province, ship_postal_code,
				ship_method, ship_note
			) VALUES ($1, $2, NULLIF($3, ''), 0, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NULLIF($15, ''))
			RETURNING ${columns}`,
			[
				req.idUser,
				body.payment_method,
				body.promo_code,
				subtotalIdr,
				shipping.cost_idr,
				subtotalIdr + shipping.cost_idr,
				ship.name,
				ship.phone,
				ship.email,
				ship.address,
				ship.city,
				ship.province,
				ship.postal_code,
				body.ship_method,
				body.ship_note,
			],
		);

		const [order] = created.rows;

		if (order === undefined) {
			throw new Error("insert returned no row");
		}

		const items: OrderItem[] = [];

		for (const line of cart.rows) {
			const inserted = await client.query<OrderItem>(
				`INSERT INTO order_items (id_order, id_product, product_name, unit_price_idr, quantity)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING id, COALESCE(id_product, 0) AS id_product, product_name, unit_price_idr, quantity`,
				[order.id, line.id, line.name, line.price_idr, line.quantity],
			);

			const [item] = inserted.rows;

			if (item === undefined) {
				throw new Error("insert returned no row");
			}

			items.push(item);

			await client.query(
				"UPDATE products SET stock = stock - $1 WHERE id = $2",
				[line.quantity, line.id],
			);
		}

		await client.query("DELETE FROM cart_items WHERE id_user = $1", [
			req.idUser,
		]);

		await client.query("COMMIT");

		res.status(201).json({ ...order, items });
	} catch (error) {
		await client.query("ROLLBACK");
		problem(res, 500, error);
	} finally {
		client.release();
	}
});
