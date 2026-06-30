// Milestone 7 W5 — CI gate for the built site. Run after `npm run build`.
// Verifies, against build/:
//   1. Link/asset integrity — every local href/src resolves.
//   2. Accessibility — every <img> has an alt attribute (empty alt="" is valid
//      for decorative images; a missing attribute fails, matching axe/pa11y).
//      Content visuals (hero/figure/diagram) carry non-empty alt via templates.
//   3. M7 SVGs — every asset under assets/visuals/ has <title> and <desc>.
//   4. Size budget — no SVG exceeds the byte budget.
// Exits non-zero on any failure.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = path.join(ROOT, "build");
const SVG_BUDGET = 60_000; // bytes

if (!fs.existsSync(BUILD)) {
  console.error("build/ not found — run `npm run build` first.");
  process.exit(1);
}

function walk(dir, ext) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, ext));
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const failures = [];
const htmlFiles = walk(BUILD, ".html");
const svgFiles = walk(BUILD, ".svg");

// 1. Link/asset integrity + 2. img alt
let linksChecked = 0;
let imgsChecked = 0;
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, "utf8");
  const rel = path.relative(BUILD, f);
  const dir = path.dirname(f);

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let l = m[1];
    if (/^(https?:|mailto:|#|data:)/.test(l)) continue;
    l = l.split("#")[0].split("?")[0];
    if (!l) continue;
    linksChecked++;
    if (!fs.existsSync(path.normalize(path.join(dir, l))))
      failures.push(`broken link: ${rel} -> ${l}`);
  }

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    imgsChecked++;
    if (!/\balt=/.test(m[0]))
      failures.push(`img missing alt attribute: ${rel} -> ${m[0].slice(0, 70)}`);
  }
}

// 3. M7 SVG title/desc + 4. size budget
let m7 = 0;
for (const f of svgFiles) {
  const rel = path.relative(BUILD, f);
  const bytes = fs.statSync(f).size;
  if (bytes > SVG_BUDGET)
    failures.push(`oversized SVG (${bytes}B > ${SVG_BUDGET}B): ${rel}`);
  const svg = fs.readFileSync(f, "utf8");
  // Unescaped ampersands break SVG as XML (strict parsers won't render it).
  if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(svg))
    failures.push(`unescaped "&" (use &amp;): ${rel}`);
  if (rel.includes(path.join("assets", "visuals"))) {
    m7++;
    if (!/<title[\s>]/.test(svg) || !/<desc[\s>]/.test(svg))
      failures.push(`M7 SVG missing <title>/<desc>: ${rel}`);
  }
}

console.log(
  `Checked ${linksChecked} links, ${imgsChecked} images, ${svgFiles.length} SVGs (${m7} M7 assets) across ${htmlFiles.length} pages.`
);

if (failures.length) {
  console.error(`\n✗ ${failures.length} issue(s):`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log("✓ All visual/link/accessibility checks passed.");
