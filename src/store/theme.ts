import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type ThemePreference = "light" | "dark";

export const THEME_STORAGE_KEY = "inazuma-guide.theme";

const storage =
	typeof window === "undefined"
		? undefined
		: createJSONStorage<ThemePreference>(() => window.localStorage);

const getPreferredScheme = (): ThemePreference => {
	if (typeof window === "undefined") {
		return "dark";
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

export const themePreferenceAtom = atomWithStorage<ThemePreference>(
	THEME_STORAGE_KEY,
	getPreferredScheme(),
	storage,
);
