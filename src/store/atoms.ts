import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import {
	type DigimonDetails,
	type DigimonSummary,
	fetchDigimonDetails,
	fetchDigimonList,
} from "@/lib/grindosaur";

// Controls whether the mobile footer on Residents is expanded
export const footerExpandedAtom = atom(false);

// GitHub repository latest update metadata
export type RepoUpdateInfo = {
	isoTimestamp: string | null;
	relativeLabel: string | null;
	loading: boolean;
	error: string | null;
};

export const repoUpdateAtom = atom<RepoUpdateInfo>({
	isoTimestamp: null,
	relativeLabel: null,
	loading: false,
	error: null,
});

// Digimon catalog and details cache
export const digimonListAtom = atom<Promise<DigimonSummary[]>>(async () => {
	return fetchDigimonList();
});

export const digimonDetailsAtomFamily = atomFamily((slug: string) =>
	atom<Promise<DigimonDetails>>(async () => {
		return fetchDigimonDetails(slug);
	}),
);
