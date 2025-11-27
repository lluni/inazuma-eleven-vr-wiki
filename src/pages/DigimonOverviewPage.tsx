import { useAtomValue } from "jotai";
import { Suspense } from "react";
import { useParams } from "react-router-dom";

import DigimonOverview from "@/components/digimon/DigimonOverview";
import { Skeleton } from "@/components/ui/skeleton";
import { digimonListAtom } from "@/store/atoms";

export default function DigimonOverviewPage() {
	return (
		<Suspense fallback={<OverviewFallback />}>
			<DigimonOverviewBoundary />
		</Suspense>
	);
}

function DigimonOverviewBoundary() {
	const list = useAtomValue(digimonListAtom);
	const params = useParams();

	const slug = params.slug ?? list[0]?.slug ?? null;

	return <DigimonOverview slug={slug} />;
}

function OverviewFallback() {
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-2 pb-6">
			<Skeleton className="h-64 rounded-3xl border border-border/50" />
			<Skeleton className="h-48 rounded-3xl border border-border/50" />
		</div>
	);
}
