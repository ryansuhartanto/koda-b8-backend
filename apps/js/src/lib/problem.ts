import { STATUS_CODES } from "node:http";

import type { Response } from "express";

// AggregateError has an empty message; the causes live on .errors
function detailOf(cause: unknown): string {
	if (cause instanceof AggregateError) {
		return cause.errors.map(detailOf).join("; ");
	}

	return cause instanceof Error ? cause.message : String(cause);
}

// RFC 9457 application/problem+json
export function problem(res: Response, status: number, cause?: unknown): void {
	res
		.status(status)
		.type("application/problem+json")
		.json({
			title: STATUS_CODES[status] ?? "Error",
			status,
			detail: cause === undefined ? undefined : detailOf(cause),
		});
}
