import { readFile } from "node:fs/promises";

import { expect, test } from "vite-plus/test";

import { slugify } from "#/lib/slug";

const MAX_LENGTH = 60;

test("matches the shared fixtures", async () => {
	const fixtures: Array<{ name: string; slug: string }> = JSON.parse(
		await readFile(
			new URL("../../../slug-fixtures.json", import.meta.url),
			"utf8",
		),
	);

	expect(fixtures.length).toBeGreaterThan(0);

	expect(
		fixtures.map(({ name }) => ({ name, slug: slugify(name) })),
	).toStrictEqual(fixtures);
});

test("never yields an empty or dash-edged slug", () => {
	const names = ["", "---", "  ", "!!!", "🎉", "-a-", "Ω"];

	const bad = names.filter((name) => {
		const got = slugify(name);

		return got === "" || got.startsWith("-") || got.endsWith("-");
	});

	expect(bad).toStrictEqual([]);
});

test("truncates on a word boundary", () => {
	const got = slugify(
		"Kaos Polos Hitam Premium Cotton Combed 30s Unisex Lengan Pendek Original",
	);

	expect(got.length).toBeLessThanOrEqual(MAX_LENGTH);
	expect(got.endsWith("-")).toBe(false);
});
