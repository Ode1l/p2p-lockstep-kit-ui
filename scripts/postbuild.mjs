import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const indexDts = resolve(process.cwd(), "dist/index.d.ts");
const demoDts = resolve(process.cwd(), "dist/demo.d.ts");

const source = await readFile(indexDts, "utf8");
const normalized = source.replace(/^import "\.\/tailwind\.css";\n/, "");
await writeFile(indexDts, normalized, "utf8");

await rm(demoDts, { force: true });
