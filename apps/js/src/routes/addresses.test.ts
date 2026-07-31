import { expect, test } from "vite-plus/test";

import { serve } from "#/lib/serve";
import { router } from "#/routes/addresses";

test("addresses require a token", async () => {
	await serve(router, async (url) => {
		const res = await fetch(`${url}/addresses`);

		expect(res.status).toBe(401);
		expect(res.headers.get("content-type")).toContain(
			"application/problem+json",
		);
	});
});
