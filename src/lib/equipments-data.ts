import bootsJson from "@/assets/data/equipments/boots.json?raw";
import braceletsJson from "@/assets/data/equipments/bracelets.json?raw";
import miscJson from "@/assets/data/equipments/misc.json?raw";
import pendantsJson from "@/assets/data/equipments/pendants.json?raw";
import { normalizeStat, sanitizeAttribute } from "@/lib/data-helpers";
import {
	type BaseStats,
	computePower,
	type PowerStats,
} from "@/lib/inazuma-math";
import type { BaseAttributeKey, EquipmentCategory } from "@/types/team-builder";

type RawEquipmentRecord = {
	Name: string;
	Kick: number | "";
	Control: number | "";
	Technique: number | "";
	Pressure: number | "";
	Physical: number | "";
	Intelligence: number | "";
	Agility: number | "";
	Shop: string;
	id: string;
};

export type EquipmentRecord = {
	id: string;
	name: string;
	type: EquipmentCategory;
	shop: string;
	stats: BaseStats;
	power: PowerStats;
};

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
	"boots",
	"bracelets",
	"pendants",
	"misc",
] as const;

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
	boots: "Boots",
	bracelets: "Bracelets",
	pendants: "Pendants",
	misc: "Misc",
};

const equipmentSources: Record<EquipmentCategory, string> = {
	boots: bootsJson,
	bracelets: braceletsJson,
	pendants: pendantsJson,
	misc: miscJson,
};

const baseAttributeKeys: BaseAttributeKey[] = [
	"kick",
	"control",
	"technique",
	"pressure",
	"physical",
	"agility",
	"intelligence",
];

const rawFieldNameMap: Record<BaseAttributeKey, keyof RawEquipmentRecord> = {
	kick: "Kick",
	control: "Control",
	technique: "Technique",
	pressure: "Pressure",
	physical: "Physical",
	agility: "Agility",
	intelligence: "Intelligence",
};

const parsedEquipments: EquipmentRecord[] = (
	Object.entries(equipmentSources) as Array<[EquipmentCategory, string]>
).flatMap(([type, json]) => {
	const records = JSON.parse(json) as RawEquipmentRecord[];
	return records.map((record) => {
		const statsWithoutTotal = baseAttributeKeys.reduce(
			(acc, key) => {
				const rawValue = record[rawFieldNameMap[key]];
				acc[key] = normalizeStat(rawValue);
				return acc;
			},
			{} as Record<BaseAttributeKey, number>,
		);

		const stats: BaseStats = {
			...statsWithoutTotal,
			total: baseAttributeKeys.reduce(
				(sum, key) => sum + statsWithoutTotal[key],
				0,
			),
		};

		return {
			id: record.id,
			name: sanitizeAttribute(record.Name),
			type,
			shop: sanitizeAttribute(record.Shop),
			stats,
			power: computePower(stats),
		};
	});
});

export const equipmentsDataset: EquipmentRecord[] = parsedEquipments;

export const equipmentsById = new Map<string, EquipmentRecord>(
	parsedEquipments.map((item) => [item.id, item]),
);

export const equipmentsByType: Record<EquipmentCategory, EquipmentRecord[]> =
	EQUIPMENT_CATEGORIES.reduce(
		(acc, category) => {
			acc[category] = parsedEquipments
				.filter((item) => item.type === category)
				.sort((a, b) => {
					const byTotal = b.stats.total - a.stats.total;
					if (byTotal !== 0) return byTotal;
					return a.name.localeCompare(b.name);
				});
			return acc;
		},
		{} as Record<EquipmentCategory, EquipmentRecord[]>,
	);
