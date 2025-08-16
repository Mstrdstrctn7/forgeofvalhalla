import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      strict: false,
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  // Tells Vite to fall back to index.html for all routes
  appType: 'spa',
});
