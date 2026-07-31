import { compare, hash } from "bcryptjs";
import { Router } from "express";

import { pool } from "#/lib/db";
import { problem } from "#/lib/problem";
import { sign } from "#/lib/token";

// distinguishing a missing account from a bad password is a user-enumeration oracle
const invalidCredentials = "invalid email or password";

function isEmail(value: unknown): value is string {
	return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const router: Router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       properties:
 *         name: { type: string }
 *         email: { type: string }
 *         password: { type: string, minLength: 8 }
 *       required: [email, name, password]
 *     LoginRequest:
 *       type: object
 *       properties:
 *         email: { type: string }
 *         password: { type: string }
 *       required: [email, password]
 *     TokenResponse:
 *       type: object
 *       properties:
 *         token: { type: string }
 *       required: [token]
 *
 * /auth/register:
 *   post:
 *     summary: Register an account
 *     tags: [auth]
 *     requestBody:
 *       description: Credentials
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RegisterRequest"
 *             summary: body
 *             description: Credentials
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/TokenResponse" }
 *       "400":
 *         description: Invalid body
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "409":
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "500":
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 */
router.post("/auth/register", async (req, res) => {
	const { name, email, password } = (req.body ?? {}) as Record<string, unknown>;

	if (
		typeof name !== "string" ||
		name === "" ||
		!isEmail(email) ||
		typeof password !== "string" ||
		password.length < 8
	) {
		problem(
			res,
			400,
			"name, email and a password of at least 8 characters are required",
		);
		return;
	}

	try {
		const passwordHash = await hash(password, 10);

		const { rows } = await pool.query<{ id: string }>(
			"INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
			[name, email, passwordHash],
		);

		const [user] = rows;

		res.status(201).json({ token: sign(Number(user?.id)) });
	} catch (error) {
		// unique_violation
		if ((error as { code?: string }).code === "23505") {
			problem(res, 409, "email already registered");
			return;
		}

		problem(res, 500, error);
	}
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Exchange credentials for a token
 *     tags: [auth]
 *     requestBody:
 *       description: Credentials
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/LoginRequest"
 *             summary: body
 *             description: Credentials
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/TokenResponse" }
 *       "400":
 *         description: Invalid body
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "401":
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 *       "500":
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 */
router.post("/auth/login", async (req, res) => {
	const { email, password } = (req.body ?? {}) as Record<string, unknown>;

	if (!isEmail(email) || typeof password !== "string" || password === "") {
		problem(res, 400, "email and password are required");
		return;
	}

	try {
		const { rows } = await pool.query<{ id: string; password_hash: string }>(
			"SELECT id, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL",
			[email],
		);

		const [user] = rows;

		if (user === undefined || !(await compare(password, user.password_hash))) {
			problem(res, 401, invalidCredentials);
			return;
		}

		res.json({ token: sign(Number(user.id)) });
	} catch (error) {
		problem(res, 500, error);
	}
});
