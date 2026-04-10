import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "p2p-lockstep-kit-network": fileURLToPath(
        new URL("../p2p-lockstep-kit-network/network/index.ts", import.meta.url),
      ),
      "p2p-lockstep-kit-session": fileURLToPath(
        new URL("../p2p-lockstep-kit-session/src/session/index.ts", import.meta.url),
      ),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "style",
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
