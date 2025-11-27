import { useAtom, useAtomValue } from "jotai";
import { CheckCircle2, CirclePlus, RefreshCcw, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PositionChip } from "@/components/team-builder/Chips";
import { PlayerAssignmentModal } from "@/components/team-builder/PlayerAssignmentModal";
import { SlotDetailsDrawer } from "@/components/team-builder/SlotDetailsDrawer";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	FORMATIONS,
	type FormationDefinition,
	type FormationSlot,
	formationsMap,
} from "@/data/formations";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatNumber } from "@/lib/data-helpers";
import { getElementIcon, getPositionColor } from "@/lib/icon-picker";
import {
	mapToElementType,
	mapToTeamPosition,
	type PlayerRecord,
	playersById,
	playersDataset,
} from "@/lib/players-data";
import { getSlotRarityDefinition } from "@/lib/slot-rarity";
import { computeSlotComputedStats } from "@/lib/team-builder-calculations";
import { cn } from "@/lib/utils";
import { favoritePlayersAtom } from "@/store/favorites";
import {
	type DisplayMode,
	mergeSlotConfig,
	normalizeSlotConfig,
	type TeamBuilderAssignments,
	type TeamBuilderSlotConfigs,
	teamBuilderAtom,
} from "@/store/team-builder";
import type {
	FiltersState,
	SlotAssignment,
	SlotConfig,
} from "@/types/team-builder";

const DISPLAY_MODE_OPTIONS: { value: DisplayMode; label: string }[] = [
	{ value: "nickname", label: "Nickname" },
	{ value: "shootAT", label: "Shoot AT" },
	{ value: "focusAT", label: "Focus AT" },
	{ value: "focusDF", label: "Focus DF" },
	{ value: "wallDF", label: "Wall DF" },
	{ value: "scrambleAT", label: "Scramble AT" },
	{ value: "scrambleDF", label: "Scramble DF" },
	{ value: "kp", label: "KP" },
];

const FIELD_COLUMNS = 5;
const FIELD_ROWS = 6;
const COLUMN_STOPS = [8, 30, 50, 70, 92];
const ROW_STOPS = [14, 30, 48, 65, 78, 94];
const DEFAULT_FILTERS: FiltersState = {
	search: "",
	element: "all",
	position: "all",
	role: "all",
};

const POSITION_DISPLAY_ORDER: Record<string, number> = {
	GK: 0,
	DF: 1,
	MF: 2,
	FW: 3,
};

