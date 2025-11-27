import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type SelectedSkill = {
	name: string;
	effect: string;
	origin: "category" | "personality";
};

export type TeamSlot = {
	id: string;
	forms: string[];
	personality: string | null;
	skill: SelectedSkill | null;
};

const memoryStorage = (() => {
	const map = new Map<string, string>();
	return {
		getItem: (key: string) => map.get(key) ?? null,
		setItem: (key: string, value: string) => {
			map.set(key, value);
		},
		removeItem: (key: string) => {
			map.delete(key);
		},
	};
})();

const storage = createJSONStorage<TeamSlot[]>(() => {
	if (typeof window === "undefined") {
		return memoryStorage;
	}
	return window.localStorage;
});

export const teamSlotsAtom = atomWithStorage<TeamSlot[]>(
	"digimon:team-builder:v1",
	[],
	storage,
);

export const activeTeamSlotIdAtom = atom<string | null>(null);

export function createTeamSlot(rootSlug: string): TeamSlot {
	const uid =
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`;

	return {
		id: uid,
		forms: [rootSlug],
		personality: null,
		skill: null,
	};
}
