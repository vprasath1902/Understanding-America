// Visual generator dispatcher: data/visuals/**/*.json -> SVG files.
// Each JSON declares a `type` (timeline, …) and a `name`; the matching
// generator renders it, and the SVG is written to
// <out>/assets/visuals/<typeFolder>/<name>.svg.
//
// Run standalone (`node scripts/visuals/generate.mjs`) to emit into build/,
// or import generateVisuals(outRoot) from the site build.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { timeline } from "./timeline.mjs";
import { tilemap } from "./tilemap.mjs";
import { infographic } from "./infographic.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(ROOT, "data", "visuals");

const GENERATORS = {
  timeline: { render: timeline, folder: "timelines" },
  tilemap: { render: tilemap, folder: "maps" },
  infographic: { render: infographic, folder: "infographics" },
};

function listJson(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listJson(p));
    else if (e.name.endsWith(".json") && e.name !== "tokens.json") out.push(p);
  }
  return out;
}

export function generateVisuals(outRoot) {
  const built = [];
  for (const file of listJson(DATA)) {
    const spec = JSON.parse(fs.readFileSync(file, "utf8"));
    const gen = GENERATORS[spec.type];
    if (!gen) continue; // not a generated-visual spec
    const name = spec.name || path.basename(file, ".json");
    const svg = gen.render({ ...spec, name });
    const dir = path.join(outRoot, "assets", "visuals", gen.folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
    built.push(`assets/visuals/${gen.folder}/${name}.svg`);
  }
  return built;
}

const isMain =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = process.argv[2] || path.join(ROOT, "build");
  const built = generateVisuals(out);
  console.log(`Generated ${built.length} visual(s) into ${out}:`);
  built.forEach((b) => console.log("  " + b));
}
