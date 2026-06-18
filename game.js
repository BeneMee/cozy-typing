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

// Placeholder; Task 5 replaces this with the timer start.
let onFirstKeystroke = function () {};

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

// Live stats are fully implemented in Task 5; declared here so handleInput runs.
let updateLiveStats = function () {};

el("hidden-input").addEventListener("input", (e) => handleInput(e.target.value));

console.log("Cozy Typing ready.");
