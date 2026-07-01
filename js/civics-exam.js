// Civics practice test engine. Reads window.CIVICS_BANK (questions with
// resolved chapter links + acceptable answers), draws CIVICS_ASK at random,
// runs them one at a time with instant feedback, then scores and suggests
// chapters to review. Supports two modes: multiple choice, or free-text
// ("type your answer") judged by a tolerant fact-matcher.
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
  var textWrap = document.getElementById("examTextWrap");
  var textEl = document.getElementById("examText");
  var submitBtn = document.getElementById("examSubmit");

  // Passing pace kept proportional to the official standard (12 of 20 = 60%),
  // so a focused 5-question drill still reports a sensible pass mark.
  var PASS_RATIO = ASK ? PASS / ASK : 0.6;

  var quiz = [];      // the selected questions, with shuffled options
  var idx = 0;
  var picks = [];     // MC: chosen option index per question (-1 = unanswered)
  var given = [];     // text of the answer the user gave (both modes)
  var correctArr = []; // whether each answer was correct (both modes)
  var mode = "mc";    // "mc" or "text", chosen on the start screen

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---- Free-text answer matching -------------------------------------------

  var DROP = {
    // articles / connectors ignored in token comparison
    the: 1, a: 1, an: 1, of: 1, to: 1, and: 1, in: 1, on: 1, for: 1, by: 1, or: 1,
    // honorifics / suffixes
    mr: 1, mrs: 1, ms: 1, dr: 1, jr: 1, sr: 1, ii: 1, iii: 1, iv: 1
  };

  // Split into meaningful tokens: lowercase, strip punctuation, drop stopwords,
  // honorifics/suffixes, and lone initials (single letters).
  function tokens(s) {
    return normRaw(s).split(" ").filter(function (t) {
      if (!t) return false;
      if (DROP[t]) return false;
      if (t.length === 1 && /[a-z]/.test(t)) return false; // middle initial
      return true;
    });
  }

  function normRaw(s) {
    return String(s)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Normalized comparison string (tokens re-joined, stopwords/initials removed).
  function normStr(s) { return tokens(s).join(" "); }

  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      for (j = 0; j <= n; j++) prev[j] = cur[j];
    }
    return prev[n];
  }

  function tol(s) { return s.length <= 4 ? 1 : (s.length <= 8 ? 2 : 3); }
  function tokTol(t) { return t.length <= 4 ? 1 : 2; }

  // Is `user` an acceptable answer given the list of accepted answers?
  // Correct when: it equals an accepted answer (after normalization), or an
  // accepted answer's tokens are all present in the user's response (allowing
  // per-token typos), or the whole strings are within an edit-distance budget.
  function judge(user, accept) {
    var nu = normStr(user);
    if (!nu) return false;
    var tu = tokens(user);
    for (var k = 0; k < accept.length; k++) {
      var na = normStr(accept[k]);
      if (!na) continue;
      if (nu === na) return true;
      if (lev(nu, na) <= tol(na)) return true;
      var ta = tokens(accept[k]);
      if (ta.length && ta.every(function (t) {
        return tu.indexOf(t) >= 0 || tu.some(function (x) { return lev(x, t) <= tokTol(t); });
      })) return true;
    }
    return false;
  }

  // ---- Chapter filter -------------------------------------------------------

  function chapterList() {
    var map = {};
    BANK.forEach(function (q) {
      if (!map[q.chN]) map[q.chN] = { n: q.chN, title: q.chTitle, count: 0 };
      map[q.chN].count++;
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.n - b.n; });
  }

  function chapterBoxes() {
    if (!ddPanel) return [];
    var boxes = ddPanel.querySelectorAll('input[type="checkbox"]');
    return Array.prototype.filter.call(boxes, function (b) { return b.value !== "all"; });
  }
  function allBox() { return ddPanel ? ddPanel.querySelector('input[value="all"]') : null; }

  function selectedChapters() {
    var vals = chapterBoxes().filter(function (b) { return b.checked; })
      .map(function (b) { return Number(b.value); });
    return vals.length ? vals : null;
  }
  function selectedTitles() {
    return chapterBoxes().filter(function (b) { return b.checked; })
      .map(function (b) { return b.getAttribute("data-title"); });
  }

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

  function normalizeSelection(changed) {
    var all = allBox();
    if (!all) return;
    if (changed && changed.value === "all") {
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

  // ---- Quiz flow ------------------------------------------------------------

  function currentMode() {
    var checked = document.querySelector('input[name="examMode"]:checked');
    return checked ? checked.value : "mc";
  }

  function buildQuiz() {
    var src = pool();
    var ask = Math.min(ASK, src.length);
    var chosen = shuffle(src).slice(0, ask);
    quiz = chosen.map(function (item) {
      var order = shuffle(item.o.map(function (_, i) { return i; }));
      return {
        q: item.q,
        options: order.map(function (i) { return item.o[i]; }),
        answer: order.indexOf(item.a),
        answerText: item.o[item.a],
        accept: item.accept || [item.o[item.a]],
        chTitle: item.chTitle,
        chHref: item.chHref,
        chN: item.chN,
      };
    });
    picks = new Array(quiz.length).fill(-1);
    given = new Array(quiz.length).fill("");
    correctArr = new Array(quiz.length).fill(false);
    idx = 0;
  }

  function renderQuestion() {
    var item = quiz[idx];
    progressEl.textContent = "Question " + (idx + 1) + " of " + quiz.length;
    questionEl.textContent = item.q;
    feedbackEl.textContent = "";
    feedbackEl.style.color = "";
    nextBtn.hidden = true;
    nextBtn.textContent = idx === quiz.length - 1 ? "See results" : "Next";

    if (mode === "text") {
      optsEl.innerHTML = "";
      optsEl.hidden = true;
      textWrap.hidden = false;
      textEl.value = "";
      textEl.disabled = false;
      submitBtn.disabled = false;
      submitBtn.hidden = false;
      textEl.focus();
    } else {
      textWrap.hidden = true;
      optsEl.hidden = false;
      optsEl.innerHTML = "";
      item.options.forEach(function (opt, i) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.className = "exam-opt";
        b.textContent = opt;
        b.addEventListener("click", function () { chooseMC(i, b); });
        li.appendChild(b);
        optsEl.appendChild(li);
      });
    }
  }

  function markCorrect(isRight) {
    correctArr[idx] = isRight;
    if (isRight) {
      feedbackEl.textContent = "Correct.";
      feedbackEl.style.color = "#2e8b57";
    } else {
      feedbackEl.style.color = "#b22234";
    }
    nextBtn.hidden = false;
  }

  function chooseMC(i, btn) {
    if (picks[idx] !== -1) return;
    picks[idx] = i;
    var item = quiz[idx];
    given[idx] = item.options[i];
    var buttons = optsEl.querySelectorAll(".exam-opt");
    buttons.forEach(function (b, bi) {
      b.disabled = true;
      if (bi === item.answer) b.classList.add("correct");
    });
    var right = i === item.answer;
    if (!right) {
      btn.classList.add("wrong");
      feedbackEl.textContent = "Not quite — the highlighted answer is correct.";
    }
    markCorrect(right);
  }

  function submitText() {
    if (textEl.disabled) return;
    var val = textEl.value.trim();
    if (!val) { feedbackEl.textContent = "Type an answer first."; feedbackEl.style.color = "#b22234"; return; }
    var item = quiz[idx];
    given[idx] = val;
    textEl.disabled = true;
    submitBtn.disabled = true;
    submitBtn.hidden = true;
    var right = judge(val, item.accept);
    if (right) {
      markCorrect(true);
    } else {
      feedbackEl.textContent = "Not quite. Accepted answer: " + item.answerText;
      markCorrect(false);
    }
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
      if (correctArr[i]) {
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

    html += "<h2>Review all questions</h2><ol class=\"exam-review\">";
    quiz.forEach(function (item, i) {
      var right = correctArr[i];
      var yours = given[i] || "(no answer)";
      html += "<li><span class=\"mark " + (right ? "ok" : "no") + "\">" + (right ? "✓" : "✗") +
        "</span>" + escapeHtml(item.q) +
        '<span class="ans">Correct answer: ' + escapeHtml(item.answerText) + "</span>";
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
    mode = currentMode();
    startEl.hidden = true;
    resultsEl.hidden = true;
    buildQuiz();
    quizEl.hidden = false;
    renderQuestion();
  }

  function restart() {
    resultsEl.hidden = true;
    startEl.hidden = false; // let the user change mode/chapters between tests
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  startBtn.addEventListener("click", start);
  nextBtn.addEventListener("click", next);
  if (submitBtn) submitBtn.addEventListener("click", submitText);
  if (textEl) {
    // Enter submits; Shift+Enter makes a newline.
    textEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitText(); }
    });
  }

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
