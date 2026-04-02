import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/sensor-data": {
        target: "http://10.50.175.221:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/sensor-data/, "/data"),
      },
      "/hospital-map": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => {
          const p = path.replace(/^\/hospital-map/, "");
          return p === "" ? "/" : p;
        },
      },
    },
  },
});
