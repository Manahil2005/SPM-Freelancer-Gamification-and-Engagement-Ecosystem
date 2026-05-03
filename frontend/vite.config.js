import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// =============================================================
// Vite config — proxies /api/* calls to the backend on port 5000
// so the frontend (port 5173) avoids CORS issues in development.
// =============================================================
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
