import { arrayMove } from "@dnd-kit/sortable";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Suspense } from "react";
import { AddDigimonButton } from "@/components/team-builder/AddDigimonButton";
import { TeamBuilderBoard, TeamSlotSkeleton } from "@/components/team-builder/TeamBuilderBoard";
import { TeamImportExportControls } from "@/components/team-builder/TeamImportExportControls";
import { digimonListAtom } from "@/store/atoms";
import {
	activeTeamSlotIdAtom,
	createTeamSlot,
	type TeamSlot,
	teamSlotsAtom,
} from "@/store/team-builder-atoms";

export default function TeamBuilderPage() {
	return (
		<Suspense fallback={<TeamBuilderFallback />}>
			<TeamBuilderContent />
		</Suspense>
	);
}

function TeamBuilderContent() {
	const list = useAtomValue(digimonListAtom);
	const [slots, setSlots] = useAtom(teamSlotsAtom);
	const setActiveSlotId = useSetAtom(activeTeamSlotIdAtom);

	const handleAdd = (slug: string) => {
		setSlots((current) => [...current, createTeamSlot(slug)]);
	};

	const handleImport = (nextSlots: TeamSlot[]) => {
		setSlots(nextSlots);
		setActiveSlotId(null);
	};

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-2 pb-10">
			{slots.length ? (
				<>
					<TeamBuilderBoard
						slots={slots}
						onReorder={(activeId, overId) => {
							setSlots((current) => {
								const oldIndex = current.findIndex(
									(slot) => slot.id === activeId,
								);
								const newIndex = current.findIndex(
									(slot) => slot.id === overId,
								);
								if (oldIndex === -1 || newIndex === -1) {
									return current;
								}
								return arrayMove(current, oldIndex, newIndex);
							});
						}}
						onUpdate={(updated) => {
							setSlots((current) =>
								current.map((slot) =>
									slot.id === updated.id ? updated : slot,
								),
							);
						}}
						onRemove={(id) => {
							setSlots((current) => current.filter((slot) => slot.id !== id));
						}}
					/>

					<div className="pointer-events-none fixed bottom-6 right-6 z-40 flex justify-end">
						<div className="pointer-events-auto flex flex-col items-end gap-3">
							<TeamImportExportControls slots={slots} onImport={handleImport} />
							<AddDigimonButton list={list} onSelect={handleAdd} />
						</div>
					</div>
				</>
			) : (
				<div className="grid place-items-center rounded-3xl border border-dashed border-border/50 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
					<div className="space-y-4">
						<p className="text-base text-foreground">No Digimon yet.</p>
						<p>
							Add your first partner to begin crafting evolution routes and
							synergistic personalities.
						</p>
						<AddDigimonButton list={list} onSelect={handleAdd} />
						<div className="flex justify-center">
							<TeamImportExportControls slots={slots} onImport={handleImport} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function TeamBuilderFallback() {
	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-2 pb-10">
			<div className="grid gap-4">
				{Array.from({ length: 3 }).map((_, index) => (
					<div key={index} className="animate-pulse">
						<TeamSlotSkeleton />
					</div>
				))}
			</div>
		</div>
	);
}
