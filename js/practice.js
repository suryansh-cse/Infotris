/**
 * OpenLearn practice panels — checklists, progress, optional output check.
 * Works on static HTML lesson and project pages.
 */
(function () {
  const STORAGE_PREFIX = "openlearn-practice-";

  function storageKey(panel) {
    const page = window.location.pathname.replace(/^\//, "");
    const id = panel.dataset.practiceId || "default";
    return STORAGE_PREFIX + page + "-" + id;
  }

  function loadState(panel) {
    try {
      const raw = localStorage.getItem(storageKey(panel));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveState(panel, state) {
    try {
      localStorage.setItem(storageKey(panel), JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }

  function normalizeOutput(text) {
    return text
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function initPanel(panel) {
    const checks = panel.querySelectorAll(".practice-check input[type='checkbox']");
    const progressBar = panel.querySelector(".practice-progress__bar");
    const progressLabel = panel.querySelector(".practice-progress__label");
    const progressEl = panel.querySelector(".practice-progress");
    const successEl = panel.querySelector(".practice-success");
    const codeArea = panel.querySelector(".practice-code");
    const verifyBtn = panel.querySelector("[data-output-verify]");
    const outputInput = panel.querySelector(".practice-output-input");
    const outputFeedback = panel.querySelector(".practice-output-feedback");
    const isProject = panel.dataset.practiceType === "project";

    if (!checks.length) return;

    const saved = loadState(panel);
    if (saved) {
      checks.forEach((input, i) => {
        if (saved.checks && saved.checks[i]) input.checked = true;
      });
      if (codeArea && saved.code) codeArea.value = saved.code;
    }

    function updateProgress() {
      const total = checks.length;
      const done = [...checks].filter((c) => c.checked).length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      if (progressBar) progressBar.style.width = pct + "%";
      if (progressLabel) progressLabel.textContent = pct + "% complete";
      if (progressEl) {
        progressEl.setAttribute("aria-valuenow", String(pct));
      }

      const allDone = done === total && total > 0;
      if (successEl) {
        successEl.hidden = !allDone;
      }

      saveState(panel, {
        checks: [...checks].map((c) => c.checked),
        code: codeArea ? codeArea.value : "",
      });

      return allDone;
    }

    checks.forEach((input) => {
      input.addEventListener("change", updateProgress);
    });

    if (codeArea) {
      codeArea.addEventListener("input", () => {
        saveState(panel, {
          checks: [...checks].map((c) => c.checked),
          code: codeArea.value,
        });
      });
    }

    if (verifyBtn && outputInput && outputFeedback) {
      const expected = panel.dataset.expectedOutput || "";
      verifyBtn.addEventListener("click", () => {
        const user = normalizeOutput(outputInput.value);
        const exp = normalizeOutput(expected);

        if (!user) {
          outputFeedback.hidden = false;
          outputFeedback.className = "practice-feedback practice-feedback--warn";
          outputFeedback.textContent = "Paste your terminal output first, then check again.";
          return;
        }

        if (!exp) {
          outputFeedback.hidden = false;
          outputFeedback.className = "practice-feedback practice-feedback--ok";
          outputFeedback.textContent = "Output saved. Confirm it matches the expected example above.";
          return;
        }

        const match =
          user === exp ||
          user.includes(exp) ||
          exp.split(" ").every((word) => word.length < 3 || user.includes(word));

        outputFeedback.hidden = false;
        if (match) {
          outputFeedback.className = "practice-feedback practice-feedback--ok";
          outputFeedback.textContent = isProject
            ? "Output looks right! Check off the remaining steps if you haven't yet."
            : "Nice — your output matches what we expected.";
          const outputCheck = panel.querySelector("[data-check='output']");
          if (outputCheck) {
            outputCheck.checked = true;
            updateProgress();
          }
        } else {
          outputFeedback.className = "practice-feedback practice-feedback--warn";
          outputFeedback.textContent =
            "Not quite yet. Compare line by line with the expected output, fix your code, and run again.";
        }
      });
    }

    updateProgress();
  }

  function initQuiz(quizEl) {
    const questions = quizEl.querySelectorAll(".quiz-question");
    const submitBtn = quizEl.querySelector(".quiz-btn-submit");

    const storageKey = "openlearn-quiz-" + window.location.pathname.replace(/^\//, "") + "-" + (quizEl.dataset.quizId || "default");
    let isQuizComplete = false;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "complete") {
        isQuizComplete = true;
      }
    } catch (e) {}

    questions.forEach((q) => {
      const options = q.querySelectorAll(".quiz-option");
      const feedback = q.querySelector(".quiz-feedback");

      options.forEach((opt) => {
        const radio = opt.querySelector("input[type='radio']");
        if (!radio) return;

        const isCorrectOption = radio.dataset.correct === "true";
        if (isQuizComplete && isCorrectOption) {
          radio.checked = true;
          opt.classList.add("is-correct");
          if (feedback) {
            feedback.style.display = "block";
            feedback.className = "quiz-feedback quiz-feedback--correct is-visible";
            feedback.textContent = radio.dataset.explanation || "Correct!";
          }
        }

        radio.addEventListener("change", () => {
          if (isQuizComplete) return;
          // Clear selected class from other options in this question
          options.forEach((o) => o.classList.remove("is-selected"));
          opt.classList.add("is-selected");
        });
      });
    });

    if (isQuizComplete && submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Quiz Complete";
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        let allAnswered = true;
        let allCorrect = true;

        questions.forEach((q) => {
          const selectedRadio = q.querySelector("input[type='radio']:checked");
          const feedback = q.querySelector(".quiz-feedback");
          const options = q.querySelectorAll(".quiz-option");

          if (!selectedRadio) {
            allAnswered = false;
            return;
          }

          const isCorrect = selectedRadio.dataset.correct === "true";
          options.forEach((opt) => {
            const radio = opt.querySelector("input[type='radio']");
            opt.classList.remove("is-selected", "is-correct", "is-incorrect");
            if (radio.dataset.correct === "true") {
              opt.classList.add("is-correct");
            } else if (radio.checked) {
              opt.classList.add("is-incorrect");
            }
          });

          if (feedback) {
            feedback.style.display = "block";
            if (isCorrect) {
              feedback.className = "quiz-feedback quiz-feedback--correct is-visible";
              feedback.textContent = selectedRadio.dataset.explanation || "Correct!";
            } else {
              allCorrect = false;
              feedback.className = "quiz-feedback quiz-feedback--incorrect is-visible";
              feedback.textContent = selectedRadio.dataset.explanation || "Incorrect. Try again!";
            }
          } else {
            if (!isCorrect) allCorrect = false;
          }
        });

        if (!allAnswered) {
          alert("Please answer all questions before submitting the quiz.");
          return;
        }

        if (allCorrect) {
          isQuizComplete = true;
          try {
            localStorage.setItem(storageKey, "complete");
          } catch (e) {}
          submitBtn.disabled = true;
          submitBtn.textContent = "Quiz Complete";
          
          const quizCheck = document.querySelector(".practice-check input[data-check='quiz']");
          if (quizCheck) {
            quizCheck.checked = true;
            quizCheck.dispatchEvent(new Event('change'));
          }
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".practice-panel").forEach(initPanel);
    document.querySelectorAll(".quiz-panel").forEach(initQuiz);
  });
})();
