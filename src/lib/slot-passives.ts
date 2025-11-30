import type { SlotPassives, SlotPassivePreset } from "@/types/team-builder";

export const PASSIVE_PRESET_SLOTS = 5;
export const MAX_SLOT_PASSIVES = 6;

export function createEmptySlotPassives(): SlotPassives {
	return {
		presets: createEmptyPresetList(),
		custom: createEmptyPassivePreset(),
	};
}

export function normalizeSlotPassives(
	value?: SlotPassives | null,
): SlotPassives {
	const sourcePresets = Array.isArray(value?.presets) ? value?.presets ?? [] : [];
	const presets = Array.from({ length: PASSIVE_PRESET_SLOTS }, (_, index) =>
		normalizePreset(sourcePresets[index]),
	) as SlotPassives["presets"];

	const custom = normalizePreset(value?.custom);

	return {
		presets,
		custom,
	};
}

export function clampPassiveValue(value: number): number {
	const numeric = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(numeric)) {
		return 0;
	}
	return Math.max(-999, Math.min(999, Number(numeric.toFixed(2))));
}

function createEmptyPresetList(): SlotPassives["presets"] {
	return Array.from({ length: PASSIVE_PRESET_SLOTS }, () =>
		createEmptyPassivePreset(),
	) as SlotPassives["presets"];
}

function createEmptyPassivePreset(): SlotPassivePreset {
	return {
		passiveId: null,
		value: 0,
	};
}

function normalizePreset(
	input?: SlotPassivePreset | null,
): SlotPassivePreset {
	const normalizedPassiveId =
		typeof input?.passiveId === "string"
			? input.passiveId.trim() || null
			: typeof input?.passiveId === "number" && Number.isFinite(input.passiveId)
				? String(input.passiveId)
				: null;

	return {
		passiveId: normalizedPassiveId,
		value: clampPassiveValue(
			typeof input?.value === "number" ? input.value : Number(input?.value) || 0,
		),
	};
}
