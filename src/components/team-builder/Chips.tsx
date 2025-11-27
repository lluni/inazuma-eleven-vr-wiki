import { mapToElementType, mapToTeamPosition } from "@/lib/players-data";
import { getElementIcon, getPositionColor } from "@/lib/icon-picker";
import { formatNumber } from "@/lib/data-helpers";
import { cn } from "@/lib/utils";

export function ElementChip({ element }: { element: string }) {
	const elementType = mapToElementType(element);
	const definition = getElementIcon(elementType);
	const Icon = definition.icon;

	return (
		<span
			className="inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[11px]"
			style={{
				borderColor: definition.color,
				color: definition.color,
			}}
		>
			{Icon ? <Icon className="size-3" /> : null}
			{element}
		</span>
	);
}

export function PositionChip({ label }: { label: string }) {
	const normalized = mapToTeamPosition(label);
	const colors = getPositionColor(normalized);
	return (
		<span
			className="inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold uppercase tracking-wide"
			style={{
				background: colors.gradient ?? colors.primary,
				color: colors.gradient ? "#fff" : colors.primary,
			}}
		>
			{label}
		</span>
	);
}

export function StatChip({
	label,
	value,
	tone = "light",
}: {
	label: string;
	value: number;
	tone?: "light" | "dark";
}) {
	const toneClasses =
		tone === "dark"
			? "bg-white/15 text-white/90"
			: "bg-muted text-foreground/80";
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold",
				toneClasses,
			)}
		>
			{label}: {formatNumber(value)}
		</span>
	);
}


