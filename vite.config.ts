import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: { outDir: "dist/site", target: "es2022", sourcemap: true, assetsInlineLimit: 2048 }
});
