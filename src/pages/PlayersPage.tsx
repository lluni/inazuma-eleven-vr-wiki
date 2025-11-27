import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useAtom } from "jotai";
import { RotateCcw, Search, Star } from "lucide-react";
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
import { getElementIcon, getPositionColor } from "@/lib/icon-picker";
import {
	createSortedUniqueOptions,
	formatNumber,
	titleCase,
} from "@/lib/data-helpers";
import {
	DEFAULT_PLAYERS_PREFERENCES,
	playersPreferencesAtom,
	type PlayersPreferences,
	type PlayersSortKey,
} from "@/store/players";
import { favoritePlayersAtom } from "@/store/favorites";
import { type BaseStats, type PowerStats } from "@/lib/inazuma-math";
import {
	mapToElementType,
	mapToTeamPosition,
	playersDataset,
	type PlayerRecord,
} from "@/lib/players-data";

type Player = PlayerRecord;

type TableColumn = {
	key: string;
	header: string;
	className?: string;
	align?: "left" | "right" | "center";
	render: (player: Player) => React.ReactNode;
};

type SortMetric = {
	key: PlayersSortKey;
	label: string;
	category: "Base stats" | "Power values";
};

const INITIAL_VISIBLE_COUNT = 50;
const LOAD_MORE_BATCH_SIZE = 50;

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

const statsMetricColumns: TableColumn[] = [
	...["kick", "control", "technique", "pressure", "physical", "agility", "intelligence", "total"].map(
		(key) => ({
			key,
			header: titleCase(key),
			align: "center" as const,
			render: (player: Player) => formatNumber(player.stats[key as keyof BaseStats]),
		}),
	),
];

const powerMetricColumns: TableColumn[] = [
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
		align: "center" as const,
		render: (player: Player) => formatNumber(player.power[key as keyof PowerStats]),
	})),
];

