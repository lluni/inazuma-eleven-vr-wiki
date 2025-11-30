import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
	hideSpinButtons?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, hideSpinButtons, ...props }, ref) => {
		const inputRef = React.useRef<HTMLInputElement>(null);
		const combinedRef = useCombinedRef(ref, inputRef);

		const isNumberInput = type === "number";
		const showSpinButtons = isNumberInput && !hideSpinButtons && !props.disabled;

		const handleIncrement = () => {
			inputRef.current?.stepUp();
			inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
		};

		const handleDecrement = () => {
			inputRef.current?.stepDown();
			inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
		};

		if (showSpinButtons) {
			return (
				<div className="relative flex items-center">
					<input
						ref={combinedRef}
						type={type}
						data-slot="input"
						className={cn(
							"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-8 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
							"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
							"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
							className,
						)}
						{...props}
					/>
					<div className="absolute right-1 flex flex-col">
						<button
							type="button"
							tabIndex={-1}
							onClick={handleIncrement}
							className="flex h-4 w-6 items-center justify-center rounded-t-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Increment"
						>
							<ChevronUp className="size-3" />
						</button>
						<button
							type="button"
							tabIndex={-1}
							onClick={handleDecrement}
							className="flex h-4 w-6 items-center justify-center rounded-b-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Decrement"
						>
							<ChevronDown className="size-3" />
						</button>
					</div>
				</div>
			);
		}

		return (
			<input
				ref={combinedRef}
				type={type}
				data-slot="input"
				className={cn(
					"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
					"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
					"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
					className,
				)}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";

function useCombinedRef<T>(
	...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
	return React.useCallback(
		(element: T | null) => {
			for (const ref of refs) {
				if (!ref) continue;
				if (typeof ref === "function") {
					ref(element);
				} else {
					(ref as React.MutableRefObject<T | null>).current = element;
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		refs,
	);
}

export { Input };
