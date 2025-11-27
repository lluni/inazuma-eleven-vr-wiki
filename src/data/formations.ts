export type PlayerPositionCode = "FW" | "MF" | "DF" | "GK";

export type FormationSlot = {
	id: string;
	label: PlayerPositionCode;
	column: number; // 1 = Left, 5 = Right
	row: number; // 1 = Attack, 6 = Goalkeeper
	allowedPositions?: PlayerPositionCode[];
};

export type FormationDefinition = {
	id: string;
	name: string;
	summary: string;
	slots: FormationSlot[];
};

const slot = (
	id: string,
	label: PlayerPositionCode,
	column: number,
	row: number,
	allowedPositions?: PlayerPositionCode[],
): FormationSlot => ({
	id,
	label,
	column,
	row,
	allowedPositions: allowedPositions ?? [label],
});

const FORMATION_DATA: FormationDefinition[] = [
	{
		id: "433-delta",
		name: "4-3-3 Delta",
		summary: "Aggressive trident up front with staggered mids supporting.",
		slots: [
			slot("delta-fw-left", "FW", 1, 1),
			slot("delta-fw-center", "FW", 3, 1),
			slot("delta-fw-right", "FW", 5, 1),
			slot("delta-mf-left-half", "MF", 2, 2),
			slot("delta-mf-right-half", "MF", 4, 2),
			slot("delta-mf-center", "MF", 3, 3),
			slot("delta-df-left", "DF", 1, 3),
			slot("delta-df-right", "DF", 5, 3),
			slot("delta-df-leftmid", "DF", 2, 4),
			slot("delta-df-rightmid", "DF", 4, 4),
			slot("delta-gk", "GK", 3, 6),
		],
	},
	{
		id: "451-balanced",
		name: "4-5-1 Balanced",
		summary: "Crowded midfield for possession with lone striker.",
		slots: [
			slot("balanced-fw-center", "FW", 3, 1),
			slot("balanced-mf-left", "MF", 1, 2),
			slot("balanced-mf-center", "MF", 3, 2),
			slot("balanced-mf-right", "MF", 5, 2),
			slot("balanced-mf-half-left", "MF", 2, 3),
			slot("balanced-mf-half-right", "MF", 4, 3),
			slot("balanced-df-left", "DF", 1, 3),
			slot("balanced-df-right", "DF", 5, 3),
			slot("balanced-df-half-left", "DF", 2, 4),
			slot("balanced-df-half-right", "DF", 4, 4),
			slot("balanced-gk", "GK", 3, 6),
		],
	},
	{
		id: "541-double-volante",
		name: "5-4-1 Double Volante",
		summary: "Double holding mids shielding a five-back wall.",
		slots: [
			slot("volante-fw-center", "FW", 3, 1),
			slot("volante-mf-left", "MF", 1, 2),
			slot("volante-mf-right", "MF", 5, 2),
			slot("volante-mf-double-1", "MF", 2, 3),
			slot("volante-mf-double-2", "MF", 4, 3),
			slot("volante-df-left", "DF", 1, 4),
			slot("volante-df-right", "DF", 5, 4),
			slot("volante-df-half-left", "DF", 2, 5),
			slot("volante-df-center", "DF", 3, 5),
			slot("volante-df-half-right", "DF", 4, 5),
			slot("volante-gk", "GK", 3, 6),
		],
	},
	{
		id: "361-hexa",
		name: "3-6-1 Hexa",
		summary: "Six mids swarm the center while a trio defends.",
		slots: [
			slot("hexa-fw-center", "FW", 3, 1),
			slot("hexa-mf-left", "MF", 1, 2),
			slot("hexa-mf-leftmid", "MF", 2, 2),
			slot("hexa-mf-rightmid", "MF", 4, 2),
			slot("hexa-mf-right", "MF", 5, 2),
			slot("hexa-mf-trail-left", "MF", 2, 3),
			slot("hexa-mf-trail-right", "MF", 4, 3),
			slot("hexa-df-left", "DF", 2, 4),
			slot("hexa-df-center", "DF", 3, 4),
			slot("hexa-df-right", "DF", 4, 4),
			slot("hexa-gk", "GK", 3, 6),
		],
	},
	{
		id: "352-freedom",
		name: "3-5-2 Freedom",
		summary: "Twin forwards with flexible five-player midfield.",
		slots: [
			slot("freedom-fw-half-left", "FW", 2, 1),
			slot("freedom-fw-half-right", "FW", 4, 1),
			slot("freedom-mf-left", "MF", 1, 2),
			slot("freedom-mf-center", "MF", 3, 2),
			slot("freedom-mf-right", "MF", 5, 2),
			slot("freedom-mf-half-left", "MF", 2, 3),
			slot("freedom-mf-half-right", "MF", 4, 3),
			slot("freedom-df-half-left", "DF", 2, 4),
			slot("freedom-df-center", "DF", 3, 4),
			slot("freedom-df-half-right", "DF", 4, 4),
			slot("freedom-gk", "GK", 3, 6),
		],
	},
	{
		id: "433-triangle",
		name: "4-3-3 Triangle",
		summary: "Classic front triangle with a compact midfield.",
		slots: [
			slot("triangle-fw-left", "FW", 1, 1),
			slot("triangle-fw-center", "FW", 3, 1),
			slot("triangle-fw-right", "FW", 5, 1),
			slot("triangle-mf-advanced", "MF", 3, 2),
			slot("triangle-mf-left", "MF", 2, 3),
			slot("triangle-mf-right", "MF", 4, 3),
			slot("triangle-df-wide-left", "DF", 1, 4),
			slot("triangle-df-wide-right", "DF", 5, 4),
			slot("triangle-df-inner-left", "DF", 2, 5),
			slot("triangle-df-inner-right", "DF", 4, 5),
			slot("triangle-gk", "GK", 3, 6),
		],
	},
	{
		id: "442-diamond",
		name: "4-4-2 Diamond",
		summary: "Diamond midfield feeding dual forwards.",
		slots: [
			slot("diamond-fw-left", "FW", 1, 1),
			slot("diamond-cam", "MF", 3, 1),
			slot("diamond-fw-right", "FW", 5, 1),
			slot("diamond-mf-half-left", "MF", 2, 2),
			slot("diamond-mf-half-right", "MF", 4, 2),
			slot("diamond-dm", "MF", 3, 3),
			slot("diamond-df-left", "DF", 1, 4),
			slot("diamond-df-right", "DF", 5, 4),
			slot("diamond-df-half-left", "DF", 2, 5),
			slot("diamond-df-half-right", "DF", 4, 5),
			slot("diamond-gk", "GK", 3, 6),
		],
	},
	{
		id: "442-box",
		name: "4-4-2 Box",
		summary: "Box-shaped mids controlling central channels.",
		slots: [
			slot("box-fw-half-left", "FW", 2, 1),
			slot("box-fw-half-right", "FW", 4, 1),
			slot("box-mf-left", "MF", 1, 2),
			slot("box-mf-right", "MF", 5, 2),
			slot("box-mf-half-left", "MF", 2, 3),
			slot("box-mf-half-right", "MF", 4, 3),
			slot("box-df-left", "DF", 1, 4),
			slot("box-df-right", "DF", 5, 4),
			slot("box-df-half-left", "DF", 2, 5),
			slot("box-df-half-right", "DF", 4, 5),
			slot("box-gk", "GK", 3, 6),
		],
	},
];

export const FORMATIONS = FORMATION_DATA;
export type FormationId = (typeof FORMATIONS)[number]["id"];
export const formationsMap = new Map<string, FormationDefinition>(
	FORMATIONS.map((formation) => [formation.id, formation]),
);


