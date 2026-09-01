import { defineConfig } from "vite";
import { execFileSync } from "node:child_process";

function sourceCommit() {
  if (process.env.BUILD_COMMIT) return process.env.BUILD_COMMIT;
  try { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
  catch { return "development"; }
}

export default defineConfig({
  define: { __PROOF_PILE_BUILD_COMMIT__: JSON.stringify(sourceCommit()) },
  clearScreen: false,
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: { outDir: "dist/site", target: "es2022", sourcemap: true, assetsInlineLimit: 2048 }
});
