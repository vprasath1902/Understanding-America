// Timeline generator: data -> SVG, in the locked visual style.
// Input: { title, desc, events: [{ year, label }] }

import { canvas, esc, idFromName } from "./lib.mjs";

export function timeline({ name, title, desc, events = [] }) {
  const width = 900;
  const height = 280;
  const left = 90;
  const right = width - 90;
  const y = 150;
  const n = events.length;
  const step = n > 1 ? (right - left) / (n - 1) : 0;

  const marks = events
    .map((e, i) => {
      const x = n > 1 ? left + step * i : (left + right) / 2;
      return `    <g transform="translate(${Math.round(x)} ${y})"><circle class="dot" r="12"/><text class="h" y="-30" font-size="20">${esc(
        e.year
      )}</text><text class="s" y="44" font-size="15">${esc(e.label)}</text></g>`;
    })
    .join("\n");

  const body = `  <text class="t h" x="${width / 2}" y="48" text-anchor="middle" font-size="30">${esc(
    title
  )}</text>
  <line class="rule" x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke-linecap="round"/>
  <g class="t" text-anchor="middle">
${marks}
  </g>`;

  return canvas({ id: idFromName(name), width, height, title, desc, body });
}
