import { useMemo } from "react";
import type { ReactNode } from "react";
import { Flame, Gauge, Layers, RotateCcw, Search, Sparkles } from "lucide-react";
import { useAtom } from "jotai";

import abilitiesJson from "@/assets/data/abilities.json?raw";
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
	normalizeStat,
	sanitizeAttribute,
} from "@/lib/data-helpers";
import {
	getElementIcon,
	getMoveIcon,
	type ElementType,
	type MoveType,
} from "@/lib/icon-picker";
import { cn } from "@/lib/utils";
import {
	DEFAULT_HISSATSU_PREFERENCES,
	hissatsuPreferencesAtom,
	type HissatsuPreferences,
	type HissatsuSortKey,
} from "@/store/hissatsu";

type RawHissatsuRecord = {
	N: number;
	Shop: string;
	Name: string;
	Type: string;
	Element: string;
	Extra: string;
	Power: number;
	Tension: number;
};

type HissatsuMove = {
	id: string;
	order: number;
	name: string;
	type: string;
	element: string;
	shop: string;
	extras: string[];
	power: number;
	tension: number;
};

type TableColumn = {
	key: string;
	header: ReactNode;
	align?: "left" | "center" | "right";
	className?: string;
	headerClassName?: string;
	render: (item: HissatsuMove) => ReactNode;
};

type SummaryMetric = {
	key: string;
	label: string;
	value: string;
	subLabel: string;
	icon: ReactNode;
};

const rawRecords = JSON.parse(abilitiesJson) as RawHissatsuRecord[];

const hissatsuDataset: HissatsuMove[] = rawRecords.map((record, index) => {
	const extras = extractExtras(record.Extra);
	return {
		id: `hissatsu-${record.N ?? index}`,
		order: typeof record.N === "number" ? record.N : index + 1,
		name: sanitizeAttribute(record.Name),
		type: sanitizeAttribute(record.Type),
		element: sanitizeAttribute(record.Element),
		shop: sanitizeAttribute(record.Shop),
		extras,
		power: normalizeStat(record.Power),
		tension: normalizeStat(record.Tension),
	};
});

const typeOptions = createSortedUniqueOptions(hissatsuDataset.map((item) => item.type));
const elementOptions = createSortedUniqueOptions(hissatsuDataset.map((item) => item.element));
const shopOptions = createSortedUniqueOptions(hissatsuDataset.map((item) => item.shop));
const extraOptions = Array.from(
	new Set(hissatsuDataset.flatMap((item) => item.extras)),
).sort((a, b) => a.localeCompare(b));

const sortOptions: Array<{ key: HissatsuSortKey; label: string }> = [
	{ key: "shop", label: "Shop" },
	{ key: "power", label: "Power" },
	{ key: "tension", label: "Tension" },
	{ key: "order", label: "# Catalog" },
	{ key: "name", label: "Name" },
	{ key: "type", label: "Type" },
	{ key: "element", label: "Element" },
];

const metricAccessors: Record<HissatsuSortKey, (item: HissatsuMove) => string | number> = {
	order: (item) => item.order,
	name: (item) => item.name,
	type: (item) => item.type,
	element: (item) => item.element,
	shop: (item) => item.shop,
	power: (item) => item.power,
	tension: (item) => item.tension,
};

const typeBadgeClasses: Record<string, string> = {
	Shot: "border-orange-500/40 bg-orange-500/10 text-orange-500",
	Dribble: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
	Wall: "border-sky-500/40 bg-sky-500/10 text-sky-500",
	Catch: "border-amber-400/60 bg-amber-200/10 text-amber-500 dark:text-yellow-300",
};

const elementBadgeClasses: Record<string, string> = {
	Fire: "border-red-500/40 bg-red-500/10 text-red-500",
	Air: "border-cyan-500/40 bg-cyan-500/10 text-cyan-500",
	Forest: "border-green-500/40 bg-green-500/10 text-green-500",
	Mountain: "border-amber-500/40 bg-amber-500/10 text-amber-500",
	Void: "border-slate-500/40 bg-slate-500/10 text-slate-500",
};

const elementIconAliases: Partial<Record<string, ElementType>> = {
	Air: "Wind",
};

type IconDefinition = ReturnType<typeof getMoveIcon>;

