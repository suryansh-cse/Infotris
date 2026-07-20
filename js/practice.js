/**
 * Infotris practice panels and quizzes.
 * Learning state is stored in the signed-in user's Firestore document.
 */
(function () {
  let firebase;
  let userDocument;
  let learningStatePromise;
  const pendingPanelStates = new Map();
  let saveTimer;

  function lessonKey(panel) {
    const page = window.location.pathname.replace(/\.html$/, "").split("/").pop();
    return `${page}-${panel.dataset.practiceId || panel.dataset.quizId || "default"}`;
  }

  async function getFirebase() {
    if (firebase) return firebase;

    const [{ auth, db }, authApi, firestoreApi] = await Promise.all([
      import("./firebase.js"),
      import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js")
    ]);
    const user = await new Promise(resolve => authApi.onAuthStateChanged(auth, resolve));
    firebase = { db, ...firestoreApi };
    userDocument = user ? firestoreApi.doc(db, "users", user.uid) : null;
    return firebase;
  }

  async function getLearningState() {
    if (!learningStatePromise) {
      learningStatePromise = (async () => {
        const api = await getFirebase();
        if (!userDocument) return { practice: {}, quizzes: {} };
        const snapshot = await api.getDoc(userDocument);
        const learning = snapshot.data()?.learning || {};
        return { practice: learning.practice || {}, quizzes: learning.quizzes || {} };
      })().catch(error => {
        console.warn("Learning progress is unavailable.", error);
        return { practice: {}, quizzes: {} };
      });
    }
    return learningStatePromise;
  }

  function queuePanelSave(key, state, completed) {
    if (!userDocument) return;
    pendingPanelStates.set(key, { state, completed });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const entries = [...pendingPanelStates.entries()];
      pendingPanelStates.clear();
      const api = await getFirebase();
      const practice = Object.fromEntries(entries.map(([itemKey, value]) => [itemKey, value.state]));
      const completedItems = entries.filter(([, value]) => value.completed).map(([itemKey]) => itemKey);

      try {
        const update = { learning: { practice } };
        if (completedItems.length) {
          update.learning.progress = { completedItems: api.arrayUnion(...completedItems) };
        }
        await api.setDoc(userDocument, update, { merge: true });
      } catch (error) {
        console.warn("Practice progress could not be saved.", error);
      }
    }, 400);
  }

  function queueQuizCompletion(key) {
    if (!userDocument) return;
    getFirebase().then(api => api.setDoc(userDocument, {
      learning: {
        quizzes: { [key]: { complete: true } },
        progress: { completedItems: api.arrayUnion(key) }
      }
    }, { merge: true })).catch(error => console.warn("Quiz progress could not be saved.", error));
  }

  function normalizeOutput(text) {
    return text.trim().replace(/\r\n/g, "\n").replace(/\s+/g, " ").toLowerCase();
  }

  async function initPanel(panel) {
    const checks = panel.querySelectorAll(".practice-check input[type='checkbox']");
    const progressBar = panel.querySelector(".practice-progress__bar");
    const progressLabel = panel.querySelector(".practice-progress__label");
    const progressEl = panel.querySelector(".practice-progress");
    const successEl = panel.querySelector(".practice-success");
    const codeArea = panel.querySelector(".practice-code");
    const verifyBtn = panel.querySelector("[data-output-verify]");
    const outputInput = panel.querySelector(".practice-output-input");
    const outputFeedback = panel.querySelector(".practice-output-feedback");
    const key = lessonKey(panel);

    if (!checks.length) return;
    const saved = (await getLearningState()).practice[key];
    if (saved) {
      checks.forEach((input, index) => { input.checked = Boolean(saved.checks?.[index]); });
      if (codeArea && saved.code) codeArea.value = saved.code;
    }

    function updateProgress(shouldSave = true) {
      const done = [...checks].filter(input => input.checked).length;
      const percentage = Math.round((done / checks.length) * 100);
      const complete = done === checks.length;

      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (progressLabel) progressLabel.textContent = `${percentage}% complete`;
      if (progressEl) progressEl.setAttribute("aria-valuenow", String(percentage));
      if (successEl) successEl.hidden = !complete;

      if (shouldSave) {
        queuePanelSave(key, { checks: [...checks].map(input => input.checked), code: codeArea?.value || "" }, complete);
      }
    }

    checks.forEach(input => input.addEventListener("change", updateProgress));
    if (codeArea) codeArea.addEventListener("input", updateProgress);

    if (verifyBtn && outputInput && outputFeedback) {
      verifyBtn.addEventListener("click", () => {
        const userOutput = normalizeOutput(outputInput.value);
        const expected = normalizeOutput(panel.dataset.expectedOutput || "");
        const matched = userOutput && (!expected || userOutput === expected || userOutput.includes(expected) || expected.split(" ").every(word => word.length < 3 || userOutput.includes(word)));

        outputFeedback.hidden = false;
        outputFeedback.className = `practice-feedback ${matched ? "practice-feedback--ok" : "practice-feedback--warn"}`;
        outputFeedback.textContent = matched ? "Nice — your output matches what we expected." : "Not quite yet. Compare your output with the expected example and try again.";
        if (matched) {
          const outputCheck = panel.querySelector("[data-check='output']");
          if (outputCheck) {
            outputCheck.checked = true;
            updateProgress();
          }
        }
      });
    }

    updateProgress(false);
  }

  async function initQuiz(quizEl) {
    const questions = quizEl.querySelectorAll(".quiz-question");
    const submitBtn = quizEl.querySelector(".quiz-btn-submit");
    const key = lessonKey(quizEl);
    let complete = Boolean((await getLearningState()).quizzes[key]?.complete);

    questions.forEach(question => {
      const options = question.querySelectorAll(".quiz-option");
      const feedback = question.querySelector(".quiz-feedback");
      options.forEach(option => {
        const radio = option.querySelector("input[type='radio']");
        if (!radio) return;
        if (complete && radio.dataset.correct === "true") {
          radio.checked = true;
          option.classList.add("is-correct");
          if (feedback) {
            feedback.style.display = "block";
            feedback.className = "quiz-feedback quiz-feedback--correct is-visible";
            feedback.textContent = radio.dataset.explanation || "Correct!";
          }
        }
        radio.addEventListener("change", () => {
          if (!complete) {
            options.forEach(item => item.classList.remove("is-selected"));
            option.classList.add("is-selected");
          }
        });
      });
    });

    if (complete && submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Quiz Complete";
    }

    submitBtn?.addEventListener("click", () => {
      let answered = true;
      let correct = true;
      questions.forEach(question => {
        const selected = question.querySelector("input[type='radio']:checked");
        const feedback = question.querySelector(".quiz-feedback");
        const options = question.querySelectorAll(".quiz-option");
        if (!selected) {
          answered = false;
          return;
        }
        const isCorrect = selected.dataset.correct === "true";
        correct &&= isCorrect;
        options.forEach(option => {
          const radio = option.querySelector("input[type='radio']");
          option.classList.remove("is-selected", "is-correct", "is-incorrect");
          option.classList.add(radio.dataset.correct === "true" ? "is-correct" : radio.checked ? "is-incorrect" : "");
        });
        if (feedback) {
          feedback.style.display = "block";
          feedback.className = `quiz-feedback ${isCorrect ? "quiz-feedback--correct" : "quiz-feedback--incorrect"} is-visible`;
          feedback.textContent = selected.dataset.explanation || (isCorrect ? "Correct!" : "Incorrect. Try again!");
        }
      });

      if (!answered) return alert("Please answer all questions before submitting the quiz.");
      if (correct) {
        complete = true;
        queueQuizCompletion(key);
        submitBtn.disabled = true;
        submitBtn.textContent = "Quiz Complete";
        const quizCheck = document.querySelector(".practice-check input[data-check='quiz']");
        if (quizCheck) {
          quizCheck.checked = true;
          quizCheck.dispatchEvent(new Event("change"));
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".practice-panel").forEach(initPanel);
    document.querySelectorAll(".quiz-panel").forEach(initQuiz);
  });
})();
