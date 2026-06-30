// Chapter page template for Understanding America.
// Reproduces the established chapter design and layers in the Milestone 6
// sections (Official References, Related). Pure function: data in, HTML out.

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const li = (items = []) => items.map((t) => `<li>${esc(t)}</li>`).join("");

// ---- Milestone 6 optional sections -----------------------------------------

function referencesSection(refs = []) {
  if (!refs.length) return "";
  const rows = refs
    .map(
      (r) =>
        `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(
          r.label
        )}</a></li>`
    )
    .join("");
  return `\n<section class="references"><h2>Official References</h2><ul>${rows}</ul></section>`;
}

function furtherReadingSection(items = []) {
  if (!items.length) return "";
  const rows = items
    .map((r) =>
      r.url
        ? `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(
            r.label
          )}</a></li>`
        : `<li>${esc(r.label || r)}</li>`
    )
    .join("");
  return `\n<section class="further-reading"><h2>Further Reading</h2><ul>${rows}</ul></section>`;
}

// Related chapters / glossary / quiz / timeline — the cross-linking workstream.
function relatedSection(ctx) {
  const blocks = [];

  const relChapters = (ctx.related_chapters || [])
    .map((c) => {
      const target = ctx.byOutput?.[c];
      const label = target ? target.title : c;
      return `<li><a href="${esc(c)}">${esc(label)}</a></li>`;
    })
    .join("");
  if (relChapters)
    blocks.push(`<div class="related-group"><h3>Related Chapters</h3><ul>${relChapters}</ul></div>`);

  const relGlossary = (ctx.related_glossary || [])
    .map(
      (t) =>
        `<li><a href="${ctx.rootPrefix}glossary.html#${esc(
          slugify(t)
        )}">${esc(t)}</a></li>`
    )
    .join("");
  if (relGlossary)
    blocks.push(`<div class="related-group"><h3>Related Glossary Terms</h3><ul>${relGlossary}</ul></div>`);

  const links = [];
  if (ctx.related_quiz)
    links.push(
      `<a href="${ctx.rootPrefix}${esc(ctx.related_quiz)}">Related Quiz</a>`
    );
  if (ctx.related_timeline)
    links.push(
      `<a href="${ctx.rootPrefix}${esc(ctx.related_timeline)}">Related Timeline Events</a>`
    );
  if (links.length)
    blocks.push(`<div class="related-group"><h3>Explore More</h3><p>${links.join(" · ")}</p></div>`);

  if (!blocks.length) return "";
  return `\n<section class="related"><h2>Related</h2>${blocks.join("")}</section>`;
}

function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---- Page assembly ----------------------------------------------------------

