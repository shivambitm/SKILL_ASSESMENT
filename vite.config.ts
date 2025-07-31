import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendUrl = process.env.VITE_API_URL || "http://localhost:5000";

export default defineConfig({
  root: ".",
  plugins: [react()],
  base: "/",
  build: {
    rollupOptions: {
      input: "index.html",
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          utils: ['axios', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
