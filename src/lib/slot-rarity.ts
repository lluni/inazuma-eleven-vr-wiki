import { normalizeStat } from "@/lib/data-helpers";
import type { SlotRarity } from "@/types/team-builder";

type RarityDefinition = {
	value: SlotRarity;
	label: string;
	multiplier: number;
	accent: string;
	cardBackground: string;
};

const rarityDefinitions: Record<SlotRarity, RarityDefinition> = {
	normal: {
		value: "normal",
		label: "Normal",
		multiplier: 1,
		accent: "#94a3b8",
		cardBackground: "#4b5563",
	},
	growing: {
		value: "growing",
		label: "Growing",
		multiplier: 1.1,
		accent: "#38bdf8",
		cardBackground: "#2563eb",
	},
	advanced: {
		value: "advanced",
		label: "Advanced",
		multiplier: 1.2,
		accent: "#c084fc",
		cardBackground: "#7c3aed",
	},
	top: {
		value: "top",
		label: "Top",
		multiplier: 1.3,
		accent: "#facc15",
		cardBackground: "#fbbf24",
	},
	legendary: {
		value: "legendary",
		label: "Legendary",
		multiplier: 1.4,
		accent: "#fb923c",
		cardBackground: "#f97316",
	},
	hero: {
		value: "hero",
		label: "Hero",
		multiplier: 1.67,
		accent: "#f472b6",
		cardBackground: "linear-gradient(135deg,#7dd3fc,#f472b6)",
	},
};

export const SLOT_RARITY_DEFINITIONS = rarityDefinitions;

export const SLOT_RARITY_OPTIONS = (
	Object.values(rarityDefinitions) satisfies RarityDefinition[]
).map((definition) => ({
	value: definition.value,
	label: definition.label,
	boostLabel: `+${Math.round((definition.multiplier - 1) * 100)}%`,
	accent: definition.accent,
	cardBackground: definition.cardBackground,
}));

export function getSlotRarityDefinition(rarity: SlotRarity): RarityDefinition {
	return rarityDefinitions[rarity] ?? rarityDefinitions.normal;
}

export function applyRarityBonus(value: number, rarity: SlotRarity): number {
	const base = normalizeStat(value);
	const { multiplier } = getSlotRarityDefinition(rarity);
	return base * multiplier;
}
