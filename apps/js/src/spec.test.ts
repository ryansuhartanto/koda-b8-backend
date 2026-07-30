import { readFile } from "node:fs/promises";

import { expect, test } from "vite-plus/test";

const read = async (path: string): Promise<Record<string, unknown>> =>
	JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")) as Record<
		string,
		unknown
	>;

// swag stubs an empty externalDocs that no annotation suppresses
function contract(spec: Record<string, unknown>): unknown {
	const { servers: _servers, externalDocs: _externalDocs, ...rest } = spec;

	return sortDeep(rest);
}

function sortDeep(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value
			.map(sortDeep)
			.toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
	}

	if (value === null || typeof value !== "object") {
		return value;
	}

	return Object.fromEntries(
		Object.entries(value)
			.toSorted(([a], [b]) => a.localeCompare(b))
			.map(([key, inner]) => [key, sortDeep(inner)]),
	);
}

test("go and js describe the same API", async () => {
	const go = await read("../../go/docs/swagger.json");
	const js = await read("../openapi.json");

	expect(contract(js)).toStrictEqual(contract(go));
});
