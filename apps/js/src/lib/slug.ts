const MAX_LENGTH = 60;
const FALLBACK = "product";

export function slugify(name: string): string {
	let out = "";
	let dash = false;

	for (const r of name.toLowerCase().normalize("NFD")) {
		if (/\p{Mn}/u.test(r)) {
			continue;
		}

		if ((r >= "a" && r <= "z") || (r >= "0" && r <= "9")) {
			out += r;
			dash = false;
			continue;
		}

		if (!dash && out.length > 0) {
			out += "-";
			dash = true;
		}
	}

	let s = out.replace(/-+$/, "");

	if (s.length > MAX_LENGTH) {
		s = s.slice(0, MAX_LENGTH);

		const i = s.lastIndexOf("-");

		if (i > 0) {
			s = s.slice(0, i);
		}

		s = s.replace(/-+$/, "");
	}

	return s === "" ? FALLBACK : s;
}