export function renderChapter(ctx) {
  const {
    number,
    title,
    subtitle,
    quote = "Understanding is stronger than memorization. This chapter connects facts to meaning and real civic life.",
    diagram,
    objectives = [],
    hero,
    figures = [],
    bodyHtml = "",
    callout,
    visualPack,
    summary = [],
    terms = [],
    review = [],
    quiz = [],
    prev,
    next,
    rootPrefix, // "../" for /chapters pages
  } = ctx;

  const hasQuiz = Array.isArray(quiz) && quiz.length > 0;
  const quizLinks =
    (hasQuiz ? `<a class="control-link" href="#chapter-quiz">Chapter Quiz</a>` : "") +
    `<a class="control-link" href="${rootPrefix}quiz.html">Practice Test</a>`;

  const quizBlock = hasQuiz
    ? `\n<section class="chapter-quiz" id="chapter-quiz"><h2>Chapter Quiz</h2>
<p class="quiz-intro">Answer the questions below to test yourself on this chapter.</p>
<ol class="quiz-list">${quiz
        .map((item) => {
          const opts = (item.options || [])
            .map(
              (o, i) =>
                `<li><button type="button" class="quiz-opt" data-i="${i}">${esc(
                  o
                )}</button></li>`
            )
            .join("");
          const exp = item.explanation
            ? `<p class="quiz-explain" hidden>${esc(item.explanation)}</p>`
            : "";
          return `<li class="quiz-q" data-answer="${Number(item.answer) || 0}"><p class="quiz-prompt">${esc(
            item.q
          )}</p><ul class="quiz-opts">${opts}</ul><p class="quiz-feedback" hidden></p>${exp}</li>`;
        })
        .join("\n")}</ol>
<p class="quiz-score" data-total="${quiz.length}" aria-live="polite"></p></section>`
    : "";

  const diagramBlock = diagram
    ? `\n<div class="diagram"><img src="${rootPrefix}${esc(
        diagram.src
      )}" alt="${esc(diagram.alt)}"></div>`
    : "";

  const heroBlock = hero
    ? `\n<div class="chapter-hero-image"><img src="${rootPrefix}${esc(
        hero.src
      )}" alt="${esc(hero.alt)}" loading="lazy"></div>`
    : "";

  const figuresBlock = figures.length
    ? "\n" +
      figures
        .map(
          (f, i) =>
            `<figure class="figure"><img src="${rootPrefix}${esc(
              f.src
            )}" alt="${esc(f.alt)}" loading="lazy"><figcaption>Figure ${number}.${
              i + 1
            } — ${esc(f.caption)}</figcaption></figure>`
        )
        .join("\n")
    : "";

  const objectivesBlock = objectives.length
    ? `\n<section class="objectives"><h2>Learning Objectives</h2><ul>${li(
        objectives
      )}</ul></section>`
    : "";

  const calloutBlock = callout
    ? `\n<div class="callout gold"><strong>Remember This</strong>${esc(
        callout
      )}</div>`
    : "";

  const visualPackBlock = visualPack
    ? `\n<div class="m3-chapter-pack"><strong>Milestone 3 Visual Pack:</strong> This chapter is now tagged for publication artwork, editorial review, glossary linking, and future citation verification. The final edition should replace any remaining placeholder diagram with a chapter-specific SVG, map, or timeline.</div>\n<div class="m3-visual"><img src="${rootPrefix}${esc(
        visualPack
      )}" alt="Milestone 3 visual reference for this chapter"></div>`
    : "";

  const summaryBlock = summary.length
    ? `\n<section class="summary"><h2>Chapter Summary</h2><ul>${li(
        summary
      )}</ul></section>`
    : "";

  const termsBlock = terms.length
    ? `\n<section class="terms"><h2>Key Terms</h2><p>${terms
        .map(esc)
        .join(" · ")}</p></section>`
    : "";

  const reviewBlock = review.length
    ? `\n<section class="review"><h2>Review Questions</h2><ol>${li(
        review
      )}</ol></section>`
    : "";

  const prevHref = prev ? prev.output : `${rootPrefix}index.html`;
  const nextHref = next ? next.output : `${rootPrefix}index.html`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} - Understanding America</title>
  <link rel="stylesheet" href="${rootPrefix}css/styles.css"><link rel="stylesheet" href="${rootPrefix}css/print.css">
</head>
<body><div class="progress"></div><header class="app-header"><div class="header-inner"><a class="brand" href="${rootPrefix}index.html"><span class="brand-mark">★</span>Understanding America</a><div class="controls"><button class="mobile-menu secondary" onclick="toggleMenu()">Menu</button><button class="secondary" onclick="openReaderPanel()">Reader</button><a class="control-link" href="${rootPrefix}government-explorer.html">Explorer</a><a class="control-link" href="${rootPrefix}timeline.html">Timeline</a>${quizLinks}<button onclick="printBook()">Print</button></div></div></header>
<div class="layout"><aside class="sidebar"><h3>Contents</h3><input id="search" class="search" aria-label="Search" placeholder="Search chapters, topics, or terms"><div class="search-results" id="searchResults"></div><div class="sidebar-scroll"><ul class="nav-list"></ul></div></aside><main><article class="chapter-card manuscript-integrated">
<div class="chapter-hero"><div class="chapter-number">Chapter ${number}</div><h1>${esc(
    title
  )}</h1><p class="subtitle">${esc(subtitle)}</p><div class="quote">${esc(
    quote
  )}</div></div>${heroBlock}${objectivesBlock}${diagramBlock}
${bodyHtml}${figuresBlock}${calloutBlock}
${visualPackBlock}${summaryBlock}${termsBlock}${reviewBlock}${referencesSection(
    ctx.references
  )}${furtherReadingSection(ctx.further_reading)}${quizBlock}${relatedSection(ctx)}
<nav class="chapter-nav"><a class="button secondary" href="${esc(
    prevHref
  )}">Previous</a><a class="button secondary" href="${rootPrefix}index.html">Table of Contents</a><a class="button" href="${esc(
    nextHref
  )}">Next</a></nav>
</article></main></div><script src="${rootPrefix}js/navigation.js"></script></body></html>`;
}