export default function TeamBuilderPage() {
	const [teamState, setTeamState] = useAtom(teamBuilderAtom);
	const favoritePlayerIds = useAtomValue(favoritePlayersAtom);
	const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
	const isMobile = useIsMobile();
	const favoriteSet = useMemo(
		() => new Set(favoritePlayerIds),
		[favoritePlayerIds],
	);

	const formation = formationsMap.get(teamState.formationId) ?? FORMATIONS[0];
	const displayMode = teamState.displayMode ?? "nickname";

	useEffect(() => {
		if (!formation.slots.length) {
			setActiveSlotId(null);
			setDetailsOpen(false);
			return;
		}
		if (
			activeSlotId &&
			!formation.slots.some((slot) => slot.id === activeSlotId)
		) {
			setActiveSlotId(null);
			setDetailsOpen(false);
		}
	}, [formation, activeSlotId]);

	const slotAssignments: SlotAssignment[] = useMemo(() => {
		const slotConfigs = teamState.slotConfigs ?? {};
		return formation.slots.map((slot) => {
			const config = normalizeSlotConfig(slotConfigs[slot.id]);
			const player = getPlayerById(teamState.assignments[slot.id]);
			return {
				slot,
				player,
				config,
				computed: player ? computeSlotComputedStats(player, config) : null,
			};
		});
	}, [formation.slots, teamState.assignments, teamState.slotConfigs]);

	const assignedPlayerIds = useMemo(() => {
		const ids = Object.values(teamState.assignments).filter(
			(value): value is number => typeof value === "number",
		);
		return new Set(ids);
	}, [teamState.assignments]);

	const filledCount = slotAssignments.filter((entry) => entry.player).length;
	const activeSlot = activeSlotId
		? (formation.slots.find((slot) => slot.id === activeSlotId) ?? null)
		: null;
	const activeAssignment = activeSlot
		? (slotAssignments.find((entry) => entry.slot.id === activeSlot.id) ?? null)
		: null;

	const filteredPlayers = useMemo(() => {
		if (!activeSlot) return [];
		const query = filters.search.trim().toLowerCase();

		return playersDataset
			.filter((player) => {
				if (filters.position !== "all" && player.position !== filters.position)
					return false;
				if (filters.element !== "all" && player.element !== filters.element) {
					return false;
				}
				if (filters.role !== "all" && player.role !== filters.role) {
					return false;
				}
				if (
					query &&
					!player.name.toLowerCase().includes(query) &&
					!player.nickname.toLowerCase().includes(query)
				) {
					return false;
				}
				return true;
			})
			.slice()
			.sort((a, b) => {
				const byPosition =
					POSITION_DISPLAY_ORDER[normalizePosition(a.position)] -
					POSITION_DISPLAY_ORDER[normalizePosition(b.position)];
				if (byPosition !== 0) return byPosition;
				return b.stats.total - a.stats.total;
			});
	}, [
		activeSlot,
		filters.element,
		filters.position,
		filters.role,
		filters.search,
	]);

	const favoriteOptions = useMemo(() => {
		if (!activeSlot) return [];
		return playersDataset.filter((player) => favoriteSet.has(player.id));
	}, [activeSlot, favoriteSet]);

	const handleFormationChange = (formationId: FormationDefinition["id"]) => {
		setTeamState((prev) => {
			const previousFormation =
				formationsMap.get(prev.formationId) ?? FORMATIONS[0];
			const nextFormation = formationsMap.get(formationId) ?? previousFormation;
			const prevSlotConfigs = prev.slotConfigs ?? {};

			const seen = new Set<number>();
			const assignedPlayers = previousFormation.slots
				.map((slot) => {
					const playerId = prev.assignments[slot.id];
					if (typeof playerId !== "number" || seen.has(playerId)) return null;
					seen.add(playerId);
					const player = getPlayerById(playerId);
					return {
						id: playerId,
						position: player ? normalizePosition(player.position) : null,
					};
				})
				.filter((entry): entry is { id: number; position: string | null } =>
					Boolean(entry),
				);

			const nextAssignments: TeamBuilderAssignments = {};
			const remaining = [...assignedPlayers];
			const nextSlotConfigs: TeamBuilderSlotConfigs = {};

			nextFormation.slots.forEach((slot) => {
				if (prevSlotConfigs[slot.id]) {
					nextSlotConfigs[slot.id] = prevSlotConfigs[slot.id];
				}
			});

			nextFormation.slots.forEach((slot) => {
				if (!remaining.length) {
					nextAssignments[slot.id] = null;
					return;
				}
				const normalizedLabel = normalizePosition(slot.label);
				const matchIndex = remaining.findIndex(
					(entry) => entry.position && entry.position === normalizedLabel,
				);
				const [selected] =
					matchIndex >= 0
						? remaining.splice(matchIndex, 1)
						: remaining.splice(0, 1);
				nextAssignments[slot.id] = selected?.id ?? null;
			});

			return {
				...prev,
				formationId,
				assignments: nextAssignments,
				slotConfigs: nextSlotConfigs,
			};
		});
		setActiveSlotId(null);
		setDetailsOpen(false);
	};

	const handleDisplayModeChange = (mode: DisplayMode) => {
		setTeamState((prev) => ({
			...prev,
			displayMode: mode,
		}));
	};

	const handleOpenPicker = (slot: FormationSlot) => {
		setActiveSlotId(slot.id);
		setPickerOpen(true);
	};

	const handleAssignPlayer = (playerId: number) => {
		if (!activeSlot) return;
		setTeamState((prev) => {
			const nextAssignments: TeamBuilderAssignments = { ...prev.assignments };
			Object.entries(nextAssignments).forEach(([slotId, assignedId]) => {
				if (assignedId === playerId) {
					nextAssignments[slotId] = null;
				}
			});
			nextAssignments[activeSlot.id] = playerId;
			return {
				...prev,
				assignments: nextAssignments,
			};
		});
		setPickerOpen(false);
	};

	const handleUpdateSlotConfig = (
		slotId: string,
		partialConfig: Partial<SlotConfig>,
	) => {
		setTeamState((prev) => {
			const prevConfigs = prev.slotConfigs ?? {};
			const baseConfig = normalizeSlotConfig(prevConfigs[slotId]);
			const nextConfig = mergeSlotConfig(baseConfig, partialConfig);
			return {
				...prev,
				slotConfigs: {
					...prevConfigs,
					[slotId]: nextConfig,
				},
			};
		});
	};

	const handleSelectSlot = (slot: FormationSlot) => {
		setActiveSlotId(slot.id);
		setDetailsOpen(true);
	};

	const handleSelectEmptySlot = (slot: FormationSlot) => {
		setActiveSlotId(slot.id);
		setDetailsOpen(false);
		setPickerOpen(true);
	};

	const handleDetailsOpenChange = (open: boolean) => {
		setDetailsOpen(open);
		if (!open) {
			setActiveSlotId(null);
		}
	};

	const handleClearSlot = (slotId: string) => {
		setTeamState((prev) => ({
			...prev,
			assignments: { ...prev.assignments, [slotId]: null },
		}));
	};

	const handleClearTeam = () => {
		setTeamState((prev) => {
			const nextAssignments: TeamBuilderAssignments = {};
			formation.slots.forEach((slot) => {
				nextAssignments[slot.id] = null;
			});
			return {
				...prev,
				assignments: nextAssignments,
				slotConfigs: {},
			};
		});
		setActiveSlotId(null);
		setDetailsOpen(false);
	};

	const handleResetFilters = () => {
		setFilters(DEFAULT_FILTERS);
	};

	return (
		<div className="flex flex-col gap-4">
			<section className="rounded-xl border bg-card p-4 shadow-sm">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
								Formation
							</p>
							<div className="flex flex-wrap gap-2">
								<Select
									value={formation.id}
									onValueChange={(value) => handleFormationChange(value)}
								>
									<SelectTrigger className="w-full min-w-[220px] bg-background/80 sm:w-[260px]">
										<SelectValue placeholder="Choose formation" />
									</SelectTrigger>
									<SelectContent>
										{FORMATIONS.map((item) => (
											<SelectItem key={item.id} value={item.id}>
												<span className="flex flex-col text-left">
													<span className="font-semibold">{item.name}</span>
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="sm"
									className="gap-1"
									onClick={handleClearTeam}
									disabled={filledCount === 0}
								>
									<UserX className="size-4" />
									Clear team
								</Button>
							</div>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
								Slot display
							</p>
							<div className="flex flex-wrap gap-1.5">
								{DISPLAY_MODE_OPTIONS.map((option) => {
									const isActive = displayMode === option.value;
									return (
										<Button
											key={option.value}
											size="sm"
											variant={isActive ? "default" : "outline"}
											className="px-2 text-[11px]"
											aria-pressed={isActive}
											onClick={() => handleDisplayModeChange(option.value)}
										>
											{option.label}
										</Button>
									);
								})}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						<span>{filledCount}/11 slots filled</span>
						{filledCount === 11 ? (
							<CheckCircle2
								className="size-4 text-emerald-500"
								aria-hidden="true"
							/>
						) : (
							<CirclePlus
								className="size-4 text-amber-500"
								aria-hidden="true"
							/>
						)}
					</div>
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
				<div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm">
					<FormationPitch
						assignments={slotAssignments}
						activeSlotId={activeSlotId}
						displayMode={displayMode}
						onSlotSelect={handleSelectSlot}
						onEmptySlotSelect={handleSelectEmptySlot}
					/>
				</div>

				<div className="space-y-3">
					<div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm">
						<header className="flex flex-wrap items-center justify-between gap-2">
							<div>
								<p className="text-sm font-semibold">Team board</p>
								<p className="text-xs text-muted-foreground">
									Overview of every slot and the chosen player.
								</p>
							</div>
						</header>
						<div className="space-y-2">
							{slotAssignments.map(({ slot, player }) => (
								<div
									key={slot.id}
									className={cn(
										"flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm",
										player
											? "border-muted bg-background"
											: "border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground",
									)}
								>
									<div className="flex items-center gap-2">
										<PositionChip label={slot.label} />
										{player ? (
											<span className="text-sm font-semibold">
												{player.name}
											</span>
										) : (
											<button
												type="button"
												onClick={() => handleOpenPicker(slot)}
												className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary underline-offset-2 hover:underline"
											>
												Assign player
											</button>
										)}
									</div>
									{player ? (
										<Button
											variant="ghost"
											size="sm"
											className="h-7 px-2"
											onClick={() => handleOpenPicker(slot)}
										>
											<RefreshCcw className="size-4" />
										</Button>
									) : null}
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<SlotDetailsDrawer
				open={detailsOpen && Boolean(activeSlot)}
				slot={activeSlot}
				assignment={activeAssignment}
				onAssign={handleOpenPicker}
				onClearSlot={handleClearSlot}
				onUpdateSlotConfig={handleUpdateSlotConfig}
				onOpenChange={handleDetailsOpenChange}
			/>

			<PlayerAssignmentModal
				isMobile={isMobile}
				open={pickerOpen}
				activeSlot={activeSlot}
				favoriteSet={favoriteSet}
				favoritePlayers={favoriteOptions}
				onOpenChange={(open) => {
					setPickerOpen(open);
				}}
				assignedIds={assignedPlayerIds}
				filteredPlayers={filteredPlayers}
				filters={filters}
				onFiltersChange={setFilters}
				onResetFilters={handleResetFilters}
				onSelectPlayer={handleAssignPlayer}
				onClearSlot={() => {
					if (activeSlot) {
						handleClearSlot(activeSlot.id);
						setPickerOpen(false);
					}
				}}
			/>
		</div>
	);
}

type FormationPitchProps = {
	assignments: SlotAssignment[];
	activeSlotId: string | null;
	displayMode: DisplayMode;
	onSlotSelect: (slot: FormationSlot) => void;
	onEmptySlotSelect: (slot: FormationSlot) => void;
};

function FormationPitch({
	assignments,
	activeSlotId,
	displayMode,
	onSlotSelect,
	onEmptySlotSelect,
}: FormationPitchProps) {
	return (
		<div className="mx-auto w-full">
			<div className="relative mx-auto w-full max-w-5xl">
				<div className="relative aspect-[3/4] w-full rounded-[36px] border border-emerald-800 bg-gradient-to-b from-emerald-700/70 via-emerald-800/80 to-emerald-900/95 p-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.35)] sm:aspect-[5/6] lg:aspect-[6/5]">
					<div className="absolute inset-4 rounded-[30px] border border-white/25" />
					<div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-white/15" />
					<div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 sm:h-56 sm:w-56" />
					<div className="absolute left-1/2 top-8 h-28 w-[55%] -translate-x-1/2 rounded-xl border-2 border-white/20 sm:h-32" />
					<div className="absolute left-1/2 bottom-8 h-28 w-[55%] -translate-x-1/2 rounded-xl border-2 border-white/20 sm:h-32" />
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
					<div className="relative h-full w-full">
						{assignments.map((entry) => (
							<PlayerSlotMarker
								key={entry.slot.id}
								entry={entry}
								isActive={entry.slot.id === activeSlotId}
								displayMode={displayMode}
								onSelect={() => onSlotSelect(entry.slot)}
								onEmptySelect={() => onEmptySlotSelect(entry.slot)}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

type PlayerSlotMarkerProps = {
	entry: SlotAssignment;
	isActive: boolean;
	displayMode: DisplayMode;
	onSelect: () => void;
	onEmptySelect: () => void;
};

function PlayerSlotMarker({
	entry,
	isActive,
	displayMode,
	onSelect,
	onEmptySelect,
}: PlayerSlotMarkerProps) {
	const { slot, player, config } = entry;
	const positionColor = getPositionColor(mapToTeamPosition(slot.label));
	const positionStyle = getSlotPositionStyle(slot);
	const rarityDefinition = getSlotRarityDefinition(config?.rarity ?? "normal");
	const handleClick = player ? onSelect : onEmptySelect;
	const hasPlayer = Boolean(player);

	return (
		<button
			type="button"
			onClick={handleClick}
			style={positionStyle}
			className={cn(
				"absolute flex w-[clamp(92px,12vw,128px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-white outline-none transition",
				isActive
					? "scale-105 drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]"
					: "hover:scale-105",
			)}
		>
			<div
				className={cn(
					"relative w-full rounded-lg border-2 bg-black/40 p-0.5 backdrop-blur-sm transition",
					hasPlayer
						? "border-white/60 shadow-xl"
						: "border-dashed border-white/40",
					isActive && "ring-2 ring-emerald-200",
				)}
			>
				<div
					className={cn(
						"relative w-full rounded-md",
						hasPlayer
							? "p-[2px]"
							: "overflow-hidden border border-dashed border-white/30 bg-black/20",
					)}
					style={
						hasPlayer
							? { background: rarityDefinition.cardBackground }
							: undefined
					}
				>
					<div className="relative w-full overflow-hidden rounded-[10px]">
						{player ? (
							<img
								src={player.image}
								alt={player.name}
								className="aspect-[4/4] w-full object-cover shadow-inner"
								loading="lazy"
							/>
						) : (
							<div className="flex aspect-[4/4] flex-col items-center justify-center gap-2 px-3 text-center">
								<span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
									{slot.label}
								</span>
								<span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
									Tap to assign
								</span>
							</div>
						)}

						{player && (
							<>
								<div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-xs bg-black/80 text-center shadow-2xl backdrop-blur">
									<span className="m-0 block text-xs font-semibold uppercase  text-white/95">
										{player ? getSlotDisplayValue(entry, displayMode) : null}
									</span>
								</div>
								<span
									className="absolute left-0 top-0 items-center justify-center px-2 py-[2px] text-xs font-semibold uppercase "
									style={{
										background:
											positionColor.gradient ?? `${positionColor.primary}22`,
										color: positionColor.gradient
											? "#fff"
											: positionColor.primary,
									}}
								>
									{slot.label}
								</span>
								<span className="absolute right-0 top-0 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]">
									<ElementIcon element={player.element} />
								</span>
							</>
						)}
					</div>
				</div>
			</div>
		</button>
	);
}

function getSlotPositionStyle(slot: FormationSlot) {
	const columnIndex = slot.column - 1;
	const rowIndex = slot.row - 1;
	const left =
		COLUMN_STOPS[columnIndex] ??
		(columnIndex / Math.max(FIELD_COLUMNS - 1, 1)) * 100;
	const top =
		ROW_STOPS[rowIndex] ?? (rowIndex / Math.max(FIELD_ROWS - 1, 1)) * 100;
	return {
		left: `${left}%`,
		top: `${top}%`,
	};
}

function getSlotDisplayValue(entry: SlotAssignment, mode: DisplayMode) {
	const player = entry.player;
	const fallback = player?.nickname || player?.name || entry.slot.label;
	if (!player) {
		return entry.slot.label;
	}
	if (mode === "nickname") {
		return fallback;
	}
	const statValue = entry.computed?.power[mode];
	if (typeof statValue === "number" && !Number.isNaN(statValue)) {
		return formatNumber(statValue);
	}
	return fallback;
}

function ElementIcon({ element }: { element: string }) {
	const elementType = mapToElementType(element);
	const definition = getElementIcon(elementType);
	const Icon = definition.icon;

	if (!Icon) return null;

	return (
		<span
			className="inline-flex items-center justify-center rounded-full border border-white/20 p-1.5 shadow-sm shadow-black/30"
			style={{
				backgroundColor: definition.color,
			}}
		>
			<Icon className="size-3 text-white" aria-hidden="true" />
		</span>
	);
}

function getPlayerById(id: number | null | undefined): PlayerRecord | null {
	if (typeof id !== "number") return null;
	return playersById.get(id) ?? null;
}

function normalizePosition(position: string) {
	const normalized = position.trim().toUpperCase();
	if (normalized === "MF" || normalized === "MD") return "MF";
	if (normalized === "FW") return "FW";
	if (normalized === "DF") return "DF";
	if (normalized === "GK") return "GK";
	return "MF";
}
