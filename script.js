// QuizMaster - script.js
// Works with the existing index.html. Add this before </body>:
//   <script src="script.js"></script>

const API_URL = "https://wajeehatariq.pythonanywhere.com";

async function testBackend() {
    try {
        const response = await fetch(`${API_URL}/api/test`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("Backend connected:", data);
        return data;
    } catch (error) {
        console.error("Backend connection failed:", error);
    }
}

(function () {
  "use strict";

  // ---------- Quiz data ----------
  const QUESTIONS = {
    Technology: [
      { q: "Which language is used to structure a web page?", options: ["Python", "HTML", "SQL", "C++"], answer: 1, level: 1 },
      { q: "What does CSS stand for?", options: ["Creative Style System", "Cascading Style Sheets", "Computer Style Syntax", "Colorful Style Sheets"], answer: 1, level: 1 },
      { q: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Core Program Utility", "Central Program Updater"], answer: 0, level: 1 },
      { q: "Which of these is a version control system?", options: ["Photoshop", "Git", "Excel", "Chrome"], answer: 1, level: 2 },
      { q: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Process", "HyperText Transmission Program", "Host Transfer Terminal Protocol"], answer: 0, level: 2 }
    ],
    Science: [
      { q: "What is the chemical formula for water?", options: ["CO2", "O2", "H2O", "NaCl"], answer: 2, level: 1 },
      { q: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Earth", "Mars"], answer: 1, level: 1 },
      { q: "Which gas do plants absorb from the air?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 2, level: 1 },
      { q: "Which part of the cell is called its powerhouse?", options: ["Nucleus", "Ribosome", "Mitochondria", "Membrane"], answer: 2, level: 2 },
      { q: "About how fast does light travel?", options: ["300 km/s", "3,000 km/s", "300,000 km/s", "3,000,000 km/s"], answer: 2, level: 2 }
    ],
    "General Knowledge": [
      { q: "What is the capital of France?", options: ["Paris", "Rome", "Madrid", "Berlin"], answer: 0, level: 1 },
      { q: "Which is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3, level: 1 },
      { q: "How many continents are there?", options: ["5", "6", "7", "8"], answer: 2, level: 1 },
      { q: "Who painted the Mona Lisa?", options: ["Michelangelo", "Leonardo da Vinci", "Pablo Picasso", "Vincent van Gogh"], answer: 1, level: 2 },
      { q: "Which is the smallest country in the world by area?", options: ["Monaco", "San Marino", "Vatican City", "Malta"], answer: 2, level: 3 }
    ],
    Education: [
      { q: "What is 12 × 12?", options: ["124", "144", "132", "156"], answer: 1, level: 1 },
      { q: "Who wrote Romeo and Juliet?", options: ["Charles Dickens", "Mark Twain", "Jane Austen", "William Shakespeare"], answer: 3, level: 1 },
      { q: "What is the past tense of \"go\"?", options: ["Goed", "Gone", "Went", "Going"], answer: 2, level: 1 },
      { q: "Which of these is a prime number?", options: ["15", "21", "17", "27"], answer: 2, level: 2 },
      { q: "What do the angles of a triangle add up to?", options: ["90°", "180°", "270°", "360°"], answer: 1, level: 2 }
    ]
  };

  const LEVELS = { 1: "★ Easy", 2: "★★ Medium", 3: "★★★ Hard" };
  const LETTERS = ["A", "B", "C", "D"];

  // ---------- Elements ----------
  const quizBox = document.querySelector(".quiz-box");
  if (!quizBox) return; // nothing to do if the section is missing

  const note = document.querySelector("#quiz .note");
  const sectionHeading = document.querySelector("#quiz .section-heading p");
  const categoryCards = document.querySelectorAll(".category-card");

  // Small style fallback for states the stylesheet may not define yet
  const style = document.createElement("style");
  style.textContent = `
    .quiz-box .answer { cursor: pointer; }
    .quiz-box .answer.locked { cursor: default; }
    .quiz-box .answer.wrong { border-color: #ef4444 !important; background: rgba(239, 68, 68, 0.12) !important; }
    .quiz-box .answer:not(.locked):hover { transform: translateY(-1px); }
    .quiz-box .result { text-align: center; padding: 1.5rem 0; }
    .quiz-box .result .big-score { font-size: 3rem; font-weight: 800; margin: 0.5rem 0; }
    .quiz-box .result .result-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.25rem; }
    .quiz-box .result button, .quiz-box .quiz-footer button { cursor: pointer; border: none; font: inherit; }
    .quiz-box .quiz-footer button:disabled { opacity: 0.45; cursor: not-allowed; }
    .category-card.active-category { outline: 3px solid currentColor; outline-offset: 3px; }
  `;
  document.head.appendChild(style);

  // ---------- State ----------
  let category = "Technology";
  let questions = [];
  let index = 0;
  let score = 0;
  let answered = false;

  // ---------- Helpers ----------
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function highlightCategory() {
    categoryCards.forEach((card) => {
      const name = card.querySelector("h3").textContent.trim();
      card.classList.toggle("active-category", name === category);
    });
  }

  // ---------- Flow ----------
  function startQuiz(name) {
    category = name;
    questions = shuffle(QUESTIONS[category]);
    index = 0;
    score = 0;
    answered = false;

    if (note) note.style.display = "none";
    if (sectionHeading) sectionHeading.textContent = "Category: " + category + ". Pick the best answer for each question.";
    highlightCategory();
    renderQuestion();
  }

  function renderQuestion() {
    const item = questions[index];
    const total = questions.length;
    answered = false;

    quizBox.innerHTML = `
      <div class="quiz-top">
        <span class="question-label">QUESTION ${pad(index + 1)} / ${pad(total)}</span>
        <span class="difficulty">${LEVELS[item.level]}</span>
      </div>
      <div class="question-progress"><div style="width:${(index / total) * 100}%"></div></div>
      <h3>${item.q}</h3>
      <div class="answers">
        ${item.options
          .map((opt, i) => `<div class="answer" role="button" tabindex="0" data-index="${i}"><span>${LETTERS[i]}</span> ${opt}</div>`)
          .join("")}
      </div>
      <div class="quiz-footer">
        <span class="feedback">💡 Choose an answer. Score: ${score}</span>
        <button type="button" class="primary-btn next-btn" disabled>
          ${index === total - 1 ? "See Results →" : "Next Question →"}
        </button>
      </div>
    `;

    // Animate progress bar to the end of this question on next frame
    const bar = quizBox.querySelector(".question-progress div");
    if (bar) bar.style.transition = "width 0.4s ease";

    quizBox.querySelectorAll(".answer").forEach((el) => {
      el.addEventListener("click", () => selectAnswer(el));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectAnswer(el);
        }
      });
    });

    quizBox.querySelector(".next-btn").addEventListener("click", nextQuestion);
  }

  function selectAnswer(el) {
    if (answered) return;
    answered = true;

    const item = questions[index];
    const picked = Number(el.dataset.index);
    const answerEls = quizBox.querySelectorAll(".answer");

    answerEls.forEach((a) => a.classList.add("locked"));

    const correctEl = answerEls[item.answer];
    correctEl.classList.add("correct");
    if (!correctEl.querySelector("b")) correctEl.insertAdjacentHTML("beforeend", " <b>✓</b>");

    const feedback = quizBox.querySelector(".feedback");
    if (picked === item.answer) {
      score++;
      feedback.textContent = "✅ Correct! Score: " + score;
    } else {
      el.classList.add("wrong");
      el.insertAdjacentHTML("beforeend", " <b>✗</b>");
      feedback.textContent = "❌ Not quite. Score: " + score;
    }

    const nextBtn = quizBox.querySelector(".next-btn");
    nextBtn.disabled = false;
    nextBtn.focus();

    const bar = quizBox.querySelector(".question-progress div");
    if (bar) bar.style.width = ((index + 1) / questions.length) * 100 + "%";
  }

  function nextQuestion() {
    if (!answered) return;
    index++;
    if (index >= questions.length) {
      renderResult();
    } else {
      renderQuestion();
    }
  }

  function renderResult() {
    const total = questions.length;
    sendQuizResult(category, score, total);
    const pct = Math.round((score / total) * 100);
    let message = "Keep practicing, you'll get there!";
    if (pct === 100) message = "Perfect score! You're a genius! 🏆";
    else if (pct >= 80) message = "Excellent work! 🎉";
    else if (pct >= 60) message = "Good job! 👍";
    else if (pct >= 40) message = "Not bad, try again to improve.";

    quizBox.innerHTML = `
      <div class="question-progress"><div style="width:100%"></div></div>
      <div class="result">
        <span class="question-label">${category.toUpperCase()} COMPLETE</span>
        <div class="big-score">${score} / ${total}</div>
        <h3>${message}</h3>
        <p>You scored ${pct}%.</p>
        <div class="result-actions">
          <button type="button" class="primary-btn restart-btn">Play Again ↻</button>
          <a href="#categories" class="secondary-btn">Choose Another Category</a>
        </div>
      </div>
    `;
    quizBox.querySelector(".restart-btn").addEventListener("click", () => startQuiz(category));
  }

  // ---------- Category cards ----------
  categoryCards.forEach((card) => {
    const name = card.querySelector("h3").textContent.trim();
    const link = card.querySelector("a");
    if (!QUESTIONS[name] || !link) return;
    link.addEventListener("click", () => startQuiz(name)); // link still scrolls to #quiz
  });

  // ---------- Start ----------
  startQuiz(category);
})();

}
async function sendQuizResult(category, score, total) {
    const playerName = prompt("Enter your name:");

    try {
        const response = await fetch(
            "https://wajeehatariq.pythonanywhere.com/api/submit",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: playerName || "Guest",
                    category: category,
                    score: score,
                    total: total
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log("Python backend response:", data);
        } else {
            console.error("Backend error:", data);
        }
    } catch (error) {
        console.error("Could not connect to Python backend:", error);
    }
}
