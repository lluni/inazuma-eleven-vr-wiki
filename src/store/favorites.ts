import { atomWithStorage, createJSONStorage } from "jotai/utils";

const FAVORITE_PLAYERS_STORAGE_KEY = "inazuma-guide.favorites.v1";

const storage =
	typeof window === "undefined"
		? undefined
		: createJSONStorage<number[]>(() => window.localStorage);

export const favoritePlayersAtom = atomWithStorage<number[]>(
	FAVORITE_PLAYERS_STORAGE_KEY,
	[],
	storage,
);

