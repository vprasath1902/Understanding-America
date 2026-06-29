// Infographic generator: data -> SVG, in the locked visual style.
// Dispatches on `layout`:
//   process   — vertical numbered steps with down-arrows
//   compare   — aligned comparison grid (label column + N value columns)
//   structure — org chart (one top box -> a row of child boxes)

import { canvas, esc, idFromName, C } from "./lib.mjs";

export function infographic(spec) {
  switch (spec.layout) {
    case "process":
      return processFlow(spec);
    case "compare":
      return compare(spec);
    case "structure":
      return structure(spec);
    default:
      throw new Error(`Unknown infographic layout: ${spec.layout}`);
  }
}

// ---- process: vertical numbered steps -------------------------------------

function processFlow({ name, title, desc, steps = [] }) {
  const width = 760;
  const marginX = 40;
  const top = 100;
  const boxH = 72;
  const gap = 40;
  const boxW = width - marginX * 2;
  const height = top + steps.length * boxH + (steps.length - 1) * gap + 40;

  const parts = steps.map((s, i) => {
    const y = top + i * (boxH + gap);
    const cy = y + boxH / 2;
    const arrow =
      i < steps.length - 1
        ? `\n    <path class="line" d="M${width / 2} ${y + boxH} V${
            y + boxH + gap
          }"/>\n    <path class="navy" d="M${width / 2 - 9} ${
            y + boxH + gap - 12
          } H${width / 2 + 9} L${width / 2} ${y + boxH + gap} Z"/>`
        : "";
    const detail = s.detail
      ? `<text class="t s" x="${marginX + 76}" y="${cy + 18}" font-size="14">${esc(
          s.detail
        )}</text>`
      : "";
    const titleY = s.detail ? cy - 6 : cy + 6;
    return `    <rect class="box" x="${marginX}" y="${y}" width="${boxW}" height="${boxH}" rx="14"/>
    <circle class="navy" cx="${marginX + 36}" cy="${cy}" r="22"/>
    <text class="t" x="${marginX + 36}" y="${cy + 6}" text-anchor="middle" font-weight="800" font-size="18" fill="#ffffff">${i + 1}</text>
    <text class="t h" x="${marginX + 76}" y="${titleY}" font-size="18">${esc(
      s.title
    )}</text>${detail}${arrow}`;
  });

  const body = `  <text class="t h" x="${width / 2}" y="52" text-anchor="middle" font-size="30">${esc(
    title
  )}</text>
${parts.join("\n")}`;
  return canvas({ id: idFromName(name), width, height, title, desc, body });
}

// ---- compare: aligned comparison grid -------------------------------------

function compare({ name, title, desc, headers = [], aspects = [] }) {
  const width = 820;
  const marginX = 30;
  const top = 96;
  const labelW = 200;
  const headerH = 54;
  const rowH = 56;
  const ncols = headers.length;
  const colW = (width - marginX * 2 - labelW) / ncols;
  const height = top + headerH + aspects.length * rowH + 30;
  const gridX = marginX;
  const gridW = width - marginX * 2;

  const headerCells = headers
    .map((h, c) => {
      const x = gridX + labelW + c * colW;
      return `    <rect class="navy" x="${x}" y="${top}" width="${colW}" height="${headerH}"/>
    <text class="t" x="${x + colW / 2}" y="${top + 34}" text-anchor="middle" font-weight="800" font-size="18" fill="#ffffff">${esc(
        h
      )}</text>`;
    })
    .join("\n");

  const rows = aspects
    .map((a, i) => {
      const y = top + headerH + i * rowH;
      const bg = i % 2 === 0 ? "#eef4fb" : "#ffffff";
      const cells = a.values
        .map((v, c) => {
          const x = gridX + labelW + c * colW;
          return `    <text class="t s" x="${x + colW / 2}" y="${
            y + rowH / 2 + 5
          }" text-anchor="middle" font-size="15">${esc(v)}</text>`;
        })
        .join("\n");
      return `    <rect x="${gridX}" y="${y}" width="${gridW}" height="${rowH}" fill="${bg}"/>
    <text class="t h" x="${gridX + 14}" y="${y + rowH / 2 + 5}" font-size="15">${esc(
        a.label
      )}</text>
${cells}`;
    })
    .join("\n");

  const body = `  <text class="t h" x="${width / 2}" y="50" text-anchor="middle" font-size="30">${esc(
    title
  )}</text>
${rows}
${headerCells}
  <rect x="${gridX}" y="${top}" width="${gridW}" height="${
    headerH + aspects.length * rowH
  }" fill="none" stroke="${C.line}" stroke-width="2" rx="6"/>`;
  return canvas({ id: idFromName(name), width, height, title, desc, body });
}

// ---- structure: org chart --------------------------------------------------

function structure({ name, title, desc, top: topNode, nodes = [] }) {
  const n = nodes.length;
  const marginX = 40;
  const nodeW = 158;
  const gapX = 22;
  const nodeH = 88;
  const rowW = n * nodeW + (n - 1) * gapX;
  const width = Math.max(760, marginX * 2 + rowW);
  const height = 380;
  const cx = width / 2;
  const topY = 92;
  const topW = 240;
  const topH = 70;
  const nodesY = 250;
  const startX = (width - rowW) / 2;

  const childBoxes = nodes
    .map((nd, i) => {
      const x = startX + i * (nodeW + gapX);
      const ncx = x + nodeW / 2;
      const sub = nd.subtitle
        ? `<text class="t s" x="${ncx}" y="${nodesY + 56}" text-anchor="middle" font-size="13">${esc(
            nd.subtitle
          )}</text>`
        : "";
      return `    <rect class="box" x="${x}" y="${nodesY}" width="${nodeW}" height="${nodeH}" rx="14"/>
    <text class="t h" x="${ncx}" y="${nodesY + 34}" text-anchor="middle" font-size="16">${esc(
        nd.title
      )}</text>${sub}`;
    })
    .join("\n");

  const busY = nodesY - 26;
  const connectors =
    `    <path class="line" d="M${cx} ${topY + topH} V${busY}"/>\n` +
    `    <path class="line" d="M${startX + nodeW / 2} ${busY} H${
      startX + rowW - nodeW / 2
    }"/>\n` +
    nodes
      .map((_, i) => {
        const ncx = startX + i * (nodeW + gapX) + nodeW / 2;
        return `    <path class="line" d="M${ncx} ${busY} V${nodesY}"/>`;
      })
      .join("\n");

  const sub = topNode.subtitle
    ? `<text class="t" x="${cx}" y="${topY + 50}" text-anchor="middle" font-size="13" fill="#ffffff">${esc(
        topNode.subtitle
      )}</text>`
    : "";

  const body = `  <text class="t h" x="${cx}" y="50" text-anchor="middle" font-size="30">${esc(
    title
  )}</text>
    <rect class="navy" x="${cx - topW / 2}" y="${topY}" width="${topW}" height="${topH}" rx="16"/>
    <text class="t" x="${cx}" y="${topY + 30}" text-anchor="middle" font-weight="800" font-size="20" fill="#ffffff">${esc(
    topNode.title
  )}</text>${sub}
${connectors}
${childBoxes}`;
  return canvas({ id: idFromName(name), width, height, title, desc, body });
}
