"use strict";

const el = (id) => document.getElementById(id);

const state = {
  screen: "start",
  sentence: "",
  typed: "",
  prevSentence: null,
  startTime: null,
  timerId: null,
  remaining: 60,
  correctChars: 0, // correct chars across completed + current sentence
  totalKeys: 0,    // every printable keystroke (not backspace)
  correctKeys: 0,  // printable keystrokes that matched the expected char
};

const SPRINT_SECONDS = 60;

function showScreen(name) {
  state.screen = name;
  el("screen-start").hidden = name !== "start";
  el("screen-game").hidden = name !== "game";
  el("screen-results").hidden = name !== "results";
}

function pickSentence() {
  if (SENTENCES.length === 1) return SENTENCES[0];
  let next;
  do {
    next = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
  } while (next === state.prevSentence);
  return next;
}

function renderSentence() {
  const container = el("sentence");
  container.innerHTML = "";
  const sentence = state.sentence;
  const typed = state.typed;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < sentence.length; i++) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = sentence[i];
    if (i < typed.length) {
      span.classList.add(typed[i] === sentence[i] ? "correct" : "wrong");
    } else if (i === typed.length) {
      span.classList.add("current");
    }
    frag.appendChild(span);
  }
  container.appendChild(frag);
}

function loadNextSentence() {
  state.sentence = pickSentence();
  state.prevSentence = state.sentence;
  state.typed = "";
  renderSentence();
}

function startGame() {
  state.typed = "";
  state.prevSentence = null;
  state.startTime = null;
  state.remaining = SPRINT_SECONDS;
  state.correctChars = 0;
  completedCorrectChars = 0;
  state.totalKeys = 0;
  state.correctKeys = 0;
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  el("timer").textContent = String(SPRINT_SECONDS);
  el("live-wpm").textContent = "0";
  el("live-acc").textContent = "100";
  showScreen("game");
  loadNextSentence();
  el("hidden-input").value = "";
  el("hidden-input").focus();
}

// Wire up the Start button.
el("start-btn").addEventListener("click", startGame);

// Keep focus on the hidden input while playing (clicking anywhere on game screen).
el("screen-game").addEventListener("click", () => {
  if (state.screen === "game") el("hidden-input").focus();
});

function onFirstKeystroke() {
  state.startTime = Date.now();
  state.timerId = setInterval(tick, 250);
}

function tick() {
  const elapsed = (Date.now() - state.startTime) / 1000;
  state.remaining = Math.max(0, SPRINT_SECONDS - elapsed);
  el("timer").textContent = String(Math.ceil(state.remaining));
  updateLiveStats();
  if (state.remaining <= 0) endGame();
}

// Count a single newly-typed character against the keystroke tallies.
function tallyKeystroke(typedChar, expectedChar) {
  state.totalKeys += 1;
  if (typedChar === expectedChar) state.correctKeys += 1;
}

// Recompute correctChars: count of currently-correct chars in finished work.
// correctChars accumulates per completed sentence (Task 4) plus the correct
// prefix of the current in-progress sentence.
let completedCorrectChars = 0; // correct chars banked from finished sentences

function currentCorrectPrefix() {
  let n = 0;
  for (let i = 0; i < state.typed.length && i < state.sentence.length; i++) {
    if (state.typed[i] === state.sentence[i]) n += 1;
    else break;
  }
  return n;
}

function handleInput(value) {
  if (state.screen !== "game") return;

  const hadInput = state.startTime !== null;
  // Detect growth (new chars typed) vs shrink (backspace).
  const prev = state.typed;
  // Clamp to sentence length so trailing extra characters are ignored.
  const next = value.slice(0, state.sentence.length);

  // Tally only newly-added characters (growth beyond the previous length).
  if (next.length > prev.length) {
    for (let i = prev.length; i < next.length; i++) {
      tallyKeystroke(next[i], state.sentence[i]);
    }
  }

  state.typed = next;
  renderSentence();

  // Start timer on the very first keystroke.
  if (!hadInput && state.typed.length > 0) {
    onFirstKeystroke();
  }

  // Update running correctChars (banked + current correct prefix).
  state.correctChars = completedCorrectChars + currentCorrectPrefix();

  // Advance when the sentence is exactly and fully typed.
  if (state.typed === state.sentence) {
    completedCorrectChars += state.sentence.length;
    state.correctChars = completedCorrectChars;
    loadNextSentence();
    el("hidden-input").value = "";
  }

  updateLiveStats();
}

function elapsedMinutes() {
  if (!state.startTime) return 0;
  const sec = Math.min(SPRINT_SECONDS, (Date.now() - state.startTime) / 1000);
  return sec / 60;
}

function computeWpm() {
  const mins = elapsedMinutes();
  if (mins <= 0 || state.correctChars <= 0) return 0;
  return Math.round((state.correctChars / 5) / mins);
}

function computeAccuracy() {
  if (state.totalKeys === 0) return 0;
  return Math.round((state.correctKeys / state.totalKeys) * 100);
}

function updateLiveStats() {
  el("live-wpm").textContent = String(computeWpm());
  el("live-acc").textContent = String(state.totalKeys === 0 ? 100 : computeAccuracy());
}

el("hidden-input").addEventListener("input", (e) => handleInput(e.target.value));

const BEST_KEY = "cozytype.best";

function loadBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.wpm !== "number") return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function saveBest(record) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(record));
  } catch (e) {
    /* storage unavailable — play continues without persistence */
  }
}

function formatBest() {
  const best = loadBest();
  if (!best) return "—";
  return `${best.wpm} WPM · ${best.accuracy}% acc`;
}

function refreshBestDisplay() {
  el("best-display").textContent = formatBest();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function finishResults(wpm, acc, chars) {
  el("final-wpm").textContent = String(wpm);
  el("final-acc").textContent = String(acc);
  el("final-chars").textContent = String(chars);

  const best = loadBest();
  const isNewBest = !best || wpm > best.wpm;
  if (isNewBest && wpm > 0) {
    saveBest({ wpm, accuracy: acc, date: todayISO() });
    el("newbest").hidden = false;
    el("newbest").classList.remove("shimmer"); // restart animation
    void el("newbest").offsetWidth;             // force reflow
    el("newbest").classList.add("shimmer");
  } else {
    el("newbest").hidden = true;
  }
  refreshBestDisplay();
}

function endGame() {
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  el("hidden-input").blur();
  const wpm = computeWpm();
  const acc = computeAccuracy();
  const chars = state.correctChars;
  showScreen("results");
  finishResults(wpm, acc, chars);
}

// Wire results buttons.
el("again-btn").addEventListener("click", startGame);
el("menu-btn").addEventListener("click", () => {
  refreshBestDisplay();
  showScreen("start");
});

refreshBestDisplay();
console.log("Cozy Typing ready.");
