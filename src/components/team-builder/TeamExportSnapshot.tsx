import { DndContext } from "@dnd-kit/core";
import type { FormationDefinition } from "@/data/formations";
import { FORMATIONS, formationsMap } from "@/data/formations";
import type { DisplayMode } from "@/store/team-builder";
import type { SlotAssignment } from "@/types/team-builder";
import { FormationPitch } from "./FormationPitch";

type TeamExportSnapshotProps = {
	starterAssignments: SlotAssignment[];
	reserveAssignments: SlotAssignment[];
	staffAssignments: SlotAssignment[];
	displayMode: DisplayMode;
	formationId: FormationDefinition["id"];
};

const noop = () => {};

export function TeamExportSnapshot({ starterAssignments, reserveAssignments, staffAssignments, displayMode, formationId }: TeamExportSnapshotProps) {
	const formation = formationsMap.get(formationId) ?? FORMATIONS[0];

	return (
		<DndContext sensors={[]}>
			<FormationPitch
				assignments={starterAssignments}
				staffEntries={staffAssignments}
				reserveEntries={reserveAssignments}
				activeSlotId={null}
				displayMode={displayMode}
				onSlotSelect={noop}
				onEmptySlotSelect={noop}
				formationId={formation.id}
				onFormationChange={noop}
				isFormationDisabled
				dragDisabled
				isDragActive={false}
			/>
		</DndContext>
	);
}
