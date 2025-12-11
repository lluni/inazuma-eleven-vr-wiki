export type BaseStats = {
	kick: number;
	control: number;
	technique: number;
	pressure: number;
	physical: number;
	agility: number;
	intelligence: number;
	total: number;
};

export type PowerStats = {
	shootAT: number;
	focusAT: number;
	focusDF: number;
	wallDF: number;
	scrambleAT: number;
	scrambleDF: number;
	kp: number;
};

export const POWER_FORMULAS: Record<keyof PowerStats, string> = {
	shootAT: "(Kick x1.0) + (Control x1.0)",
	focusAT: "(Technique x1.0) + (Control x1.0) + (Kick x0.5)",
	focusDF: "(Technique x1.0) + (Intelligence x1.0) + (Agility x0.5)",
	wallDF: "(Pressure x1.0) + (Physical x1.0)",
	scrambleAT: "(Intelligence x1.0) + (Physical x1.0)",
	scrambleDF: "(Intelligence x1.0) + (Pressure x1.0)",
	kp: "(Pressure x2.0) + (Physical x3.0) + (Agility x4.0)",
};

export function computePower(stats: BaseStats): PowerStats {
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
