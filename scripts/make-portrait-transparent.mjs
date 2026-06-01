import { removeBackground } from "@imgly/background-removal-node";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = join(root, "public/assets/menu/commander-portrait.png");
const output = join(root, "public/assets/menu/commander-portrait-transparent.png");

const bytes = readFileSync(input);
const blob = new Blob([bytes], { type: "image/png" });

const result = await removeBackground(blob, {
  model: "medium",
  output: { format: "image/png", quality: 0.95 },
});

writeFileSync(output, Buffer.from(await result.arrayBuffer()));
console.log(`Wrote ${output} (${result.size} bytes)`);
