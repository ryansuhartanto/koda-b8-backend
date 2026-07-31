import { Router } from "express";
import { expect, test } from "vite-plus/test";

import { serve } from "#/lib/serve";
import { auth } from "#/middleware/auth";

test("auth rejects a missing token", async () => {
	const router = Router();
	router.get("/protected", auth, (_req, res) => {
		res.sendStatus(200);
	});

	await serve(router, async (url) => {
		const res = await fetch(`${url}/protected`);

		expect(res.status).toBe(401);
		expect(res.headers.get("content-type")).toContain(
			"application/problem+json",
		);
	});
});
