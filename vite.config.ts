import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// const isDev = process.env.NODE_ENV === "development";

// const backendUrl = isDev
//   ? "https://cautious-fortnight-j7j6p67px4j2pwrg-5002.app.github.dev/"
//   : "https://cautious-fortnight-j7j6p67px4j2pwrg-5002.app.github.dev/";
// console.log("Vite Proxy Backend URL:", backendUrl);
const backendUrl = process.env.VITE_API_URL || "http://localhost:5002";

export default defineConfig({
  root: ".",
  plugins: [react()],
  base: "./",
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
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
