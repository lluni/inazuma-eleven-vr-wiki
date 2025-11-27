import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useAtom } from "jotai";
import { RotateCcw } from "lucide-react";

import playersJson from "@/assets/data/players.json?raw";
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
import { cn } from "@/lib/utils";
import {
	getElementIcon,
	getPositionColor,
	type ElementType,
	type TeamPosition,
} from "@/lib/icon-picker";
import {
	DEFAULT_PLAYERS_PREFERENCES,
	playersPreferencesAtom,
	type PlayersPreferences,
	type PlayersSortKey,
} from "@/store/players";

type RawPlayerRecord = {
	"Nº": number;
	Image: string;
	Name: string;
	Nickname: string;
	Game: string;
	Position: string;
	Element: string;
	Kick: number;
	Control: number;
	Technique: number;
	Pressure: number;
	Physical: number;
	Agility: number;
	Intelligence: number;
	Total: number;
	"Age group": string;
	Year: string;
	Gender: string;
	Role: string;
};

type BaseStats = {
	kick: number;
	control: number;
	technique: number;
	pressure: number;
	physical: number;
	agility: number;
	intelligence: number;
	total: number;
};

type PowerStats = {
	shootAT: number;
	focusAT: number;
	focusDF: number;
	wallDF: number;
	scrambleAT: number;
	scrambleDF: number;
	kp: number;
};

type Player = {
	id: number;
	image: string;
	name: string;
	nickname: string;
	game: string;
	position: string;
	element: string;
	role: string;
	ageGroup: string;
	year: string;
	gender: string;
	stats: BaseStats;
	power: PowerStats;
};

type TableColumn = {
	key: string;
	header: string;
	className?: string;
	align?: "left" | "right";
	render: (player: Player) => React.ReactNode;
};

type SortMetric = {
	key: PlayersSortKey;
	label: string;
	category: "Base stats" | "Power values";
};

const INITIAL_VISIBLE_COUNT = 50;
const LOAD_MORE_BATCH_SIZE = 50;

const rawPlayers = JSON.parse(playersJson).filter((x: RawPlayerRecord) => x.Name !== "???") as RawPlayerRecord[];

const playersDataset: Player[] = rawPlayers.map((player) => {
	const stats: BaseStats = {
		kick: normalizeStat(player.Kick),
		control: normalizeStat(player.Control),
		technique: normalizeStat(player.Technique),
		pressure: normalizeStat(player.Pressure),
		physical: normalizeStat(player.Physical),
		agility: normalizeStat(player.Agility),
		intelligence: normalizeStat(player.Intelligence),
		total: normalizeStat(player.Total),
	};

	return {
		id: player["Nº"],
		image: player.Image,
		name: sanitizeAttribute(player.Name),
		nickname: sanitizeAttribute(player.Nickname),
		game: sanitizeAttribute(player.Game),
		position: sanitizeAttribute(player.Position),
		element: sanitizeAttribute(player.Element),
		role: sanitizeAttribute(player.Role),
		ageGroup: sanitizeAttribute(player["Age group"]),
		year: sanitizeAttribute(player.Year),
		gender: sanitizeAttribute(player.Gender),
		stats,
		power: computePower(stats),
	};
});

const metricDefinitions: SortMetric[] = [
	{ key: "total", label: "Total", category: "Base stats" },
	{ key: "kick", label: "Kick", category: "Base stats" },
	{ key: "control", label: "Control", category: "Base stats" },
	{ key: "technique", label: "Technique", category: "Base stats" },
	{ key: "pressure", label: "Pressure", category: "Base stats" },
	{ key: "physical", label: "Physical", category: "Base stats" },
	{ key: "agility", label: "Agility", category: "Base stats" },
	{ key: "intelligence", label: "Intelligence", category: "Base stats" },
	{ key: "shootAT", label: "Shoot AT", category: "Power values" },
	{ key: "focusAT", label: "Focus AT", category: "Power values" },
	{ key: "focusDF", label: "Focus DF", category: "Power values" },
	{ key: "wallDF", label: "Wall DF", category: "Power values" },
	{ key: "scrambleAT", label: "Scramble AT", category: "Power values" },
	{ key: "scrambleDF", label: "Scramble DF", category: "Power values" },
	{ key: "kp", label: "KP", category: "Power values" },
];

