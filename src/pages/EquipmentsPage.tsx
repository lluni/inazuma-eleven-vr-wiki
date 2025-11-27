import { useAtom } from "jotai";
import { RotateCcw, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	createSortedUniqueOptions,
	formatNumber,
	titleCase,
} from "@/lib/data-helpers";
import {
	EQUIPMENT_CATEGORIES,
	EQUIPMENT_CATEGORY_LABELS,
	type EquipmentRecord,
	equipmentsDataset,
} from "@/lib/equipments-data";
import type { BaseStats, PowerStats } from "@/lib/inazuma-math";
import { cn } from "@/lib/utils";
import {
	DEFAULT_EQUIPMENTS_PREFERENCES,
	type EquipmentSortKey,
	type EquipmentsPreferences,
	equipmentsPreferencesAtom,
} from "@/store/equipments";
import type { EquipmentCategory } from "@/types/team-builder";

type EquipmentType = EquipmentCategory;
type Equipment = EquipmentRecord;

type TableColumn = {
	key: string;
	header: ReactNode;
	align?: "left" | "center" | "right";
	className?: string;
	headerClassName?: string;
	render: (item: Equipment) => ReactNode;
};

type EquipmentBaseStatKey = Exclude<keyof BaseStats, "total">;

const baseStatKeys: EquipmentBaseStatKey[] = [
	"kick",
	"control",
	"technique",
	"pressure",
	"physical",
	"agility",
	"intelligence",
];

const powerMetricKeys: Array<keyof PowerStats> = [
	"shootAT",
	"focusAT",
	"focusDF",
	"wallDF",
	"scrambleAT",
	"scrambleDF",
	"kp",
];

const powerMetricLabels: Record<keyof PowerStats, string> = {
	shootAT: "Shoot AT",
	focusAT: "Focus AT",
	focusDF: "Focus DF",
	wallDF: "Wall DF",
	scrambleAT: "Scramble AT",
	scrambleDF: "Scramble DF",
	kp: "KP",
};

const getPowerLabel = (key: keyof PowerStats): string => powerMetricLabels[key];

const equipmentDataset: Equipment[] = equipmentsDataset;

const shopOptions = createSortedUniqueOptions(
	equipmentDataset.map((item) => item.shop),
);

const typeOptions: Array<{ value: EquipmentType | "all"; label: string }> = [
	{ value: "all", label: "All types" },
	...EQUIPMENT_CATEGORIES.map((category) => ({
		value: category,
		label: EQUIPMENT_CATEGORY_LABELS[category],
	})),
];

const attributeOptions: Array<{
	value: EquipmentsPreferences["attribute"];
	label: string;
}> = [
	{ value: "any", label: "Any attribute" },
	...baseStatKeys.map((key) => ({ value: key, label: titleCase(key) })),
];

const sortOptions: Array<{ key: EquipmentSortKey; label: string }> = [
	{ key: "total", label: "Total" },
	...baseStatKeys.map((key) => ({ key, label: titleCase(key) })),
	...powerMetricKeys.map((key) => ({
		key,
		label: getPowerLabel(key),
	})),
];

const metricAccessors: Record<EquipmentSortKey, (item: Equipment) => number> = {
	total: (item) => item.stats.total,
	kick: (item) => item.stats.kick,
	control: (item) => item.stats.control,
	technique: (item) => item.stats.technique,
	pressure: (item) => item.stats.pressure,
	physical: (item) => item.stats.physical,
	agility: (item) => item.stats.agility,
	intelligence: (item) => item.stats.intelligence,
	shootAT: (item) => item.power.shootAT,
	focusAT: (item) => item.power.focusAT,
	focusDF: (item) => item.power.focusDF,
	wallDF: (item) => item.power.wallDF,
	scrambleAT: (item) => item.power.scrambleAT,
	scrambleDF: (item) => item.power.scrambleDF,
	kp: (item) => item.power.kp,
};

const typeBadgeClasses: Record<EquipmentType, string> = {
	boots: "border-orange-500/30 bg-orange-500/10 text-orange-500",
	bracelets: "border-purple-500/30 bg-purple-500/10 text-purple-500",
	pendants: "border-pink-500/30 bg-pink-500/10 text-pink-500",
	misc: "border-slate-500/30 bg-slate-500/10 text-slate-500",
};

