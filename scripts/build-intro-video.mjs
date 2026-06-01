/**
 * Builds public/assets/intro/intro.mp4 from intro slides (requires ffmpeg on PATH).
 * npm run build:intro
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const introDir = path.join(root, "public", "assets", "intro");
const outFile = path.join(introDir, "intro.mp4");
const listFile = path.join(introDir, "ffmpeg-list.txt");
const manifestPath = path.join(introDir, "manifest.json");

let slides = [
  "orbital-strike.png",
  "capital-wormhole.png",
  "cliff-fleet.png",
  "sky-carrier.png",
  "submarine-surface.png",
  "harbor-dock.png",
  "missile-battery.png",
  "command-tablet.png",
  "env-nebula-fleet.png",
  "capitol-vertical.png",
  "battleship-city.png",
  "warlord-horns.png",
  "walker-sixleg.png",
  "env-witness.png",
];

if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const extra = Array.isArray(manifest.files) ? manifest.files : [];
    const imageExtra = extra.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    slides = Array.from(new Set([...slides, ...imageExtra]));
  } catch {
    // keep default slides
  }
}

const existing = slides
  .map((name) => path.join(introDir, name))
  .filter((p) => fs.existsSync(p));

if (existing.length === 0) {
  console.error("No intro images found. Run: powershell -File scripts/copy-intro-assets.ps1");
  process.exit(1);
}

const lines = [];
for (const file of existing) {
  const escaped = file.replace(/\\/g, "/").replace(/'/g, "'\\''");
  lines.push(`file '${escaped}'`);
  lines.push("duration 2.8");
}
lines.push(`file '${existing[existing.length - 1].replace(/\\/g, "/")}'`);

fs.writeFileSync(listFile, lines.join("\n"));

const ff = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-vf",
    "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outFile,
  ],
  { stdio: "inherit" }
);

if (ff.status !== 0) {
  console.error("ffmpeg failed. Install ffmpeg or use the in-app slideshow (runs automatically).");
  process.exit(ff.status ?? 1);
}

console.log("Wrote", outFile);
