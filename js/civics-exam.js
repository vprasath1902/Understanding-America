// Civics practice test engine. Reads window.CIVICS_BANK (questions with
// resolved chapter links), draws CIVICS_ASK at random, runs them one at a time
// with instant feedback, then scores and suggests chapters to review.
(function () {
  var BANK = window.CIVICS_BANK || [];
  var ASK = window.CIVICS_ASK || 20;
  var PASS = window.CIVICS_PASS || 12;

  var startEl = document.getElementById("examStart");
  var quizEl = document.getElementById("examQuiz");
  var resultsEl = document.getElementById("examResults");
  if (!startEl || !quizEl || !resultsEl) return;

  var progressEl = document.getElementById("examProgress");
  var questionEl = document.getElementById("examQuestion");
  var optsEl = document.getElementById("examOpts");
  var feedbackEl = document.getElementById("examFeedback");
  var nextBtn = document.getElementById("examNext");
  var ddToggle = document.getElementById("examChaptersToggle");
  var ddPanel = document.getElementById("examChaptersPanel");
  var availEl = document.getElementById("examAvail");
  var startBtn = document.getElementById("examStartBtn");

  // Passing pace kept proportional to the official standard (12 of 20 = 60%),
  // so a focused 5-question drill still reports a sensible pass mark.
  var PASS_RATIO = ASK ? PASS / ASK : 0.6;

  var quiz = [];   // the selected questions, with shuffled options
  var idx = 0;
  var picks = [];  // user's chosen option index per question

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---- Chapter filter -------------------------------------------------------

  // Unique chapters present in the bank, with question counts, ordered by number.
  function chapterList() {
    var map = {};
    BANK.forEach(function (q) {
      if (!map[q.chN]) map[q.chN] = { n: q.chN, title: q.chTitle, count: 0 };
      map[q.chN].count++;
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.n - b.n; });
  }

  // All chapter checkboxes except the "all" row.
  function chapterBoxes() {
    if (!ddPanel) return [];
    var boxes = ddPanel.querySelectorAll('input[type="checkbox"]');
    return Array.prototype.filter.call(boxes, function (b) { return b.value !== "all"; });
  }

  function allBox() {
    return ddPanel ? ddPanel.querySelector('input[value="all"]') : null;
  }

  // The chapter numbers the user checked, or null for "all chapters".
  function selectedChapters() {
    var vals = chapterBoxes().filter(function (b) { return b.checked; })
      .map(function (b) { return Number(b.value); });
    return vals.length ? vals : null;
  }

  // The chapter titles the user checked (for the toggle summary).
  function selectedTitles() {
    return chapterBoxes().filter(function (b) { return b.checked; })
      .map(function (b) { return b.getAttribute("data-title"); });
  }

  // The questions eligible for the next test, honoring the chapter filter.
  function pool() {
    var chs = selectedChapters();
    if (!chs) return BANK;
    return BANK.filter(function (q) { return chs.indexOf(q.chN) >= 0; });
  }

  function populateChapters() {
    if (!ddPanel) return;
    var rows = ['<label class="exam-dd-opt all"><input type="checkbox" value="all" checked> Random — All Chapters</label>'];
    chapterList().forEach(function (c) {
      var label = "Ch " + c.n + " — " + c.title;
      rows.push('<label class="exam-dd-opt"><input type="checkbox" value="' + c.n +
        '" data-title="' + escapeHtml(c.title) + '"> ' + escapeHtml(label) +
        " (" + c.count + " question" + (c.count === 1 ? "" : "s") + ")</label>");
    });
    ddPanel.innerHTML = rows.join("");
  }

  // Keep "All Chapters" and specific chapters mutually exclusive. `changed` is
  // the checkbox the user just toggled (so we know which side to defer to).
  function normalizeSelection(changed) {
    var all = allBox();
    if (!all) return;
    if (changed && changed.value === "all") {
      // Toggling "all" on clears specifics; it can't be turned off directly.
      all.checked = true;
      chapterBoxes().forEach(function (b) { b.checked = false; });
    } else {
      var any = chapterBoxes().some(function (b) { return b.checked; });
      all.checked = !any;
    }
  }

  function updateSummary() {
    if (!ddToggle) return;
    var titles = selectedTitles();
    if (!titles.length) ddToggle.textContent = "Random — All Chapters";
    else if (titles.length === 1) ddToggle.textContent = titles[0];
    else ddToggle.textContent = titles.length + " chapters selected";
  }

  function updateAvail() {
    if (!startBtn) return;
    var p = pool();
    var ask = Math.min(ASK, p.length);
    var chs = selectedChapters();
    if (!chs) {
      if (availEl) availEl.textContent = "";
      startBtn.textContent = "Start the " + ask + "-question test";
    } else {
      if (availEl) {
        availEl.textContent = p.length + " question" + (p.length === 1 ? "" : "s") +
          " available in your selection — this test will ask " + ask + ".";
      }
      startBtn.textContent = ask > 0 ? "Start " + ask + "-question test" : "No questions available";
    }
    startBtn.disabled = p.length === 0;
  }

  function buildQuiz() {
    var src = pool();
    var ask = Math.min(ASK, src.length);
    var chosen = shuffle(src).slice(0, ask);
    quiz = chosen.map(function (item) {
      // shuffle options, track where the correct answer moved
      var order = shuffle(item.o.map(function (_, i) { return i; }));
      return {
        q: item.q,
        options: order.map(function (i) { return item.o[i]; }),
        answer: order.indexOf(item.a),
        chTitle: item.chTitle,
        chHref: item.chHref,
        chN: item.chN,
      };
    });
    picks = new Array(quiz.length).fill(-1);
    idx = 0;
  }

  function renderQuestion() {
    var item = quiz[idx];
    progressEl.textContent = "Question " + (idx + 1) + " of " + quiz.length;
    questionEl.textContent = item.q;
    feedbackEl.textContent = "";
    nextBtn.hidden = true;
    nextBtn.textContent = idx === quiz.length - 1 ? "See results" : "Next";
    optsEl.innerHTML = "";
    item.options.forEach(function (opt, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "exam-opt";
      b.textContent = opt;
      b.addEventListener("click", function () { choose(i, b); });
      li.appendChild(b);
      optsEl.appendChild(li);
    });
  }

  function choose(i, btn) {
    if (picks[idx] !== -1) return; // already answered
    picks[idx] = i;
    var item = quiz[idx];
    var buttons = optsEl.querySelectorAll(".exam-opt");
    buttons.forEach(function (b, bi) {
      b.disabled = true;
      if (bi === item.answer) b.classList.add("correct");
    });
    if (i === item.answer) {
      feedbackEl.textContent = "Correct.";
      feedbackEl.style.color = "#2e8b57";
    } else {
      btn.classList.add("wrong");
      feedbackEl.textContent = "Not quite — the highlighted answer is correct.";
      feedbackEl.style.color = "#b22234";
    }
    nextBtn.hidden = false;
  }

  function next() {
    if (idx < quiz.length - 1) {
      idx++;
      renderQuestion();
      window.scrollTo({ top: quizEl.offsetTop - 20, behavior: "smooth" });
    } else {
      showResults();
    }
  }

  function showResults() {
    quizEl.hidden = true;
    var correct = 0;
    var missedByChapter = {};
    quiz.forEach(function (item, i) {
      if (picks[i] === item.answer) {
        correct++;
      } else {
        var key = item.chHref;
        if (!missedByChapter[key]) missedByChapter[key] = { title: item.chTitle, n: item.chN, count: 0 };
        missedByChapter[key].count++;
      }
    });
    var passMark = Math.max(1, Math.round(PASS_RATIO * quiz.length));
    var passed = correct >= passMark;
    var pct = Math.round((100 * correct) / quiz.length);

    var html = '<div class="exam-score">You scored ' + correct + " / " + quiz.length +
      " (" + pct + "%)</div>";
    html += '<div class="exam-verdict ' + (passed ? "pass" : "fail") + '">' +
      (passed ? "✓ Passing pace — the real test needs " + PASS + " of " + ASK + " (60%)." :
                "Below a passing pace (" + passMark + "+ of " + quiz.length +
                " needed). Keep studying — you've got this.") + "</div>";

    // chapter suggestions
    var keys = Object.keys(missedByChapter);
    if (keys.length) {
      keys.sort(function (a, b) { return missedByChapter[a].n - missedByChapter[b].n; });
      html += '<div class="suggest"><strong>Review these chapters:</strong><ul>';
      keys.forEach(function (k) {
        var m = missedByChapter[k];
        html += '<li><a href="' + k + '">Chapter ' + m.n + ": " + m.title + "</a> — " +
          m.count + (m.count === 1 ? " question" : " questions") + " missed</li>";
      });
      html += "</ul></div>";
    } else {
      html += '<div class="suggest"><strong>Perfect score!</strong> You answered every question correctly.</div>';
    }

    // full review
    html += "<h2>Review all questions</h2><ol class=\"exam-review\">";
    quiz.forEach(function (item, i) {
      var right = picks[i] === item.answer;
      var yours = picks[i] >= 0 ? item.options[picks[i]] : "(no answer)";
      html += "<li><span class=\"mark " + (right ? "ok" : "no") + "\">" + (right ? "✓" : "✗") +
        "</span>" + escapeHtml(item.q) +
        '<span class="ans">Correct answer: ' + escapeHtml(item.options[item.answer]) + "</span>";
      if (!right) html += '<span class="ans">Your answer: ' + escapeHtml(yours) + "</span>";
      html += '<span class="ans">Read more: <a href="' + item.chHref + '">Ch ' + item.chN + " — " + escapeHtml(item.chTitle) + "</a></span></li>";
    });
    html += "</ol>";
    html += '<div class="exam-actions"><button id="examRestart">Take a new test</button></div>';

    resultsEl.innerHTML = html;
    resultsEl.hidden = false;
    document.getElementById("examRestart").addEventListener("click", restart);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function start() {
    startEl.hidden = true;
    resultsEl.hidden = true;
    buildQuiz();
    quizEl.hidden = false;
    renderQuestion();
  }

  function restart() {
    resultsEl.hidden = true;
    start();
  }

  document.getElementById("examStartBtn").addEventListener("click", start);
  nextBtn.addEventListener("click", next);

  if (ddToggle && ddPanel) {
    populateChapters();

    function openPanel() { ddPanel.hidden = false; ddToggle.setAttribute("aria-expanded", "true"); }
    function closePanel() { ddPanel.hidden = true; ddToggle.setAttribute("aria-expanded", "false"); }

    ddToggle.addEventListener("click", function () {
      if (ddPanel.hidden) openPanel(); else closePanel();
    });
    ddPanel.addEventListener("change", function (e) {
      if (e.target && e.target.type === "checkbox") {
        normalizeSelection(e.target);
        updateSummary();
        updateAvail();
      }
    });
    // Close when clicking outside the dropdown or pressing Escape.
    document.addEventListener("click", function (e) {
      if (!ddPanel.hidden && !document.getElementById("examDropdown").contains(e.target)) closePanel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !ddPanel.hidden) { closePanel(); ddToggle.focus(); }
    });

    updateSummary();
    updateAvail();
  }
})();
