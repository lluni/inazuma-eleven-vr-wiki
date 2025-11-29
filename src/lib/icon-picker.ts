import type { LucideIcon } from "lucide-react";
import {
	BrickWall,
	Dribbble,
	Flame,
	Hand,
	Mountain,
	Tornado,
	TreePine,
} from "lucide-react";

import { withBase } from "@/lib/utils";

export type ElementType = "Forest" | "Wind" | "Fire" | "Mountain";
export type MoveType = "Shot" | "Dribble" | "Wall" | "Catch";
export type TeamPosition =
	| "FW"
	| "MD"
	| "DF"
	| "GK"
	| "RESERVE"
	| "MANAGER"
	| "COORDINATOR";

type IconDefinition = {
	icon?: LucideIcon;
	color: string;
	assetPath?: string;
};

type PositionColor = {
	primary: string;
	secondary?: string;
	gradient?: string;
};

const FALLBACK_ICON: IconDefinition = {
	icon: TreePine,
	color: "#94a3b8",
};

const ELEMENT_ICON_MAP: Record<ElementType, IconDefinition> = {
	Forest: {
		icon: TreePine,
		color: "#22c55e",
	},
	Wind: {
		icon: Tornado,
		color: "#38bdf8",
	},
	Fire: {
		icon: Flame,
		color: "#ef4444",
	},
	Mountain: {
		icon: Mountain,
		color: "#b45309",
	},
};

const MOVE_ICON_MAP: Record<MoveType, IconDefinition> = {
	Shot: {
		assetPath: "icons/meteor.svg",
		color: "#d42525",
	},
	Dribble: {
		icon: Dribbble,
		color: "#16a34a",
	},
	Wall: {
		icon: BrickWall,
		color: "#0ea5e9",
	},
	Catch: {
		icon: Hand,
		color: "#ffd700",
	},
};

const POSITION_COLOR_MAP: Record<TeamPosition, PositionColor> = {
	FW: {
		primary: "#f43f5e",
		secondary: "#be123c",
		gradient: "linear-gradient(135deg, #fb7185 0%, #be123c 100%)",
	},
	MD: {
		primary: "#4ade80",
		secondary: "#15803d",
		gradient: "linear-gradient(135deg, #86efac 0%, #15803d 100%)",
	},
	DF: {
		primary: "#60a5fa",
		secondary: "#1d4ed8",
		gradient: "linear-gradient(135deg, #93c5fd 0%, #1d4ed8 100%)",
	},
	GK: {
		primary: "#fbbf24",
		secondary: "#b45309",
		gradient: "linear-gradient(135deg, #fef08a 0%, #b45309 100%)",
	},
	RESERVE: {
		primary: "#fb923c",
		secondary: "#c2410c",
		gradient: "linear-gradient(135deg, #fdba74 0%, #c2410c 100%)",
	},
	MANAGER: {
		primary: "#c084fc",
		secondary: "#7e22ce",
		gradient: "linear-gradient(135deg, #e9d5ff 0%, #7e22ce 100%)",
	},
	COORDINATOR: {
		primary: "#67e8f9",
		secondary: "#0e7490",
		gradient: "linear-gradient(135deg, #a5f3fc 0%, #0e7490 100%)",
	},
};

function normalizeIcon(definition: IconDefinition): IconDefinition {
	if (!definition.assetPath) return definition;
	return {
		...definition,
		assetPath: withBase(definition.assetPath),
	};
}

export function getElementIcon(element: ElementType): IconDefinition {
	const definition = ELEMENT_ICON_MAP[element] ?? FALLBACK_ICON;
	return normalizeIcon(definition);
}

export function getMoveIcon(move: MoveType): IconDefinition {
	const definition = MOVE_ICON_MAP[move] ?? FALLBACK_ICON;
	return normalizeIcon(definition);
}

export function getPositionColor(position: TeamPosition): PositionColor {
	return (
		POSITION_COLOR_MAP[position] ?? {
			primary: "#94a3b8",
		}
	);
}
