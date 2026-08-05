import { expect, test } from "vite-plus/test";

import { serve } from "#/lib/serve";
import { router } from "#/routes/products";

process.env["SQIDS_ALPHABET"] =
	"k3G7QAe51FfL2rl4wRxyOzZbnucItJ8hgSpEmvNiHqKMWXdVaCDBjT0YoU6P9s";

test("list rejects an unknown sort", async () => {
	await serve(router, async (url) => {
		const res = await fetch(`${url}/products?sort=bogus`);

		expect(res.status).toBe(400);
		expect(res.headers.get("content-type")).toContain(
			"application/problem+json",
		);
	});
});

test("a malformed sqid is rejected in both URL shapes", async () => {
	const paths = [
		"/products/!!!!!!",
		"/products/a",
		"/products/!!!!!!/kaos-polos",
	];

	await serve(router, async (url) => {
		const got = await Promise.all(
			paths.map(async (path) => {
				const res = await fetch(`${url}${path}`, { redirect: "manual" });

				return {
					path,
					status: res.status,
					problem: res.headers
						.get("content-type")
						?.includes("application/problem+json"),
				};
			}),
		);

		expect(got).toStrictEqual(
			paths.map((path) => ({ path, status: 404, problem: true })),
		);
	});
});
