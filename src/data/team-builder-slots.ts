import type { TeamBuilderSlot } from "@/types/team-builder";

const RESERVE_SLOTS: TeamBuilderSlot[] = Array.from(
	{ length: 5 },
	(_, index) => ({
		id: `reserve-${index + 1}`,
		label: `Reserve ${index + 1}`,
		displayLabel: "Reserve",
		column: 3,
		row: 1,
		kind: "reserve",
		configScope: "full",
	}),
);

const MANAGER_SLOT: TeamBuilderSlot = {
	id: "manager-slot",
	label: "Manager",
	displayLabel: "Manager",
	column: 3,
	row: 1,
	kind: "manager",
	configScope: "rarity-only",
};

const COORDINATOR_SLOTS: TeamBuilderSlot[] = Array.from(
	{ length: 3 },
	(_, index) => ({
		id: `coordinator-${index + 1}`,
		label: `Coordinator ${index + 1}`,
		displayLabel: "Support",
		column: 3,
		row: 1,
		kind: "coordinator",
		configScope: "rarity-only",
	}),
);

export const EXTRA_TEAM_SLOTS: TeamBuilderSlot[] = [
	...RESERVE_SLOTS,
	MANAGER_SLOT,
	...COORDINATOR_SLOTS,
];

export const EXTRA_SLOT_IDS = EXTRA_TEAM_SLOTS.map((slot) => slot.id);