const metricLabelMap = new Map(metricDefinitions.map((metric) => [metric.key, metric.label]));

const metricAccessors: Record<PlayersSortKey, (player: Player) => number> = {
	total: (player) => player.stats.total,
	kick: (player) => player.stats.kick,
	control: (player) => player.stats.control,
	technique: (player) => player.stats.technique,
	pressure: (player) => player.stats.pressure,
	physical: (player) => player.stats.physical,
	agility: (player) => player.stats.agility,
	intelligence: (player) => player.stats.intelligence,
	shootAT: (player) => player.power.shootAT,
	focusAT: (player) => player.power.focusAT,
	focusDF: (player) => player.power.focusDF,
	wallDF: (player) => player.power.wallDF,
	scrambleAT: (player) => player.power.scrambleAT,
	scrambleDF: (player) => player.power.scrambleDF,
	kp: (player) => player.power.kp,
};

const elementOptions = createSortedUniqueOptions(playersDataset.map((player) => player.element));
const positionOptions = createSortedUniqueOptions(playersDataset.map((player) => player.position));
const roleOptions = createSortedUniqueOptions(playersDataset.map((player) => player.role));

const statsColumns: TableColumn[] = [
	{
		key: "identity",
		header: "Player",
		className: "min-w-[220px]",
		render: (player) => <PlayerIdentity player={player} />,
	},
	...["kick", "control", "technique", "pressure", "physical", "agility", "intelligence", "total"].map(
		(key) => ({
			key,
			header: titleCase(key),
			align: "right" as const,
			render: (player: Player) => formatNumber(player.stats[key as keyof BaseStats]),
		}),
	),
];

const powerColumns: TableColumn[] = [
	{
		key: "identity",
		header: "Player",
		className: "min-w-[220px]",
		render: (player) => <PlayerIdentity player={player} />,
	},
	...[
		["shootAT", "Shoot AT"],
		["focusAT", "Focus AT"],
		["focusDF", "Focus DF"],
		["wallDF", "Walls DF"],
		["scrambleAT", "Scramble AT"],
		["scrambleDF", "Scramble DF"],
		["kp", "KP"],
	].map(([key, label]) => ({
		key,
		header: label,
		align: "right" as const,
		render: (player: Player) => formatNumber(player.power[key as keyof PowerStats]),
	})),
];

