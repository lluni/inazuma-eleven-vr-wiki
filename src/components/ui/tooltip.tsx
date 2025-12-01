import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type * as React from "react";

import { cn } from "@/lib/utils";

function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
	return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
}

type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root> & {
	delayDuration?: number;
};

function Tooltip({ delayDuration = 500, ...props }: TooltipProps) {
	return (
		<TooltipProvider delayDuration={delayDuration}>
			<TooltipPrimitive.Root data-slot="tooltip" {...props} />
		</TooltipProvider>
	);
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
	variant?: "primary" | "surface" | "ghost";
	hideArrow?: boolean;
	arrowClassName?: string;
};

function TooltipContent({ className, sideOffset = 0, children, variant = "primary", hideArrow = false, arrowClassName, ...props }: TooltipContentProps) {
	type TooltipVariant = NonNullable<TooltipContentProps["variant"]>;

	const variantClassMap: Record<TooltipVariant, string> = {
		primary: "bg-primary text-primary-foreground",
		surface: "bg-card/95 text-card-foreground border border-border/60 shadow-lg backdrop-blur-md",
		ghost: "bg-transparent text-foreground border-none shadow-none",
	};
	const arrowClassMap: Record<TooltipVariant, string> = {
		primary: "bg-primary fill-primary",
		surface: "bg-card/95 fill-card border border-border/60",
		ghost: "bg-transparent fill-transparent",
	};

	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				data-slot="tooltip-content"
				sideOffset={sideOffset}
				className={cn(
					"animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
					variantClassMap[variant],
					className,
				)}
				{...props}
			>
				{children}
				{hideArrow ? null : (
					<TooltipPrimitive.Arrow
						className={cn("z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]", arrowClassMap[variant], arrowClassName)}
					/>
				)}
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
