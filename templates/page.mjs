// Generic content page template (appendices and other standalone Markdown
// pages). Reuses the site shell — header, sidebar, search, scripts — so these
// pages match the chapter pages, without the chapter-specific scaffolding.

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function renderPage(ctx) {
  const { title, subtitle, bodyHtml = "", rootPrefix = "../" } = ctx;

  const subtitleBlock = subtitle
    ? `<p class="subtitle">${esc(subtitle)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} - Understanding America</title>
  <link rel="stylesheet" href="${rootPrefix}css/styles.css"><link rel="stylesheet" href="${rootPrefix}css/print.css">
</head>
<body><div class="progress"></div><header class="app-header"><div class="header-inner"><a class="brand" href="${rootPrefix}index.html"><span class="brand-mark">★</span>Understanding America</a><div class="controls"><button class="mobile-menu secondary" onclick="toggleMenu()">Menu</button><button class="secondary" onclick="openReaderPanel()">Reader</button><a class="control-link" href="${rootPrefix}government-explorer.html">Explorer</a><a class="control-link" href="${rootPrefix}timeline.html">Timeline</a><a class="control-link" href="${rootPrefix}quiz.html">Practice Test</a><button onclick="printBook()">Print</button></div></div></header>
<div class="layout"><aside class="sidebar"><h3>Contents</h3><input id="search" class="search" aria-label="Search" placeholder="Search chapters, topics, or terms"><div class="search-results" id="searchResults"></div><div class="sidebar-scroll"><ul class="nav-list"></ul></div></aside><main><article class="chapter-card">
<div class="chapter-hero"><h1>${esc(title)}</h1>${subtitleBlock}</div>
${bodyHtml}
<nav class="chapter-nav"><a class="button secondary" href="${rootPrefix}index.html">Table of Contents</a></nav>
</article></main></div><script src="${rootPrefix}js/navigation.js"></script></body></html>`;
}
