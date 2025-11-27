import { useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  BrickWall,
	CheckCircle2,
	CirclePlus,
	HeartPulse,
	Shield,
	ShieldCheck,
	Swords,
	Target,
	UserX,
} from "lucide-react";

import { PlayerAssignmentModal } from "@/components/team-builder/PlayerAssignmentModal";
import { ElementChip, PositionChip } from "@/components/team-builder/Chips";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	FORMATIONS,
	formationsMap,
	type FormationDefinition,
	type FormationSlot,
} from "@/data/formations";
import { useIsMobile } from "@/hooks/use-mobile";
import { mapToElementType, mapToTeamPosition, playersById, playersDataset, type PlayerRecord } from "@/lib/players-data";
import { formatNumber } from "@/lib/data-helpers";
import { getElementIcon, getPositionColor } from "@/lib/icon-picker";
import { cn } from "@/lib/utils";
import { teamBuilderAtom, type TeamBuilderAssignments } from "@/store/team-builder";
import { favoritePlayersAtom } from "@/store/favorites";
import type { FiltersState } from "@/types/team-builder";

type SlotAssignment = {
	slot: FormationSlot;
	player: PlayerRecord | null;
};

const FIELD_COLUMNS = 5;
const FIELD_ROWS = 6;
const FIELD_ROW_TEMPLATE = ["0.5fr", "0.5fr", "0.5fr", "0.4fr", "0.3fr", "0.2fr"].join(" ");
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
	const favoriteSet = useMemo(() => new Set(favoritePlayerIds), [favoritePlayerIds]);

	const formation = formationsMap.get(teamState.formationId) ?? FORMATIONS[0];

	useEffect(() => {
		if (!formation.slots.length) {
			setActiveSlotId(null);
			setDetailsOpen(false);
			return;
		}
		if (activeSlotId && !formation.slots.some((slot) => slot.id === activeSlotId)) {
			setActiveSlotId(null);
			setDetailsOpen(false);
		}
	}, [formation, activeSlotId]);

	const slotAssignments: SlotAssignment[] = useMemo(() => {
		return formation.slots.map((slot) => ({
			slot,
			player: getPlayerById(teamState.assignments[slot.id]),
		}));
	}, [formation.slots, teamState.assignments]);

	const assignedPlayerIds = useMemo(() => {
		const ids = Object.values(teamState.assignments).filter(
			(value): value is number => typeof value === "number",
		);
		return new Set(ids);
	}, [teamState.assignments]);

	const filledCount = slotAssignments.filter((entry) => entry.player).length;
	const activeSlot = activeSlotId
		? formation.slots.find((slot) => slot.id === activeSlotId) ?? null
		: null;
	const activeAssignment =
		activeSlot ? slotAssignments.find((entry) => entry.slot.id === activeSlot.id) ?? null : null;

	const filteredPlayers = useMemo(() => {
		if (!activeSlot) return [];
		const query = filters.search.trim().toLowerCase();

		return playersDataset
			.filter((player) => {
				if (filters.position !== "all" && player.position !== filters.position) return false;
				if (filters.element !== "all" && player.element !== filters.element) return false;
				if (filters.role !== "all" && player.role !== filters.role) return false;
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
	}, [activeSlot, filters.element, filters.position, filters.role, filters.search]);

	const favoriteOptions = useMemo(() => {
		if (!activeSlot) return [];
		return playersDataset.filter((player) => favoriteSet.has(player.id));
	}, [activeSlot, favoriteSet]);

	const handleFormationChange = (formationId: FormationDefinition["id"]) => {
		setTeamState((prev) => {
			const previousFormation = formationsMap.get(prev.formationId) ?? FORMATIONS[0];
			const nextFormation = formationsMap.get(formationId) ?? previousFormation;

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
			.filter((entry): entry is { id: number; position: string | null } => Boolean(entry));

		const nextAssignments: TeamBuilderAssignments = {};
		const remaining = [...assignedPlayers];

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
				matchIndex >= 0 ? remaining.splice(matchIndex, 1) : remaining.splice(0, 1);
			nextAssignments[slot.id] = selected?.id ?? null;
		});

			return {
				formationId,
				assignments: nextAssignments,
			};
		});
		setActiveSlotId(null);
		setDetailsOpen(false);
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
					<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						<span>{filledCount}/11 slots filled</span>
						{filledCount === 11 ? (
							<CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
						) : (
							<CirclePlus className="size-4 text-amber-500" aria-hidden="true" />
						)}
					</div>
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
				<div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm">
					<FormationPitch
						assignments={slotAssignments}
						activeSlotId={activeSlotId}
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
										"rounded-lg border px-3 py-2 text-sm shadow-sm",
										player
											? "border-muted bg-background"
											: "border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground",
									)}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<PositionChip label={slot.label} />
											<span className="font-medium">{slot.label}</span>
										</div>
										{player ? (
											<Button
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-xs"
												onClick={() => handleOpenPicker(slot)}
											>
												Assign
											</Button>
										) : null}
									</div>
									{player ? (
										<div className="mt-1 text-sm font-semibold">{player.name}</div>
									) : (
										<button
											type="button"
											onClick={() => handleOpenPicker(slot)}
											className="mt-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-primary underline-offset-2 hover:underline"
										>
											Assign player
										</button>
									)}
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
	onSlotSelect: (slot: FormationSlot) => void;
	onEmptySlotSelect: (slot: FormationSlot) => void;
};

