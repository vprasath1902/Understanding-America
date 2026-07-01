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
  var chapterSel = document.getElementById("examChapters");
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

  // The chapter numbers the user selected, or null for "all chapters".
  function selectedChapters() {
    if (!chapterSel) return null;
    var vals = [];
    for (var i = 0; i < chapterSel.options.length; i++) {
      var o = chapterSel.options[i];
      if (o.selected && o.value !== "all") vals.push(Number(o.value));
    }
    return vals.length ? vals : null;
  }

  // The questions eligible for the next test, honoring the chapter filter.
  function pool() {
    var chs = selectedChapters();
    if (!chs) return BANK;
    return BANK.filter(function (q) { return chs.indexOf(q.chN) >= 0; });
  }

  function populateChapters() {
    if (!chapterSel) return;
    var opts = ['<option value="all" selected>Random — All Chapters</option>'];
    chapterList().forEach(function (c) {
      opts.push('<option value="' + c.n + '">Ch ' + c.n + " — " + escapeHtml(c.title) +
        " (" + c.count + " question" + (c.count === 1 ? "" : "s") + ")</option>");
    });
    chapterSel.innerHTML = opts.join("");
  }

  // Keep the "All Chapters" row and specific chapters mutually exclusive:
  // any specific pick turns "all" off; picking nothing specific turns it on.
  function normalizeSelection() {
    if (!chapterSel) return;
    var opts = chapterSel.options, anyOther = false;
    for (var i = 1; i < opts.length; i++) { if (opts[i].selected) { anyOther = true; break; } }
    if (opts.length) opts[0].selected = !anyOther;
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

  if (chapterSel) {
    populateChapters();
    chapterSel.addEventListener("change", function () {
      normalizeSelection();
      updateAvail();
    });
    updateAvail();
  }
})();
