import { defineConfig } from "vite";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const version = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version as string;

function sourceCommit() {
  if (process.env.BUILD_COMMIT) return process.env.BUILD_COMMIT;
  try { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
  catch { return "development"; }
}

const commit = sourceCommit();

function stampInstallerIdentity() {
  return {
    name: "stamp-installer-identity",
    closeBundle() {
      for (const path of ["dist/site/install.sh", "dist/site/install.ps1"]) {
        const source = readFileSync(path, "utf8");
        const stamped = source
          .replaceAll("__PROOF_PILE_RELEASE_VERSION__", version)
          .replaceAll("__PROOF_PILE_RELEASE_COMMIT__", commit);
        if (stamped === source || stamped.includes("__PROOF_PILE_RELEASE_")) {
          throw new Error(`${path} was not stamped with the release identity`);
        }
        writeFileSync(path, stamped);
      }
    }
  };
}

export default defineConfig({
  define: { __PROOF_PILE_BUILD_COMMIT__: JSON.stringify(commit) },
  plugins: [stampInstallerIdentity()],
  clearScreen: false,
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: { outDir: "dist/site", target: "es2022", sourcemap: true, assetsInlineLimit: 2048 }
});
