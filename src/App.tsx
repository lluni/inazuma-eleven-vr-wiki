import { Route, Routes } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import PlayersPage from "@/pages/PlayersPage";

function App() {
	return (
		<Routes>
			<Route path="/" element={<AppLayout />}>
				<Route index element={<PlayersPage />} />
				<Route
					path="team-builder"
					element={
						<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
							Team Builder is under construction.
						</div>
					}
				/>
			</Route>
		</Routes>
	);
}

export default App;
