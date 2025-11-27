import { useMemo } from "react";

import type { DigimonSummary } from "@/lib/grindosaur";

type UseDigimonSearchOptions = {
	limit?: number;
	includeAttribute?: boolean;
};

export function useDigimonSearch(
	list: DigimonSummary[],
	query: string,
	options: UseDigimonSearchOptions = {},
) {
	const { limit = 12, includeAttribute = true } = options;

	return useMemo(() => {
		const trimmed = query.trim().toLowerCase();

		if (!trimmed) {
			return list.slice(0, limit);
		}

		return list
			.filter((entry) => {
				const nameMatch = entry.name.toLowerCase().includes(trimmed);
				const numberMatch = entry.number?.toLowerCase().includes(trimmed);
				const attributeMatch = includeAttribute
					? entry.attribute?.toLowerCase().includes(trimmed)
					: false;
				const generationMatch = entry.generation
					?.toLowerCase()
					.includes(trimmed);
				return nameMatch || numberMatch || attributeMatch || generationMatch;
			})
			.slice(0, limit);
	}, [includeAttribute, limit, list, query]);
}
