// Shared visual library for the SVG toolkit (Milestone 7).
// Loads the canonical tokens and provides a canvas wrapper that enforces the
// locked style: role="img" + <title>/<desc>, paper background, the standard
// class set. Generators (timeline, map, infographic) build on this.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const tokens = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "visuals", "tokens.json"), "utf8")
);
export const C = tokens.palette;

export const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// The locked, reusable class set (matches docs/VISUAL-STYLE.md).
export const DEFS = `<defs><style>
  .t{font-family:Arial,Helvetica,sans-serif}
  .h{font-weight:800;fill:${C.navy}}
  .s{fill:${C.muted}}
  .box{fill:${C.card};stroke:${C.line};stroke-width:2}
  .navy{fill:${C.navy}}.red{fill:${C.red}}.gold{fill:${C.gold}}
  .green{fill:${C.green}}.purple{fill:${C.purple}}
  .line{stroke:${C.navy};stroke-width:4;fill:none;stroke-linecap:round}
  .rule{stroke:${C.gold};stroke-width:6}
  .dot{fill:${C.red}}
</style></defs>`;

// Wrap inner SVG markup in a fully-formed, accessible canvas.
export function canvas({ id, width, height, title, desc, body }) {
  const tId = `${id}-title`;
  const dId = `${id}-desc`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${tId} ${dId}">
  <title id="${tId}">${esc(title)}</title>
  <desc id="${dId}">${esc(desc)}</desc>
  ${DEFS}
  <rect width="${width}" height="${height}" fill="${C.paper}" rx="${tokens.shape.canvasRadius}"/>
${body}
</svg>
`;
}

// Stable slug -> id token for aria ids.
export const idFromName = (name) => String(name).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
