import { once } from "node:events";
import type { AddressInfo } from "node:net";

import express from "express";
import type { Router } from "express";

export async function serve(
	router: Router,
	fn: (url: string) => Promise<void>,
): Promise<void> {
	const server = express().use(express.json()).use(router).listen(0);
	await once(server, "listening");

	try {
		await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
	} finally {
		server.close();
		await once(server, "close");
	}
}