const tableColumns: TableColumn[] = [
	{
		key: "shop",
		header: "Shop",
		align: "center",
		className: "w-[140px]",
		render: (item) => (
			<Badge className="w-full justify-center bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
				{item.shop}
			</Badge>
		),
	},
	{
		key: "type",
		header: "Type",
		align: "center",
		className: "w-[100px]",
		render: (item) => {
			const iconDefinition = getMoveIconForType(item.type);
			return (
				<Badge
					variant="outline"
					className={cn(
						"w-full items-center justify-center gap-1.5 border px-2 py-0.5 text-[11px] font-semibold uppercase",
						typeBadgeClasses[item.type],
					)}
				>
					<BadgeIconContent iconDef={iconDefinition} label={item.type} />
				</Badge>
			);
		},
	},
	{
		key: "element",
		header: "Element",
		align: "center",
		className: "w-[100px]",
		render: (item) => {
			const iconDefinition = getElementIconForValue(item.element);
			return (
				<Badge
					variant="outline"
					className={cn(
						"w-full items-center justify-center gap-1.5 border px-2 py-0.5 text-[11px] font-semibold uppercase",
						elementBadgeClasses[item.element],
					)}
				>
					<BadgeIconContent iconDef={iconDefinition} label={item.element} />
				</Badge>
			);
		},
	},
	{
		key: "name",
		header: "Hissatsu",
		className: "min-w-[220px]",
		render: (item) => <HissatsuIdentity move={item} />,
	},
	{
		key: "power",
		header: "Power",
		align: "center",
		className: "font-mono",
		render: (item) => formatNumber(item.power),
	},
	{
		key: "tension",
		header: "Tension",
		align: "center",
		className: "font-mono",
		render: (item) => formatNumber(item.tension),
	},
];

function getMoveIconForType(moveType: string): IconDefinition {
	return getMoveIcon(moveType as MoveType);
}

function getElementIconForValue(element: string): IconDefinition {
	const normalized = elementIconAliases[element] ?? element;
	return getElementIcon(normalized as ElementType);
}

function BadgeIconContent({ iconDef, label }: { iconDef: IconDefinition; label: string }) {
	const { icon: IconComponent, assetPath, color } = iconDef;

	return (
		<>
			{assetPath ? (
				<img
					src={assetPath}
					alt=""
					className="size-3.5 shrink-0"
					aria-hidden="true"
				/>
			) : IconComponent ? (
				<IconComponent
					className="size-3.5 shrink-0"
					style={{ color }}
					aria-hidden="true"
				/>
			) : null}
			<span className="truncate">{label}</span>
		</>
	);
}

