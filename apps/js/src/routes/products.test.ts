import { expect, test } from "vite-plus/test";

import { serve } from "#/lib/serve";
import { router } from "#/routes/products";

test("list rejects an unknown sort", async () => {
	await serve(router, async (url) => {
		const res = await fetch(`${url}/products?sort=bogus`);

		expect(res.status).toBe(400);
		expect(res.headers.get("content-type")).toContain(
			"application/problem+json",
		);
	});
});
