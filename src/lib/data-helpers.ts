export function normalizeStat(value: unknown): number {
	const numeric = typeof value === "number" ? value : Number(value);
	return Number.isFinite(numeric) ? numeric : 0;
}

export function formatNumber(value: number): string {
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		return "—";
	}
	return Number.isInteger(numericValue)
		? numericValue.toString()
		: numericValue.toFixed(1).replace(/\.0$/, "");
}

export function titleCase(value: string): string {
	if (!value) return "";
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export function sanitizeAttribute(value: string | null | undefined): string {
	if (typeof value !== "string") return "Unknown";
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : "Unknown";
}

export function createSortedUniqueOptions(values: Array<string | null | undefined>): string[] {
	return Array.from(
		new Set(
			values
				.map((value) => sanitizeAttribute(value))
				.filter((value) => value !== ""),
		),
	).sort((a, b) => a.localeCompare(b));
}

