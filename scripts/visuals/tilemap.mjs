// Tile-grid map generator: data -> SVG.
// Renders U.S. states as a grid of labeled tiles (a stylized "tile grid map",
// not geographically exact). Each tile shows the state's postal abbreviation
// and a value (e.g. electoral votes). Tiles with a large value are emphasized
// in navy; the value number carries the precise data, so color is secondary
// (keeps contrast AA-safe).
//
// Input: { name, title, desc, note, states: [{ abbr, row, col, value }],
//          emphasizeFrom }   // emphasizeFrom: value at/above which a tile is navy

import { canvas, esc, idFromName, C } from "./lib.mjs";

export function tilemap({
  name,
  title,
  desc,
  note,
  states = [],
  emphasizeFrom = 15,
}) {
  const marginX = 50;
  const top = 120;
  const cell = 68;
  const tile = 58;
  const cols = Math.max(...states.map((s) => s.col)) + 1;
  const rows = Math.max(...states.map((s) => s.row)) + 1;
  const width = marginX * 2 + cols * cell;
  const height = top + rows * cell + 70;

  const tiles = states
    .map((s) => {
      const x = marginX + s.col * cell;
      const y = top + s.row * cell;
      const big = s.value >= emphasizeFrom;
      const fill = big ? C.navy : "#dbeafe";
      const textFill = big ? "#ffffff" : C.navy;
      const cx = x + tile / 2;
      return `    <g>
      <rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="10" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
      <text class="t" x="${cx}" y="${y + 26}" text-anchor="middle" font-weight="800" font-size="17" fill="${textFill}">${esc(
        s.abbr
      )}</text>
      <text class="t" x="${cx}" y="${y + 46}" text-anchor="middle" font-size="15" fill="${textFill}">${esc(
        String(s.value)
      )}</text>
    </g>`;
    })
    .join("\n");

  const body = `  <text class="t h" x="${width / 2}" y="50" text-anchor="middle" font-size="30">${esc(
    title
  )}</text>
  ${
    note
      ? `<text class="t s" x="${width / 2}" y="84" text-anchor="middle" font-size="17">${esc(
          note
        )}</text>`
      : ""
  }
  <g>
${tiles}
  </g>
  <g class="t" font-size="14">
    <rect x="${marginX}" y="${height - 44}" width="18" height="18" rx="4" fill="${C.navy}"/>
    <text class="s" x="${marginX + 26}" y="${height - 30}">${emphasizeFrom}+ electoral votes</text>
    <rect x="${marginX + 200}" y="${height - 44}" width="18" height="18" rx="4" fill="#dbeafe"/>
    <text class="s" x="${marginX + 226}" y="${height - 30}">Fewer than ${emphasizeFrom}</text>
  </g>`;

  return canvas({ id: idFromName(name), width, height, title, desc, body });
}