export default function HissatsuPage() {
	const [preferences, setPreferences] = useAtom(hissatsuPreferencesAtom);

	const filteredMoves = useMemo(() => {
		const query = preferences.search.trim().toLowerCase();
		return hissatsuDataset.filter((move) => {
			if (preferences.type !== "all" && move.type !== preferences.type) {
				return false;
			}
			if (preferences.element !== "all" && move.element !== preferences.element) {
				return false;
			}
			if (preferences.shop !== "all" && move.shop !== preferences.shop) {
				return false;
			}
			if (preferences.extra === "none" && move.extras.length > 0) {
				return false;
			}
			if (
				preferences.extra !== "all" &&
				preferences.extra !== "none" &&
				!move.extras.includes(preferences.extra)
			) {
				return false;
			}
			if (query) {
				const haystack = `${move.name} ${move.shop} ${move.extras.join(" ")}`.toLowerCase();
				if (!haystack.includes(query)) {
					return false;
				}
			}
			return true;
		});
	}, [preferences.element, preferences.extra, preferences.search, preferences.shop, preferences.type]);

	const sortedMoves = useMemo(() => {
		const accessor = metricAccessors[preferences.sortKey];
		return [...filteredMoves].sort((a, b) =>
			compareValues(accessor(a), accessor(b), preferences.sortDirection),
		);
	}, [filteredMoves, preferences.sortDirection, preferences.sortKey]);

	const filtersAreDirty =
		preferences.search !== DEFAULT_HISSATSU_PREFERENCES.search ||
		preferences.type !== DEFAULT_HISSATSU_PREFERENCES.type ||
		preferences.element !== DEFAULT_HISSATSU_PREFERENCES.element ||
		preferences.shop !== DEFAULT_HISSATSU_PREFERENCES.shop ||
		preferences.extra !== DEFAULT_HISSATSU_PREFERENCES.extra;

	const sortIsDirty =
		preferences.sortKey !== DEFAULT_HISSATSU_PREFERENCES.sortKey ||
		preferences.sortDirection !== DEFAULT_HISSATSU_PREFERENCES.sortDirection;

	const handleUpdate = (patch: Partial<HissatsuPreferences>) => {
		setPreferences((prev) => ({ ...prev, ...patch }));
	};

	const resetFilters = () => {
		handleUpdate({
			search: DEFAULT_HISSATSU_PREFERENCES.search,
			type: DEFAULT_HISSATSU_PREFERENCES.type,
			element: DEFAULT_HISSATSU_PREFERENCES.element,
			shop: DEFAULT_HISSATSU_PREFERENCES.shop,
			extra: DEFAULT_HISSATSU_PREFERENCES.extra,
		});
	};

	const resetSorting = () => {
		handleUpdate({
			sortKey: DEFAULT_HISSATSU_PREFERENCES.sortKey,
			sortDirection: DEFAULT_HISSATSU_PREFERENCES.sortDirection,
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<section className="rounded-lg border bg-card/50 p-3">
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border bg-background/40 px-3 py-1.5">
						<Search className="size-4 text-muted-foreground" aria-hidden="true" />
						<Input
							value={preferences.search}
							onChange={(event) => handleUpdate({ search: event.currentTarget.value })}
							placeholder="Search Hissatsu names, shops or effects"
							className="flex-1 border-0 bg-transparent px-0 focus-visible:ring-0"
							aria-label="Filter Hissatsu techniques"
						/>
					</div>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 text-muted-foreground"
						onClick={resetFilters}
						disabled={!filtersAreDirty}
					>
						<RotateCcw className="size-4" />
						Reset filters
					</Button>
				</div>
				<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
					<Select
						value={preferences.type}
						onValueChange={(value) =>
							handleUpdate({ type: value as HissatsuPreferences["type"] })
						}
					>
						<SelectTrigger
							size="sm"
							className="h-10 w-full justify-between rounded-md border bg-background/30"
						>
							<SelectValue placeholder="All types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All types</SelectItem>
							{typeOptions.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={preferences.element}
						onValueChange={(value) => handleUpdate({ element: value })}
					>
						<SelectTrigger
							size="sm"
							className="h-10 w-full justify-between rounded-md border bg-background/30"
						>
							<SelectValue placeholder="All elements" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All elements</SelectItem>
							{elementOptions.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={preferences.shop} onValueChange={(value) => handleUpdate({ shop: value })}>
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
					<Select value={preferences.extra} onValueChange={(value) => handleUpdate({ extra: value })}>
						<SelectTrigger
							size="sm"
							className="h-10 w-full justify-between rounded-md border bg-background/30"
						>
							<SelectValue placeholder="All extra effects" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All extra effects</SelectItem>
							<SelectItem value="none">No extra effect</SelectItem>
							{extraOptions.map((extra) => (
								<SelectItem key={extra} value={extra}>
									{extra}
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
						onClick={resetSorting}
						disabled={!sortIsDirty}
					>
						<RotateCcw className="size-4" />
						Reset ordering
					</Button>
				</div>
				<div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
					<Select
						value={preferences.sortKey}
						onValueChange={(value) => handleUpdate({ sortKey: value as HissatsuSortKey })}
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
							variant={preferences.sortDirection === "desc" ? "default" : "outline"}
							onClick={() => handleUpdate({ sortDirection: "desc" })}
						>
							High → Low
						</Button>
						<Button
							size="sm"
							className="h-10"
							variant={preferences.sortDirection === "asc" ? "default" : "outline"}
							onClick={() => handleUpdate({ sortDirection: "asc" })}
						>
							Low → High
						</Button>
					</div>
				</div>
			</section>

			<section className="rounded-lg border bg-card/60">
				<div className="flex items-center justify-between gap-2 p-3 text-xs text-muted-foreground">
					<span>Showing {sortedMoves.length.toLocaleString()} Hissatsu</span>
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
						{sortedMoves.map((move) => (
							<TableRow key={move.id}>
								{tableColumns.map((column) => (
									<TableCell
										key={column.key}
										className={cn(
											column.className,
											column.align === "right"
												? "text-right"
												: column.align === "center"
													? "text-center"
													: undefined,
										)}
									>
										{column.render(move)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
				{!sortedMoves.length && (
					<div className="border-t p-6 text-center text-sm text-muted-foreground">
						No Hissatsu match the selected filters.
					</div>
				)}
			</section>
		</div>
	);
}

function extractExtras(value: string | null | undefined): string[] {
	if (!value) return [];
	return value
		.split(/[/,;|·]+/)
		.map((chunk) => chunk.trim())
		.filter((chunk) => chunk.length > 0);
}

function compareValues(
	valueA: string | number,
	valueB: string | number,
	direction: HissatsuPreferences["sortDirection"],
) {
	if (typeof valueA === "number" && typeof valueB === "number") {
		return direction === "desc" ? valueB - valueA : valueA - valueB;
	}
	const textA = String(valueA).toLowerCase();
	const textB = String(valueB).toLowerCase();
	return direction === "desc" ? textB.localeCompare(textA) : textA.localeCompare(textB);
}


function SummaryCard({ metric }: { metric: SummaryMetric }) {
	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card/40 p-3">
			<div className="flex size-10 items-center justify-center rounded-md border bg-background/50">
				{metric.icon}
			</div>
			<div className="flex flex-col">
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					{metric.label}
				</span>
				<span className="text-lg font-semibold leading-tight">{metric.value}</span>
				<span className="text-xs text-muted-foreground">{metric.subLabel}</span>
			</div>
		</div>
	);
}

function HissatsuIdentity({ move }: { move: HissatsuMove }) {
	return (
		<div className="flex flex-col gap-1 text-left">
			<div className="flex flex-wrap items-center gap-1">
				<span className="font-semibold leading-tight">{move.name}</span>
				{move.extras.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{move.extras.map((extra) => (
							<Badge
								key={extra}
								variant="outline"
								className="border-amber-500/30 bg-amber-500/5 px-1.5 py-0 text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-300"
							>
								{extra}
							</Badge>
						))}
					</div>
				)}
			</div>
		</div>
	);
}