export default function PlayersPage() {
	const [preferences, setPreferences] = useAtom(playersPreferencesAtom);
	const [favoritePlayers, setFavoritePlayers] = useAtom(favoritePlayersAtom);
	const favoriteSet = useMemo(() => new Set(favoritePlayers), [favoritePlayers]);
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
			if (preferences.favoritesOnly && !favoriteSet.has(player.id)) {
				return false;
			}
			if (!query) return true;
			return (
				player.name.toLowerCase().includes(query) ||
				player.nickname.toLowerCase().includes(query)
			);
		});
	}, [
		favoriteSet,
		preferences.element,
		preferences.favoritesOnly,
		preferences.position,
		preferences.role,
		preferences.search,
	]);

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

	const handleToggleFavorite = useCallback(
		(playerId: number) => {
			setFavoritePlayers((prev) => {
				const exists = prev.includes(playerId);
				if (exists) {
					return prev.filter((id) => id !== playerId);
				}
				return [...prev, playerId];
			});
		},
		[setFavoritePlayers],
	);

	const tableColumns = useMemo(() => {
		const metricColumns =
			preferences.viewMode === "stats" ? statsMetricColumns : powerMetricColumns;
		const favoriteColumn: TableColumn = {
			key: "favorite",
			header: "",
			className: "w-12",
			align: "center",
			render: (player: Player) => (
				<FavoriteToggle
					isFavorite={favoriteSet.has(player.id)}
					onToggle={() => handleToggleFavorite(player.id)}
				/>
			),
		};
		const identityColumn: TableColumn = {
			key: "identity",
			header: "Player",
			className: "min-w-[240px]",
			render: (player: Player) => <PlayerIdentity player={player} />,
		};
		return [favoriteColumn, identityColumn, ...metricColumns];
	}, [favoriteSet, handleToggleFavorite, preferences.viewMode]);

	const visiblePlayers = sortedPlayers.slice(0, visibleCount);
	const hasMore = visibleCount < sortedPlayers.length;

	const filtersAreDirty =
		preferences.search !== DEFAULT_PLAYERS_PREFERENCES.search ||
		preferences.element !== DEFAULT_PLAYERS_PREFERENCES.element ||
		preferences.position !== DEFAULT_PLAYERS_PREFERENCES.position ||
		preferences.role !== DEFAULT_PLAYERS_PREFERENCES.role ||
		preferences.favoritesOnly !== DEFAULT_PLAYERS_PREFERENCES.favoritesOnly;

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
			favoritesOnly: DEFAULT_PLAYERS_PREFERENCES.favoritesOnly,
		});
	};

	const handleResetSorting = () => {
		handleUpdate({
			sortKeys: DEFAULT_PLAYERS_PREFERENCES.sortKeys,
			sortDirection: DEFAULT_PLAYERS_PREFERENCES.sortDirection,
		});
	};

	const traitFilters = [
		{
			key: "element",
			label: "Element",
			value: preferences.element,
			defaultLabel: "All elements",
			options: elementOptions,
			onValueChange: (value: string) => handleUpdate({ element: value }),
		},
		{
			key: "position",
			label: "Position",
			value: preferences.position,
			defaultLabel: "All positions",
			options: positionOptions,
			onValueChange: (value: string) => handleUpdate({ position: value }),
		},
		{
			key: "role",
			label: "Role",
			value: preferences.role,
			defaultLabel: "All roles",
			options: roleOptions,
			onValueChange: (value: string) => handleUpdate({ role: value }),
		},
	] as const;

	useEffect(() => {
		setVisibleCount(INITIAL_VISIBLE_COUNT);
	}, [
		preferences.search,
		preferences.element,
		preferences.position,
		preferences.role,
		preferences.favoritesOnly,
		preferences.viewMode,
		preferences.sortDirection,
		activeSortKeys.join(","),
		favoritePlayers.join(","),
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
			<section className="rounded-lg border bg-card/50 p-3">
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border bg-background/40 px-3 py-1.5">
						<Search className="size-4 text-muted-foreground" aria-hidden="true" />
						<Input
							value={preferences.search}
							onChange={(event) => handleUpdate({ search: event.currentTarget.value })}
							placeholder="Search players"
							className="flex-1 border-0 bg-transparent px-0 focus-visible:ring-0"
							aria-label="Filter players by name"
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
						variant={preferences.favoritesOnly ? "default" : "outline"}
						onClick={() => handleUpdate({ favoritesOnly: !preferences.favoritesOnly })}
						aria-pressed={preferences.favoritesOnly}
						className="h-8"
					>
						<Star
							className={cn(
								"size-4",
								preferences.favoritesOnly ? "fill-current" : "fill-transparent",
							)}
						/>
						Favorites
					</Button>
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
					{traitFilters.map((filter) => (
						<Select
							key={filter.key}
							value={filter.value}
							onValueChange={filter.onValueChange}
						>
							<SelectTrigger
								size="sm"
								className="h-10 w-full justify-between rounded-md border bg-background/30"
								aria-label={filter.label}
							>
								<SelectValue placeholder={filter.defaultLabel} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{filter.defaultLabel}</SelectItem>
								{filter.options.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					))}
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

				<div className="mt-3 flex flex-wrap items-center gap-2">
					<span className="text-[11px] font-semibold uppercase text-muted-foreground">
						Direction
					</span>
					<Button
						size="sm"
						className="h-8"
						variant={preferences.sortDirection === "desc" ? "default" : "outline"}
						onClick={() => handleUpdate({ sortDirection: "desc" })}
					>
						High → Low
					</Button>
					<Button
						size="sm"
						className="h-8"
						variant={preferences.sortDirection === "asc" ? "default" : "outline"}
						onClick={() => handleUpdate({ sortDirection: "asc" })}
					>
						Low → High
					</Button>
				</div>

				<div className="mt-3 grid gap-2 lg:grid-cols-2">
					{["Base stats", "Power values"].map((category) => (
						<div key={category} className="rounded-lg border bg-background/10 p-2">
							<div className="mb-2 flex items-center justify-between">
								<p className="text-[11px] font-semibold uppercase text-muted-foreground">
									{category}
								</p>
								<span className="text-[10px] uppercase text-muted-foreground">
									Multi-select
								</span>
							</div>
							<div className="flex flex-wrap gap-2">
								{metricDefinitions
									.filter((metric) => metric.category === category)
									.map((metric) => {
										const isActive = preferences.sortKeys.includes(metric.key);
										return (
											<Button
												key={metric.key}
												size="sm"
												className="h-8"
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
					<span>Player data is shown at level 50 and Normal rarity</span>
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							{tableColumns.map((column) => (
								<TableHead
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
											column.align === "right"
												? "text-right font-mono"
												: column.align === "center"
													? column.key === "favorite"
														? "text-center"
														: "text-center font-mono"
													: undefined,
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

type PlayerIdentityProps = {
	player: Player;
};

function PlayerIdentity({ player }: PlayerIdentityProps) {
	return (
		<div className="flex items-center gap-3">
			<img
				src={player.image}
				alt={player.name}
				className="size-16 rounded-md border object-cover"
				loading="lazy"
				referrerPolicy="no-referrer"
			/>
			<div className="flex flex-1 flex-col">
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

type FavoriteToggleProps = {
	isFavorite: boolean;
	onToggle: () => void;
};

function FavoriteToggle({ isFavorite, onToggle }: FavoriteToggleProps) {
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onToggle();
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-pressed={isFavorite}
			aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
			className={cn(
				"rounded-full border p-1 transition-colors",
				isFavorite
					? "border-amber-400 bg-amber-50 text-amber-500"
					: "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
			)}
		>
			<Star
				className={cn("size-4", isFavorite ? "fill-current" : "fill-transparent")}
				aria-hidden="true"
			/>
		</button>
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

