import { existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const localAliases = [
  {
    name: "p2p-lockstep-kit-network",
    path: new URL("../p2p-lockstep-kit-network/network/index.ts", import.meta.url),
  },
  {
    name: "p2p-lockstep-kit-session",
    path: new URL("../p2p-lockstep-kit-session/session/index.ts", import.meta.url),
  },
].flatMap(({ name, path }) => {
  if (process.env.P2P_LOCKSTEP_USE_LOCAL_PACKAGES === "0" || !existsSync(path)) {
    return [];
  }
  return [{ find: name, replacement: fileURLToPath(path) }];
});

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: localAliases,
  },
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    sourcemap: true,
  },
});
