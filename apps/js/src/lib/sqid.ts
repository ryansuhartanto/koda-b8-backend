import Sqids from "sqids";

import { slugify } from "#/lib/slug";

const MIN_LENGTH = 6;
const MIN_ALPHABET = 16;

let shared: Sqids | undefined;

function sqids(): Sqids {
	if (shared === undefined) {
		const alphabet = process.env["SQIDS_ALPHABET"] ?? "";

		if (alphabet.length < MIN_ALPHABET) {
			throw new RangeError("sqid alphabet must be at least 16 characters");
		}

		shared = new Sqids({ alphabet, minLength: MIN_LENGTH });
	}

	return shared;
}

export function encode(id: number): string {
	if (!Number.isSafeInteger(id) || id < 0) {
		throw new RangeError("sqid ids must be non-negative safe integers");
	}

	return sqids().encode([id]);
}

export function decode(s: string): number | undefined {
	const ids = sqids().decode(s);
	const [id] = ids;

	if (ids.length !== 1 || id === undefined || !Number.isSafeInteger(id)) {
		return undefined;
	}

	return sqids().encode([id]) === s ? id : undefined;
}

export function productPath(sqid: string, name: string): string {
	return `/products/${sqid}/${slugify(name)}`;
}
