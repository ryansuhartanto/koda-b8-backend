import express from "express";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

import { spec } from "#/docs";
import { pool } from "#/lib/db";
import { problem } from "#/lib/problem";
import { cors } from "#/middleware/cors";
import { router as auth } from "#/routes/auth";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors);

app.get("/", (_req, res) => {
	res.redirect(301, "/docs");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

app.use(auth);

/**
 * @openapi
 * /healthz:
 *   get:
 *     summary: Liveness and database reachability
 *     tags: [meta]
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: { type: string }
 *       "503":
 *         description: Database unreachable
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Problem" }
 */
app.get("/healthz", async (_req, res) => {
	try {
		await pool.query("SELECT 1");
		res.json({ status: "ok" });
	} catch (error) {
		problem(res, 503, error);
	}
});

export default app;
