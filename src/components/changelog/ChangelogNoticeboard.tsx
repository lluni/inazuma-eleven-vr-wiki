import { useAtom } from "jotai";
import { ChevronDown, ChevronUp, History, Loader2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { changelogLastSeenVersionAtom } from "@/store/changelog";

const CHANGELOG_PATH = `${import.meta.env.BASE_URL}changelog.md`;

type ChangeItem = {
	text: string;
	children: string[];
};

type ChangelogEntry = {
	version: string;
	date?: string | null;
	changes: ChangeItem[];
};

type InlineSegment =
	| { type: "text"; content: string }
	| { type: "strong"; content: string }
	| { type: "em"; content: string }
	| { type: "code"; content: string }
	| { type: "link"; content: string; href: string };

function parseInlineMarkdown(text: string): InlineSegment[] {
	const segments: InlineSegment[] = [];
	let remaining = text;
	const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/;

	while (remaining.length > 0) {
		const match = remaining.match(tokenRegex);
		if (!match || match.index === undefined) {
			if (remaining) {
				segments.push({ type: "text", content: remaining });
			}
			break;
		}

		if (match.index > 0) {
			segments.push({
				type: "text",
				content: remaining.slice(0, match.index),
			});
		}

		const token = match[0];
		if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
			segments.push({
				type: "strong",
				content: token.slice(2, -2),
			});
		} else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
			segments.push({
				type: "em",
				content: token.slice(1, -1),
			});
		} else if (token.startsWith("`") && token.endsWith("`")) {
			segments.push({
				type: "code",
				content: token.slice(1, -1),
			});
		} else if (token.startsWith("[") && token.includes("](")) {
			const linkMatch = token.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
			if (linkMatch) {
				segments.push({
					type: "link",
					content: linkMatch[1],
					href: linkMatch[2],
				});
			} else {
				segments.push({ type: "text", content: token });
			}
		} else {
			segments.push({ type: "text", content: token });
		}

		const nextIndex = match.index + token.length;
		remaining = remaining.slice(nextIndex);
	}

	return segments;
}