export default function PlayersPage() {
	const [preferences, setPreferences] = useAtom(playersPreferencesAtom);
	const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	const activeSortKeys =
		preferences.sortKeys.length > 0
			? preferences.sortKeys
			: DEFAULT_PLAYERS_PREFERENCES.sortKeys;

	useEffect(() => {
		if (preferences.sortKeys.length === 0) {
			setPreferences((prev) => ({
				...prev,
				sortKeys: DEFAULT_PLAYERS_PREFERENCES.sortKeys,
			}));
		}
	}, [preferences.sortKeys.length, setPreferences]);

	const filteredPlayers = useMemo(() => {
		const query = preferences.search.trim().toLowerCase();
		return playersDataset.filter((player) => {
			if (preferences.element !== "all" && player.element !== preferences.element) {
				return false;
			}
			if (preferences.position !== "all" && player.position !== preferences.position) {
				return false;
			}
			if (preferences.role !== "all" && player.role !== preferences.role) {
				return false;
			}
			if (!query) return true;
			return (
				player.name.toLowerCase().includes(query) ||
				player.nickname.toLowerCase().includes(query)
			);
		});
	}, [preferences.element, preferences.position, preferences.role, preferences.search]);

	const sortedPlayers = useMemo(() => {
		const { sortDirection } = preferences;
		const aggregateValue = (player: Player) =>
			activeSortKeys.reduce((total, key) => total + metricAccessors[key](player), 0);

		return [...filteredPlayers].sort((a, b) => {
			const valueA = aggregateValue(a);
			const valueB = aggregateValue(b);
			return sortDirection === "desc" ? valueB - valueA : valueA - valueB;
		});
	}, [activeSortKeys, filteredPlayers, preferences.sortDirection]);

	const tableColumns = preferences.viewMode === "stats" ? statsColumns : powerColumns;

	const visiblePlayers = sortedPlayers.slice(0, visibleCount);
	const hasMore = visibleCount < sortedPlayers.length;

	const filtersAreDirty =
		preferences.search !== DEFAULT_PLAYERS_PREFERENCES.search ||
		preferences.element !== DEFAULT_PLAYERS_PREFERENCES.element ||
		preferences.position !== DEFAULT_PLAYERS_PREFERENCES.position ||
		preferences.role !== DEFAULT_PLAYERS_PREFERENCES.role;

	const sortIsDirty =
		preferences.sortDirection !== DEFAULT_PLAYERS_PREFERENCES.sortDirection ||
		activeSortKeys.join(",") !== DEFAULT_PLAYERS_PREFERENCES.sortKeys.join(",");

	const handleUpdate = (patch: Partial<PlayersPreferences>) => {
		setPreferences((prev) => ({ ...prev, ...patch }));
	};

	const handleToggleSortKey = (key: PlayersSortKey) => {
		setPreferences((prev) => {
			const exists = prev.sortKeys.includes(key);
			let nextKeys = exists
				? prev.sortKeys.filter((item) => item !== key)
				: [...prev.sortKeys, key];

			if (nextKeys.length === 0) {
				nextKeys = DEFAULT_PLAYERS_PREFERENCES.sortKeys;
			}

			return {
				...prev,
				sortKeys: nextKeys,
			};
		});
	};

	const handleResetFilters = () => {
		handleUpdate({
			search: DEFAULT_PLAYERS_PREFERENCES.search,
			element: DEFAULT_PLAYERS_PREFERENCES.element,
			position: DEFAULT_PLAYERS_PREFERENCES.position,
			role: DEFAULT_PLAYERS_PREFERENCES.role,
		});
	};

	const handleResetSorting = () => {
		handleUpdate({
			sortKeys: DEFAULT_PLAYERS_PREFERENCES.sortKeys,
			sortDirection: DEFAULT_PLAYERS_PREFERENCES.sortDirection,
		});
	};

	useEffect(() => {
		setVisibleCount(INITIAL_VISIBLE_COUNT);
	}, [
		preferences.search,
		preferences.element,
		preferences.position,
		preferences.role,
		preferences.viewMode,
		preferences.sortDirection,
		activeSortKeys.join(","),
	]);

	useEffect(() => {
		if (!hasMore) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setVisibleCount((prev) =>
						Math.min(prev + LOAD_MORE_BATCH_SIZE, sortedPlayers.length),
					);
				}
			},
			{
				rootMargin: "200px",
			},
		);
		const node = loadMoreRef.current;
		if (node) observer.observe(node);

		return () => observer.disconnect();
	}, [hasMore, sortedPlayers.length]);

	return (
		<div className="flex flex-col gap-4">
			<section className="flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="flex flex-1 items-center gap-2 rounded-lg border bg-card/50 px-3">
					<Input
						value={preferences.search}
						onChange={(event) => handleUpdate({ search: event.currentTarget.value })}
						placeholder="Search by name or nickname..."
						className="border-0 bg-transparent px-0 focus-visible:ring-0"
						aria-label="Filter players by name"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant={preferences.viewMode === "stats" ? "default" : "outline"}
						onClick={() => handleUpdate({ viewMode: "stats" })}
					>
						Show stats
					</Button>
					<Button
						size="sm"
						variant={preferences.viewMode === "power" ? "default" : "outline"}
						onClick={() => handleUpdate({ viewMode: "power" })}
					>
						Show power
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="text-muted-foreground"
						onClick={handleResetFilters}
						disabled={!filtersAreDirty}
					>
						<RotateCcw className="size-4" />
						Reset filters
					</Button>
				</div>
			</section>

			<section className="rounded-lg border bg-card/40 p-3">
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<Select
						value={preferences.element}
						onValueChange={(value) => handleUpdate({ element: value })}
					>
						<SelectTrigger size="sm" className="w-full justify-between">
							<SelectValue placeholder="Element" />
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
					<Select
						value={preferences.position}
						onValueChange={(value) => handleUpdate({ position: value })}
					>
						<SelectTrigger size="sm" className="w-full justify-between">
							<SelectValue placeholder="Position" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All positions</SelectItem>
							{positionOptions.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={preferences.role}
						onValueChange={(value) => handleUpdate({ role: value })}
					>
						<SelectTrigger size="sm" className="w-full justify-between">
							<SelectValue placeholder="Role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All roles</SelectItem>
							{roleOptions.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="hidden lg:block" />
				</div>
			</section>

			<section className="rounded-lg border bg-card/40 p-3">
				<header className="flex flex-wrap items-center justify-between gap-2">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
							Ordering
						</p>
						<p className="text-xs text-muted-foreground">
							Combine stats to surface specific profiles.
						</p>
					</div>
					<Button
						size="sm"
						variant="ghost"
						className="text-muted-foreground"
						onClick={handleResetSorting}
						disabled={!sortIsDirty}
					>
						<RotateCcw className="size-4" />
						Reset ordering
					</Button>
				</header>

				<div className="mt-3 flex flex-wrap items-center gap-2">
					<span className="text-xs font-semibold uppercase text-muted-foreground">
						Direction
					</span>
					<Button
						size="sm"
						variant={preferences.sortDirection === "desc" ? "default" : "outline"}
						onClick={() => handleUpdate({ sortDirection: "desc" })}
					>
						High → Low
					</Button>
					<Button
						size="sm"
						variant={preferences.sortDirection === "asc" ? "default" : "outline"}
						onClick={() => handleUpdate({ sortDirection: "asc" })}
					>
						Low → High
					</Button>
				</div>

				<div className="mt-3 space-y-3">
					{["Base stats", "Power values"].map((category) => (
						<div key={category} className="space-y-2">
							<p className="text-xs font-semibold uppercase text-muted-foreground">
								{category}
							</p>
							<div className="flex flex-wrap gap-2">
								{metricDefinitions
									.filter((metric) => metric.category === category)
									.map((metric) => {
										const isActive = preferences.sortKeys.includes(metric.key);
										return (
											<Button
												key={metric.key}
												size="sm"
												variant={isActive ? "default" : "outline"}
												onClick={() => handleToggleSortKey(metric.key)}
											>
												{metric.label}
											</Button>
										);
									})}
							</div>
						</div>
					))}
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-2">
					<span className="text-xs font-semibold uppercase text-muted-foreground">
						Active metrics
					</span>
					{activeSortKeys.map((key) => (
						<Badge key={key} variant="secondary">
							{metricLabelMap.get(key) ?? key}
						</Badge>
					))}
				</div>
			</section>

			<section className="rounded-lg border bg-card/60">
				<div className="flex items-center justify-between gap-2 p-3 text-xs text-muted-foreground">
					<span>
						Showing {visiblePlayers.length.toLocaleString()} of{" "}
						{sortedPlayers.length.toLocaleString()} players
					</span>
					{hasMore && <span>Scroll to load more results</span>}
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							{tableColumns.map((column) => (
								<TableHead
									key={column.key}
									className={cn(
										column.className,
										column.align === "right" ? "text-right" : undefined,
									)}
								>
									{column.header}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{visiblePlayers.map((player) => (
							<TableRow key={`${player.id}-${player.name}`}>
								{tableColumns.map((column) => (
									<TableCell
										key={column.key}
										className={cn(
											column.className,
											column.align === "right" ? "text-right font-mono" : undefined,
										)}
									>
										{column.render(player)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
				{hasMore && (
					<div
						ref={loadMoreRef}
						className="flex h-16 items-center justify-center text-sm text-muted-foreground"
					>
						Loading more players…
					</div>
				)}
				{!visiblePlayers.length && (
					<div className="border-t p-6 text-center text-sm text-muted-foreground">
						No players match the selected filters.
					</div>
				)}
			</section>
		</div>
	);
}

function PlayerIdentity({ player }: { player: Player }) {
	return (
		<div className="flex items-center gap-2">
			<img
				src={player.image}
				alt={player.name}
				className="size-16 rounded-md border object-cover"
				loading="lazy"
				referrerPolicy="no-referrer"
			/>
			<div className="flex flex-col">
				<span className="font-semibold leading-tight">{player.name}</span>
				<span className="text-xs text-muted-foreground">“{player.nickname}”</span>
				<div className="mt-1 flex flex-wrap gap-1 text-xs">
					<PositionBadge position={player.position} />
					<ElementBadge element={player.element} />
					<Badge variant="outline" className="px-2 py-0.5">
						{player.role}
					</Badge>
				</div>
			</div>
		</div>
	);
}

function PositionBadge({ position }: { position: string }) {
	const teamPosition = mapToTeamPosition(position);
	const colors = getPositionColor(teamPosition);

	const style: CSSProperties = colors.gradient
		? {
				backgroundImage: colors.gradient,
				color: "#fff",
				borderColor: "transparent",
		  }
		: {
				backgroundColor: addAlpha(colors.primary, "22"),
				borderColor: addAlpha(colors.primary, "44"),
				color: colors.secondary ?? colors.primary,
		  };

	return (
		<Badge
			variant="outline"
			className="gap-1 border px-2 py-0.5 font-medium uppercase tracking-wide"
			style={style}
		>
			{position}
		</Badge>
	);
}

function ElementBadge({ element }: { element: string }) {
	const elementType = mapToElementType(element);
	const definition = getElementIcon(elementType);
	const Icon = definition.icon;

	return (
		<Badge
			variant="outline"
			className="gap-1 border px-2 py-0.5"
			style={{
				color: definition.color,
				borderColor: addAlpha(definition.color, "44"),
				backgroundColor: addAlpha(definition.color, "1a"),
			}}
		>
			{Icon ? (
				<Icon className="size-3" aria-hidden="true" />
			) : definition.assetPath ? (
				<img src={definition.assetPath} alt="" className="size-3" aria-hidden="true" />
			) : null}
			{element}
		</Badge>
	);
}

function computePower(stats: BaseStats): PowerStats {
	return {
		shootAT: Math.round(stats.kick + stats.control),
		focusAT: Math.round(stats.technique + stats.control + stats.kick * 0.5),
		focusDF: Math.round(stats.technique + stats.intelligence + stats.agility * 0.5),
		wallDF: Math.round(stats.pressure + stats.physical),
		scrambleAT: Math.round(stats.intelligence + stats.physical),
		scrambleDF: Math.round(stats.intelligence + stats.pressure),
		kp: Math.round(stats.pressure * 2 + stats.physical * 3 + stats.agility * 4),
	};
}

function createSortedUniqueOptions(values: string[]): string[] {
	return Array.from(
		new Set(
			values
				.map((value) => sanitizeAttribute(value))
				.filter((value) => value !== ""),
		),
	).sort((a, b) => a.localeCompare(b));
}

function formatNumber(value: number): string {
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		return "—";
	}
	return Number.isInteger(numericValue)
		? numericValue.toString()
		: numericValue.toFixed(1).replace(/\.0$/, "");
}

function titleCase(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeStat(value: unknown): number {
	const numeric = typeof value === "number" ? value : Number(value);
	return Number.isFinite(numeric) ? numeric : 0;
}

function sanitizeAttribute(value: string | null | undefined): string {
	if (typeof value !== "string") return "Unknown";
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : "Unknown";
}

function mapToElementType(element: string): ElementType {
	const normalized = element.trim().toLowerCase();
	switch (normalized) {
		case "fire":
			return "Fire";
		case "wind":
			return "Wind";
		case "mountain":
			return "Mountain";
		case "forest":
		default:
			return "Forest";
	}
}

function mapToTeamPosition(position: string): TeamPosition {
	const normalized = position.trim().toUpperCase();
	const map: Record<string, TeamPosition> = {
		GK: "GK",
		DF: "DF",
		FW: "FW",
		MF: "MD",
		MD: "MD",
	};
	return map[normalized] ?? "MD";
}

function addAlpha(hex: string, alpha: string): string {
	if (!hex.startsWith("#")) return hex;
	if (hex.length === 4) {
		const r = hex[1];
		const g = hex[2];
		const b = hex[3];
		return `#${r}${r}${g}${g}${b}${b}${alpha}`;
	}
	if (hex.length === 7) {
		return `${hex}${alpha}`;
	}
	return hex;
}

