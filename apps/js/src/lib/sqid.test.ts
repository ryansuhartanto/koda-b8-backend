import { expect, test, vi } from "vite-plus/test";

import { decode, encode } from "#/lib/sqid";

const ALPHABET =
	"k3G7QAe51FfL2rl4wRxyOzZbnucItJ8hgSpEmvNiHqKMWXdVaCDBjT0YoU6P9s";
const MIN_LENGTH = 6;
const TOO_SHORT = "sqid alphabet must be at least 16 characters";
const NOT_AN_ID = "sqid ids must be non-negative safe integers";

process.env["SQIDS_ALPHABET"] = ALPHABET;

test("round-trips across a wide id range", () => {
	const ids = [0, 1, 2, 9, 10, 99, 100, 1000, 123456, 2147483647];

	expect(ids.map((id) => decode(encode(id)))).toStrictEqual(ids);
	expect(ids.filter((id) => encode(id).length < MIN_LENGTH)).toStrictEqual([]);
});

test("rejects garbage and non-canonical forms", () => {
	const valid = encode(42);

	const cases: Record<string, string> = {
		"empty": "",
		"zero": "0",
		"out of alphabet": "!!!!!!",
		"padded": `${valid} `,
		"absurdly long": ALPHABET.repeat(100),
		"trailing garbage": `${valid}zzzz`,
		"non-canonical": ALPHABET.slice(0, 1) + valid,
	};

	const accepted = Object.entries(cases)
		.filter(([, input]) => decode(input) !== undefined)
		.map(([name]) => name);

	expect(accepted).toStrictEqual([]);
});

test("rejects a negative id", () => {
	expect(() => encode(-1)).toThrow(NOT_AN_ID);
});

test("rejects an alphabet short enough to fall back to the public default", async () => {
	const before = process.env["SQIDS_ALPHABET"];

	try {
		for (const alphabet of ["", "abc"]) {
			vi.resetModules();
			process.env["SQIDS_ALPHABET"] = alphabet;

			const fresh = await import("#/lib/sqid");

			expect(() => fresh.encode(1)).toThrow(TOO_SHORT);
		}
	} finally {
		process.env["SQIDS_ALPHABET"] = before;
		vi.resetModules();
	}
});
