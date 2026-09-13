import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { profilesPlugin } from "./server/plugin.mjs";
export default defineConfig({
  plugins: [react(), profilesPlugin()],
  clearScreen: false,
  server: { strictPort: true },
  envPrefix: ["VITE_", "TAURI_ENV_"],
});