function FormationPitch({
	assignments,
	activeSlotId,
	onSlotSelect,
	onEmptySlotSelect,
}: FormationPitchProps) {
	const gridCells = useMemo(() => {
		const cells: Record<string, SlotAssignment[]> = {};
		for (let row = 1; row <= FIELD_ROWS; row += 1) {
			for (let column = 1; column <= FIELD_COLUMNS; column += 1) {
				cells[`${row}-${column}`] = [];
			}
		}
		assignments.forEach((entry) => {
			const key = `${entry.slot.row}-${entry.slot.column}`;
			if (!cells[key]) cells[key] = [];
			cells[key].push(entry);
		});
		return cells;
	}, [assignments]);

	return (
		<div className="rounded-[32px] border border-emerald-800 bg-gradient-to-b from-emerald-700/80 to-emerald-900/90 shadow-inner">
			<div className="relative mx-auto w-full aspect-[6/5] sm:aspect-[6/5] md:aspect-[4/5] lg:aspect-[6/5]">
				<div className="absolute inset-3 rounded-[28px] border border-white/25 sm:inset-4" />
				<div className="absolute left-1/2 top-4 h-30 w-64 -translate-x-1/2 rounded-md border-2 border-white/10" />
				<div className="absolute left-1/2 bottom-4 h-30 w-64 -translate-x-1/2 rounded-md border border-white/10" />
				<div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/15" />
				<div className="absolute left-1/2 top-1/2 h-42 w-42 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
				<div className="absolute inset-3 flex flex-col sm:inset-4">
					<div
						className="grid flex-1 grid-cols-5 gap-2 sm:gap-2.5"
						style={{ gridTemplateRows: FIELD_ROW_TEMPLATE }}
					>
						{Array.from({ length: FIELD_ROWS }).map((_, rowIndex) =>
							Array.from({ length: FIELD_COLUMNS }).map((__, columnIndex) => {
								const key = `${rowIndex + 1}-${columnIndex + 1}`;
								const slots = gridCells[key] ?? [];
								return (
									<div
										key={key}
										className="flex flex-col items-center justify-center gap-1"
									>
										{slots.map((entry) => (
											<PlayerSlotCard
												key={entry.slot.id}
												entry={entry}
												isActive={entry.slot.id === activeSlotId}
												onSelect={() => onSlotSelect(entry.slot)}
												onEmptySelect={() => onEmptySlotSelect(entry.slot)}
											/>
										))}
									</div>
								);
							}),
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

type PlayerSlotCardProps = {
	entry: SlotAssignment;
	isActive: boolean;
	onSelect: () => void;
	onEmptySelect: () => void;
};

function PlayerSlotCard({ entry, isActive, onSelect, onEmptySelect }: PlayerSlotCardProps) {
	const { slot, player } = entry;
	const positionColor = getPositionColor(mapToTeamPosition(slot.label));

	if (!player) {
		return (
			<button
				type="button"
				onClick={onEmptySelect}
				className={cn(
					"w-full rounded-2xl border border-dashed border-white/30 bg-white/5 px-3 py-4 text-center text-white/80 transition hover:border-white/60",
					isActive && "border-emerald-300 bg-white/10 text-white",
				)}
			>
				<div className="flex flex-col items-center gap-1.5">
					<div className="flex size-20 items-center justify-center rounded-2xl border-white/40 text-lg font-semibold uppercase tracking-wide">
						{slot.label}
					</div>
				</div>
			</button>
		);
	}

	return (
		<div className="relative w-full">
			<button
				type="button"
				onClick={onSelect}
				className={cn(
					"flex w-full flex-col items-center gap-1.5 rounded-2xl border px-3 py-2.5 text-center text-white transition",
					isActive
						? "border-emerald-300 bg-white/15 shadow-lg"
						: "border-white/25 bg-white/5 hover:border-white/60",
				)}
			>
				<div className="relative w-full">
					<img
						src={player.image}
						alt={player.name}
						className="mx-auto size-20 rounded-2xl object-cover shadow-lg"
						loading="lazy"
					/>
					<div className="absolute left-2 right-2 top-2 flex items-center justify-between text-[10px] font-semibold uppercase">
						<ElementIcon element={player.element} />
						<span
							className="rounded-full px-2 py-[2px]"
							style={{
								background: positionColor.gradient ?? positionColor.primary,
								color: positionColor.gradient ? "#fff" : positionColor.primary,
							}}
						>
							{slot.label}
						</span>
					</div>
				</div>
				<p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-white/90">
					{player.nickname || player.name}
				</p>
			</button>
		</div>
	);
}

type SlotDetailsDrawerProps = {
	open: boolean;
	slot: FormationSlot | null;
	assignment: SlotAssignment | null;
	onAssign: (slot: FormationSlot) => void;
	onClearSlot: (slotId: string) => void;
	onOpenChange: (open: boolean) => void;
};

function SlotDetailsDrawer({
	open,
	slot,
	assignment,
	onAssign,
	onClearSlot,
	onOpenChange,
}: SlotDetailsDrawerProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full !max-w-2xl border-l p-0 sm:max-w-md">
				<div className="h-full overflow-y-auto p-3">
					<SlotDetailsPanel
						slot={slot}
						assignment={assignment}
						onAssign={onAssign}
						onClearSlot={onClearSlot}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}

type SlotDetailsPanelProps = {
	slot: FormationSlot | null;
	assignment: SlotAssignment | null;
	onAssign: (slot: FormationSlot) => void;
	onClearSlot: (slotId: string) => void;
};

function SlotDetailsPanel({ slot, assignment, onAssign, onClearSlot }: SlotDetailsPanelProps) {
	const player = assignment?.player ?? null;

	return (
		<section className="rounded-xl border bg-card p-4 shadow-sm">
			<header className="flex flex-wrap items-center gap-2">
				<div>
					<p className="text-sm font-semibold">Slot details</p>
				</div>
				{slot ? <PositionChip label={slot.label} /> : null}
			</header>
			<div className="mt-4">
				{!slot ? (
					<div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
						No slot selected. Tap a position on the pitch to focus it.
					</div>
				) : !player ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
						<div className="flex size-32 items-center justify-center rounded-2xl border border-dashed text-xl font-semibold">
							{slot.label}
						</div>
						<p className="text-sm text-muted-foreground">
							This slot is empty. Choose a player to assign.
						</p>
						<Button onClick={() => onAssign(slot)}>Assign player</Button>
					</div>
				) : (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
						<div className="flex flex-col items-center gap-3">
							<img
								src={player.image}
								alt={player.name}
								className="w-full max-w-[220px] rounded-2xl border object-cover shadow-lg"
								loading="lazy"
							/>
							<div className="flex flex-wrap items-center justify-center gap-2 text-xs">
								<ElementChip element={player.element} />
								<PositionChip label={slot.label} />
							</div>
							<div className="text-center">
								<p className="text-lg font-semibold">{player.name}</p>
								<p className="text-sm text-muted-foreground">{player.nickname}</p>
							</div>
						</div>
						<div className="space-y-3">
							<div className="space-y-2">
								{[
									{ label: "Shoot AT", value: player.power.shootAT, icon: Target },
									{ label: "Focus AT", value: player.power.focusAT, icon: Swords },
									{ label: "Focus DF", value: player.power.focusDF, icon: Shield },
									{ label: "Wall DF", value: player.power.wallDF, icon: BrickWall },
									{ label: "Scramble AT", value: player.power.scrambleAT, icon: Target },
									{ label: "Scramble DF", value: player.power.scrambleDF, icon: ShieldCheck },
									{ label: "KP", value: player.power.kp, icon: HeartPulse },
								].map((stat) => (
									<div
										key={stat.label}
										className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
									>
										<div className="flex items-center gap-2 text-sm font-medium">
											<stat.icon className="size-4 text-emerald-600" />
											{stat.label}
										</div>
										<span className="text-base font-semibold">
											{formatNumber(stat.value)}
										</span>
									</div>
								))}
							</div>
							<div className="flex flex-wrap gap-2">
								<Button onClick={() => onAssign(slot)} className="flex-1 min-w-[140px]">
									Replace player
								</Button>
								<Button
									variant="outline"
									onClick={() => onClearSlot(slot.id)}
									className="flex-1 min-w-[140px]"
								>
									Remove from slot
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
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


