import type {
	BaseAttributeKey,
	SlotBean,
	SlotBeans,
} from "@/types/team-builder";

export const MAX_BEAN_POINTS = 198;
export const BEAN_SLOTS_COUNT = 3;

export function clampBeanValue(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	const rounded = Math.round(value);
	return Math.min(MAX_BEAN_POINTS, Math.max(0, rounded));
}

export function createEmptySlotBeans(): SlotBeans {
	return Array.from({ length: BEAN_SLOTS_COUNT }, () => ({
		attribute: null,
		value: 0,
	})) as SlotBeans;
}

export function normalizeSlotBeans(beans?: SlotBean[] | null): SlotBeans {
	const base = createEmptySlotBeans();
	if (!beans?.length) {
		return base;
	}
	return base.map((bean, index) => {
		const source = beans[index];
		if (!source) return bean;
		return {
			attribute: (source.attribute as BaseAttributeKey | null) ?? null,
			value: clampBeanValue(source.value ?? 0),
		};
	}) as SlotBeans;
}
