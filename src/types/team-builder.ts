import type { FormationSlot } from "@/data/formations";
import type { BaseStats, PowerStats } from "@/lib/inazuma-math";
import type { PlayerRecord } from "@/lib/players-data";

export type FiltersState = {
	search: string;
	element: string;
	position: string;
	role: string;
};

export type EquipmentCategory = "boots" | "bracelets" | "pendants" | "misc";

export type SlotRarity =
	| "normal"
	| "growing"
	| "advanced"
	| "top"
	| "legendary"
	| "hero";

export type BaseAttributeKey =
	| "kick"
	| "control"
	| "technique"
	| "pressure"
	| "physical"
	| "agility"
	| "intelligence";

export type SlotEquipments = Record<EquipmentCategory, string | null>;

export type SlotBean = {
	attribute: BaseAttributeKey | null;
	value: number;
};

export type SlotBeans = [SlotBean, SlotBean, SlotBean];

export type SlotConfig = {
	rarity: SlotRarity;
	equipments: SlotEquipments;
	beans: SlotBeans;
};

export type SlotComputedStats = {
	base: BaseStats;
	power: PowerStats;
	equipmentBonuses: Record<BaseAttributeKey, number>;
	beanBonuses: Record<BaseAttributeKey, number>;
};

export type SlotKind = "starter" | "reserve" | "manager" | "coordinator";

export type TeamBuilderSlot = Omit<FormationSlot, "label"> & {
	label: FormationSlot["label"] | string;
	kind: SlotKind;
	displayLabel?: string;
	configScope: "full" | "rarity-only";
};

export type SlotAssignment = {
	slot: TeamBuilderSlot;
	player: PlayerRecord | null;
	config: SlotConfig;
	computed: SlotComputedStats | null;
};