const sharedColumns: TableColumn[] = [
	{
		key: "type",
		header: "Type",
		headerClassName: "text-xs uppercase tracking-wide text-muted-foreground",
		align: "center",
		className: "w-[110px]",
		render: (item) => (
			<Badge
				variant="outline"
				className={cn(
					"w-full justify-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
					typeBadgeClasses[item.type],
				)}
			>
				{titleCase(item.type)}
			</Badge>
		),
	},
	{
		key: "shop",
		header: "Shop",
		headerClassName: "text-xs uppercase tracking-wide text-muted-foreground",
		align: "center",
		className: "w-[110px]",
		render: (item) => (
			<Badge
				variant="outline"
				className="w-full justify-center border border-sky-500/40 bg-sky-500/5 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300"
			>
				{item.shop}
			</Badge>
		),
	},
	{
		key: "name",
		header: "Equipment",
		className: "min-w-[200px]",
		render: (item) => <EquipmentIdentity equipment={item} />,
	},
];

const statsColumns: TableColumn[] = [
	...sharedColumns,
	...baseStatKeys.map((key) => ({
		key,
		header: titleCase(key),
		align: "right" as const,
		render: (item: Equipment) => formatNumber(item.stats[key]),
	})),
	{
		key: "total",
		header: "Total",
		align: "right",
		render: (item) => formatNumber(item.stats.total),
	},
];

const powerColumns: TableColumn[] = [
	...sharedColumns,
	...powerMetricKeys.map((key) => ({
		key,
		header: getPowerLabel(key),
		align: "right" as const,
		render: (item: Equipment) => formatNumber(item.power[key]),
	})),
];

