import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  root: ".",
  plugins: [react()],
  base: "./", // Added base property for correct asset paths in production
  build: {
    rollupOptions: {
      input: "index.html",
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5002", // <-- updated to match backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
