import { expect, test } from "vite-plus/test";

import { serve } from "#/lib/serve";
import { router } from "#/routes/auth";

test("register rejects an invalid body", async () => {
	await serve(router, async (url) => {
		const res = await fetch(`${url}/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "nope" }),
		});

		expect(res.status).toBe(400);
		expect(res.headers.get("content-type")).toContain(
			"application/problem+json",
		);
	});
});
