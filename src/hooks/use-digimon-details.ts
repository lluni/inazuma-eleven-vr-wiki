import { useAtomValue } from "jotai";
import { useMemo } from "react";
import type { DigimonDetails } from "@/lib/grindosaur";
import { digimonDetailsAtomFamily } from "@/store/atoms";

export function useDigimonDetails(slug: string): DigimonDetails {
	const detailsAtom = useMemo(() => digimonDetailsAtomFamily(slug), [slug]);
	return useAtomValue(detailsAtom);
}
