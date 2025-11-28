import { atomWithStorage, createJSONStorage } from "jotai/utils";

export const CHANGELOG_STORAGE_KEY = "inazuma-guide.changelog.version";

const storage =
	typeof window === "undefined"
		? undefined
		: createJSONStorage<string | null>(() => window.localStorage);

export const changelogLastSeenVersionAtom = atomWithStorage<string | null>(
	CHANGELOG_STORAGE_KEY,
	null,
	storage,
);
