// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      components: path.resolve(__dirname, "src/components"),
      assets: path.resolve(__dirname, "src/assets"),
      layouts: path.resolve(__dirname, "src/layouts"),
      views: path.resolve(__dirname, "src/views"),
      routes: path.resolve(__dirname, "src/routes.jsx") // ← ✅ correctly formatted
    },
  },
});
