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

  function buildQuiz() {
    var chosen = shuffle(BANK).slice(0, Math.min(ASK, BANK.length));
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
    var passed = correct >= PASS;

    var html = '<div class="exam-score">You scored ' + correct + " / " + quiz.length + "</div>";
    html += '<div class="exam-verdict ' + (passed ? "pass" : "fail") + '">' +
      (passed ? "✓ Passing score — at or above " + PASS + " correct." :
                "Below the passing mark of " + PASS + ". Keep studying — you've got this.") + "</div>";

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
})();
