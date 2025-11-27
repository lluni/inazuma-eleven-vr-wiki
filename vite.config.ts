import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

const proxyConfig = {
	"/api/grindosaur": {
		target: "https://www.grindosaur.com",
		changeOrigin: true,
		rewrite: (path: any) => path.replace(/^\/api\/grindosaur/, ""),
	},
} as const;

// https://vite.dev/config/
export default defineConfig({
	// Base path for GitHub Pages under /game-digimon-story-time/
	base: "/game-inazuma-eleven-guide/",
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		open: true,
		proxy: proxyConfig,
	},
	preview: {
		proxy: proxyConfig,
	},
});
