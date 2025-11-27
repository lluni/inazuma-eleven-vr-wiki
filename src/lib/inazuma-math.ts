

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