function parseChangeItems(body: string): ChangeItem[] {
	const lines = body.split("\n");
	const items: ChangeItem[] = [];
	let currentItem: ChangeItem | null = null;

	const appendToLastChild = (text: string) => {
		if (!currentItem) return;
		const targetIndex = currentItem.children.length - 1;
		if (targetIndex >= 0) {
			currentItem.children[targetIndex] = currentItem.children[targetIndex] + " " + text.trim();
		} else {
			currentItem.text = `${currentItem.text} ${text.trim()}`;
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		if (!line.trim()) {
			continue;
		}

		const match = rawLine.match(/^(\s*)[-*]\s+(.*)$/);
		if (match) {
			const indent = match[1]?.length ?? 0;
			const content = match[2].trim();
			if (indent <= 1) {
				currentItem = { text: content, children: [] };
				items.push(currentItem);
			} else if (currentItem) {
				currentItem.children.push(content);
			} else {
				currentItem = { text: content, children: [] };
				items.push(currentItem);
			}
			continue;
		}

		appendToLastChild(line);
	}

	return items;
}

function parseChangelog(markdown: string): ChangelogEntry[] {
	const matches = markdown.matchAll(/#\s+Version\s+([^\n]+)\n([\s\S]*?)(?=\n#\s+Version|\s*$)/g);
	const entries: ChangelogEntry[] = [];

	for (const match of matches) {
		const [, versionLine, body] = match;
		const [rawVersion, rawDate] = versionLine.split(" - ");
		const version = rawVersion.trim();
		const date = rawDate ? rawDate.trim() : null;
		const changes = parseChangeItems(body);
		entries.push({ version, date, changes });
	}

	return entries;
}

export function ChangelogNoticeboard() {
	const [lastSeenVersion, setLastSeenVersion] = useAtom(changelogLastSeenVersionAtom);
	const [entries, setEntries] = useState<ChangelogEntry[]>([]);
	const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [open, setOpen] = useState(false);
	const [showAllEntries, setShowAllEntries] = useState(false);

	const latestVersion = entries[0]?.version ?? null;
	const hasUnseenVersion = Boolean(latestVersion) && latestVersion !== lastSeenVersion;

	useEffect(() => {
		let aborted = false;

		async function loadChangelog() {
			setStatus("loading");
			setErrorMessage(null);
			try {
				const response = await fetch(CHANGELOG_PATH, { cache: "no-store" });
				if (!response.ok) {
					throw new Error("Failed to load changelog");
				}
				const markdown = await response.text();
				if (aborted) return;
				const parsedEntries = parseChangelog(markdown);
				setEntries(parsedEntries);
				setStatus("ready");
			} catch (error) {
				if (aborted) return;
				setErrorMessage(error instanceof Error ? error.message : "Unable to fetch changelog");
				setStatus("error");
			}
		}

		loadChangelog();

		return () => {
			aborted = true;
		};
	}, []);

	useEffect(() => {
		if (hasUnseenVersion) {
			setOpen(true);
		}
	}, [hasUnseenVersion]);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setShowAllEntries(false);
		}
		if (!nextOpen && latestVersion) {
			setLastSeenVersion(latestVersion);
		}
	};

	const headline = useMemo(() => {
		if (status === "loading") return "Loading latest updates";
		if (status === "error") return "Changelog unavailable";
		return latestVersion ? `Latest Updates` : "No updates yet";
	}, [latestVersion, status]);

	const visibleEntries = showAllEntries || status !== "ready" ? entries : entries.slice(0, 1);
	const canToggleEntries = status === "ready" && entries.length > 1;
	const toggleLabel = showAllEntries ? "Hide previous updates" : "Show previous updates";

	const renderFormattedText = (text: string) => {
		const segments = parseInlineMarkdown(text);
		return segments.map((segment, index) => {
			const key = `${segment.type}-${segment.content}-${index}`;
			if (segment.type === "strong") {
				return <strong key={key}>{segment.content}</strong>;
			}
			if (segment.type === "em") {
				return <em key={key}>{segment.content}</em>;
			}
			if (segment.type === "code") {
				return (
					<code key={key} className="rounded bg-muted/60 px-1 py-0.5 text-xs font-semibold">
						{segment.content}
					</code>
				);
			}
			if (segment.type === "link") {
				return (
					<a key={key} className="text-primary underline underline-offset-4" href={segment.href} target="_blank" rel="noreferrer">
						{segment.content}
					</a>
				);
			}
			return <Fragment key={key}>{segment.content}</Fragment>;
		});
	};

	return (
		<>
			<Button
				variant={hasUnseenVersion ? "default" : "outline"}
				size="sm"
				onClick={() => setOpen(true)}
				disabled={status === "loading"}
				className="relative gap-1 sm:gap-2"
				aria-label="Open changelog updates"
			>
				{status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <History className="size-4" />}
				<span className="hidden sm:inline">Changelog</span>
				{hasUnseenVersion ? (
					<span className="absolute -right-1 -top-1 inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
						New
					</span>
				) : null}
			</Button>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent onOpenAutoFocus={(event) => event.preventDefault()} className="flex max-h-[85vh] w-full !max-w-2xl flex-col overflow-hidden">
					<DialogHeader className="shrink-0">
						<DialogTitle>{headline}</DialogTitle>
						<DialogDescription>Stay in the loop with the latest tweaks to the wiki.</DialogDescription>
					</DialogHeader>
					<div className="hm-scrollbar grow space-y-6 overflow-y-auto pr-2">
						{status === "loading" && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Loader2 className="size-4 animate-spin" />
								Fetching notes...
							</div>
						)}
						{status === "error" && <div className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</div>}
						{status === "ready" && entries.length === 0 && (
							<p className="text-sm text-muted-foreground">There are no changelog entries yet. Check back later!</p>
						)}
						{visibleEntries.map((entry) => {
							const isLatest = entries[0]?.version === entry.version;
							return (
								<div key={entry.version} className="space-y-2 rounded-lg border border-border/80 bg-muted/30 p-3">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<span className="font-semibold">Version {entry.version}</span>
										{entry.date ? (
											<span className="text-xs font-medium text-muted-foreground">{entry.date}</span>
										) : isLatest ? (
											<span className="text-xs uppercase tracking-wider text-muted-foreground">Latest adjustments</span>
										) : null}
									</div>
									<ul className="list-disc space-y-1 pl-5 text-sm">
										{entry.changes.map((change, index) => (
											<li key={`${entry.version}-${index}`}>
												{renderFormattedText(change.text)}
												{change.children.length > 0 ? (
													<ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
														{change.children.map((child, childIndex) => (
															<li key={`${entry.version}-${index}-${childIndex}`}>{renderFormattedText(child)}</li>
														))}
													</ul>
												) : null}
											</li>
										))}
									</ul>
								</div>
							);
						})}
						{canToggleEntries && (
							<div className="flex justify-center">
								<Button variant="ghost" size="sm" onClick={() => setShowAllEntries((prev) => !prev)} className="gap-2 border-none">
									{showAllEntries ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
									{toggleLabel}
								</Button>
							</div>
						)}
					</div>
					<DialogFooter className="shrink-0 border-t border-border/60 pt-3">
						<Button variant="ghost" asChild>
							<a href="https://github.com/vitorfdl/game-inazuma-eleven/issues" target="_blank" rel="noreferrer">
								Report inaccurate info
							</a>
						</Button>
						<Button variant="secondary" onClick={() => handleOpenChange(false)}>
							Got it
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
