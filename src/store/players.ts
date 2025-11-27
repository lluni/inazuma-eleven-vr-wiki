import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type PlayersViewMode = "stats" | "power";
export type PlayersSortDirection = "asc" | "desc";
export type PlayersSortKey =
	| "total"
	| "kick"
	| "control"
	| "technique"
	| "pressure"
	| "physical"
	| "agility"
	| "intelligence"
	| "shootAT"
	| "focusAT"
	| "focusDF"
	| "wallDF"
	| "scrambleAT"
	| "scrambleDF"
	| "kp";

export type PlayersPreferences = {
	search: string;
	element: string;
	position: string;
	role: string;
	viewMode: PlayersViewMode;
	sortKeys: PlayersSortKey[];
	sortDirection: PlayersSortDirection;
};

export const PLAYERS_PREFERENCES_KEY = "inazuma-guide.players.v1";

export const DEFAULT_PLAYERS_PREFERENCES: PlayersPreferences = {
	search: "",
	element: "all",
	position: "all",
	role: "all",
	viewMode: "stats",
	sortKeys: ["total"],
	sortDirection: "desc",
};

const storage =
	typeof window === "undefined"
		? undefined
		: createJSONStorage<PlayersPreferences>(() => window.localStorage);

export const playersPreferencesAtom = atomWithStorage<PlayersPreferences>(
	PLAYERS_PREFERENCES_KEY,
	DEFAULT_PLAYERS_PREFERENCES,
	storage,
);

