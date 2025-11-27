import { Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import DigimonOverviewPage from "@/pages/DigimonOverviewPage";
import TeamBuilderPage from "@/pages/TeamBuilderPage";

function App() {
	return (
		<Routes>
			<Route path="/" element={<AppLayout />}>
				<Route index element={<DigimonOverviewPage />} />
				<Route path="digimon/:slug" element={<DigimonOverviewPage />} />
				<Route path="team-builder" element={<TeamBuilderPage />} />
			</Route>
		</Routes>
	);
}

export default App;
