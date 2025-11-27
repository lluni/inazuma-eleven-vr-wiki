import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { FORMATIONS } from "@/data/formations";
import type { FormationId } from "@/data/formations";

export type TeamBuilderAssignments = Record<string, number | null>;

export type TeamBuilderState = {
	formationId: FormationId;
	assignments: TeamBuilderAssignments;
};

const TEAM_BUILDER_STORAGE_KEY = "inazuma-guide.team-builder.v1";
const DEFAULT_FORMATION_ID = FORMATIONS[0]?.id ?? "433-delta";

const defaultState: TeamBuilderState = {
	formationId: DEFAULT_FORMATION_ID,
	assignments: {},
};

const storage =
	typeof window === "undefined"
		? undefined
		: createJSONStorage<TeamBuilderState>(() => window.localStorage);

export const teamBuilderAtom = atomWithStorage<TeamBuilderState>(
	TEAM_BUILDER_STORAGE_KEY,
	defaultState,
	storage,
);


