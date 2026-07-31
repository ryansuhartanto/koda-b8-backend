import jwt from "jsonwebtoken";

export const TTL = "24h";

function secret(): string {
	return process.env["JWT_SECRET"] ?? "";
}

export function sign(idUser: number): string {
	return jwt.sign({}, secret(), {
		algorithm: "HS256",
		subject: String(idUser),
		expiresIn: TTL,
	});
}

export function parse(raw: string): number {
	// reject algorithm confusion
	const claims = jwt.verify(raw, secret(), { algorithms: ["HS256"] });

	if (typeof claims === "string" || claims.sub === undefined) {
		throw new Error("token has no subject");
	}

	return Number(claims.sub);
}