export default function EquipmentsPage() {
	const [preferences, setPreferences] = useAtom(equipmentsPreferencesAtom);

	const filteredEquipments = useMemo(() => {
		const query = preferences.search.trim().toLowerCase();
		return equipmentDataset.filter((item) => {
			if (preferences.type !== "all" && item.type !== preferences.type) {
				return false;
			}
			if (preferences.shop !== "all" && item.shop !== preferences.shop) {
				return false;
			}
			if (
				preferences.attribute !== "any" &&
				(!item.stats[preferences.attribute] ||
					item.stats[preferences.attribute] <= 0)
			) {
				return false;
			}
			if (query && !item.name.toLowerCase().includes(query)) {
				return false;
			}
			return true;
		});
	}, [
		preferences.attribute,
		preferences.search,
		preferences.shop,
		preferences.type,
	]);

	const sortedEquipments = useMemo(() => {
		const accessor = metricAccessors[preferences.sortKey];
		return [...filteredEquipments].sort((a, b) => {
			const valueA = accessor(a);
			const valueB = accessor(b);
			return preferences.sortDirection === "desc"
				? valueB - valueA
				: valueA - valueB;
		});
	}, [filteredEquipments, preferences.sortDirection, preferences.sortKey]);

	const tableColumns =
		preferences.viewMode === "stats" ? statsColumns : powerColumns;

	const filtersAreDirty =
		preferences.search !== DEFAULT_EQUIPMENTS_PREFERENCES.search ||
		preferences.type !== DEFAULT_EQUIPMENTS_PREFERENCES.type ||
		preferences.shop !== DEFAULT_EQUIPMENTS_PREFERENCES.shop ||
		preferences.attribute !== DEFAULT_EQUIPMENTS_PREFERENCES.attribute ||
		preferences.viewMode !== DEFAULT_EQUIPMENTS_PREFERENCES.viewMode;

	const sortIsDirty =
		preferences.sortKey !== DEFAULT_EQUIPMENTS_PREFERENCES.sortKey ||
		preferences.sortDirection !== DEFAULT_EQUIPMENTS_PREFERENCES.sortDirection;

	const handleUpdate = (patch: Partial<EquipmentsPreferences>) => {
		setPreferences((prev) => ({ ...prev, ...patch }));
	};

	const handleResetFilters = () => {
		handleUpdate({
			search: DEFAULT_EQUIPMENTS_PREFERENCES.search,
			type: DEFAULT_EQUIPMENTS_PREFERENCES.type,
			shop: DEFAULT_EQUIPMENTS_PREFERENCES.shop,
			attribute: DEFAULT_EQUIPMENTS_PREFERENCES.attribute,
			viewMode: DEFAULT_EQUIPMENTS_PREFERENCES.viewMode,
		});
	};

	const handleResetSorting = () => {
		handleUpdate({
			sortKey: DEFAULT_EQUIPMENTS_PREFERENCES.sortKey,
			sortDirection: DEFAULT_EQUIPMENTS_PREFERENCES.sortDirection,
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<section className="rounded-lg border bg-card/50 p-3">
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border bg-background/40 px-3 py-1.5">
						<Search
							className="size-4 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							value={preferences.search}
							onChange={(event) =>
								handleUpdate({ search: event.currentTarget.value })
							}
							placeholder="Search equipments"
							className="flex-1 border-0 bg-transparent px-0 focus-visible:ring-0"
							aria-label="Filter equipments by name"
						/>
					</div>
					<div className="flex rounded-md border bg-background/30 p-1 text-xs font-semibold uppercase text-muted-foreground">
						<Button
							size="sm"
							className="h-8 rounded-[6px] px-3"
							variant={preferences.viewMode === "stats" ? "default" : "ghost"}
							onClick={() => handleUpdate({ viewMode: "stats" })}
						>
							Stats
						</Button>
						<Button
							size="sm"
							className="h-8 rounded-[6px] px-3"
							variant={preferences.viewMode === "power" ? "default" : "ghost"}
							onClick={() => handleUpdate({ viewMode: "power" })}
						>
							Power
						</Button>
					</div>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 text-muted-foreground"
						onClick={handleResetFilters}
						disabled={!filtersAreDirty}
					>
						<RotateCcw className="size-4" />
						Reset
					</Button>
				</div>
				<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					<Select
						value={preferences.type}
						onValueChange={(value) =>
							handleUpdate({ type: value as EquipmentsPreferences["type"] })
						}
					>
						<SelectTrigger
							size="sm"
							className="h-10 w-full justify-between rounded-md border bg-background/30"
						>
							<SelectValue placeholder="All types" />
						</SelectTrigger>
						<SelectContent>
							{typeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={preferences.shop}
						onValueChange={(value) => handleUpdate({ shop: value })}
					>
						<SelectTrigger
							size="sm"
							className="h-10 w-full justify-between rounded-md border bg-background/30"
						>
							<SelectValue placeholder="All shops" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All shops</SelectItem>
							{shopOptions.map((shop) => (
								<SelectItem key={shop} value={shop}>
									{shop}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={preferences.attribute}
						onValueChange={(value) =>
							handleUpdate({
								attribute: value as EquipmentsPreferences["attribute"],
							})
						}
					>
						<SelectTrigger
							size="sm"
							className="h-10 w-full justify-between rounded-md border bg-background/30"
						>
							<SelectValue placeholder="Any attribute" />
						</SelectTrigger>
						<SelectContent>
							{attributeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</section>

			<section className="rounded-lg border bg-card/40 p-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Ordering
					</p>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 text-muted-foreground"
						onClick={handleResetSorting}
						disabled={!sortIsDirty}
					>
						<RotateCcw className="size-4" />
						Reset
					</Button>
				</div>
				<div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
					<Select
						value={preferences.sortKey}
						onValueChange={(value) =>
							handleUpdate({ sortKey: value as EquipmentSortKey })
						}
					>
						<SelectTrigger
							size="sm"
							className="h-10 w-full justify-between rounded-md border bg-background/30"
						>
							<SelectValue placeholder="Sort metric" />
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((option) => (
								<SelectItem key={option.key} value={option.key}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="flex flex-wrap gap-2">
						<Button
							size="sm"
							className="h-10"
							variant={
								preferences.sortDirection === "desc" ? "default" : "outline"
							}
							onClick={() => handleUpdate({ sortDirection: "desc" })}
						>
							High → Low
						</Button>
						<Button
							size="sm"
							className="h-10"
							variant={
								preferences.sortDirection === "asc" ? "default" : "outline"
							}
							onClick={() => handleUpdate({ sortDirection: "asc" })}
						>
							Low → High
						</Button>
					</div>
				</div>
			</section>

			<section className="rounded-lg border bg-card/60">
				<div className="flex items-center justify-between gap-2 p-3 text-xs text-muted-foreground">
					<span>
						Showing {sortedEquipments.length.toLocaleString()} equipments
					</span>
					<span>
						View: {preferences.viewMode === "stats" ? "Stats" : "Power"}
					</span>
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							{tableColumns.map((column) => (
								<TableHead
									key={column.key}
									className={cn(
										column.headerClassName,
										column.align === "right"
											? "text-right"
											: column.align === "center"
												? "text-center"
												: undefined,
									)}
								>
									{column.header}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedEquipments.map((item) => (
							<TableRow key={item.id}>
								{tableColumns.map((column) => (
									<TableCell
										key={column.key}
										className={cn(
											column.className,
											column.align === "right"
												? "text-right font-mono"
												: column.align === "center"
													? "text-center"
													: undefined,
										)}
									>
										{column.render(item)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
				{!sortedEquipments.length && (
					<div className="border-t p-6 text-center text-sm text-muted-foreground">
						No equipments match the selected filters.
					</div>
				)}
			</section>
		</div>
	);
}

function EquipmentIdentity({ equipment }: { equipment: Equipment }) {
	return (
		<div className="flex flex-col">
			<span className="font-semibold leading-tight">{equipment.name}</span>
		</div>
	);
}
