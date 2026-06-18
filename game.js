"use strict";

const el = (id) => document.getElementById(id);

// Treat apostrophe variants as a plain ' so German-keyboard users can type
// don't / it's naturally: the ` and ´ keys are dead keys on QWERTZ, and the
// sentence pack also contains curly quotes. Normalize both sides before any
// character comparison so the right one still scores as correct.
const APOST_RE = /[`´‘’]/g;
const normChar = (ch) => ch.replace(APOST_RE, "'");
const normEq = (a, b) => normChar(a) === normChar(b);

const state = {
  screen: "start",
  sentence: "",
  typed: "",
  prevSentence: null,
  startTime: null,
  timerId: null,
  remaining: 60,
  duration: 60,    // seconds for the run in progress (snapshot of selectedDuration)
  correctChars: 0, // correct chars across completed + current sentence
  totalKeys: 0,    // every printable keystroke (not backspace)
  correctKeys: 0,  // printable keystrokes that matched the expected char
};

// Sprint length chosen on the start screen (30 or 60). Snapshotted into
// state.duration when a run starts so a mid-game toggle can't affect it.
let selectedDuration = 60;

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
      span.classList.add(normEq(typed[i], sentence[i]) ? "correct" : "wrong");
    } else if (i === typed.length) {
      span.classList.add("current");
    }
    frag.appendChild(span);
  }
  container.appendChild(frag);
  positionKorok();
}

// ---- Korok companion ----
// The Korok hovers over the current character and follows the caret. It hops
// on each correct key, wobbles on a miss, and cheers when a sentence is done.
function positionKorok() {
  const korok = el("korok");
  if (!korok) return;
  const cur = el("sentence").querySelector(".char.current");
  // No current char (sentence just completed) -> keep the last position; the
  // next sentence loads immediately and repositions us at its first letter.
  if (!cur) return;
  korok.style.left = cur.offsetLeft + cur.offsetWidth / 2 + "px";
  korok.style.top = cur.offsetTop + "px";
}

function korokReact(kind) {
  if (reduceMotion) return;
  const art = el("korok") && el("korok").querySelector(".korok-art");
  if (!art) return;
  art.classList.remove("hop", "wiggle", "cheer");
  void art.offsetWidth; // restart the one-shot animation
  art.classList.add(kind);
  art.addEventListener("animationend", () => art.classList.remove(kind), { once: true });
}

function korokCheer() {
  korokReact("cheer");
}

function loadNextSentence() {
  state.sentence = pickSentence();
  state.prevSentence = state.sentence;
  state.typed = "";
  renderSentence();
  const s = el("sentence");
  s.classList.remove("fade-in");
  void s.offsetWidth;        // force reflow so the animation restarts
  s.classList.add("fade-in");
}

function startGame() {
  state.typed = "";
  state.prevSentence = null;
  state.startTime = null;
  state.duration = selectedDuration;
  state.remaining = state.duration;
  state.correctChars = 0;
  completedCorrectChars = 0;
  state.totalKeys = 0;
  state.correctKeys = 0;
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  el("timer").textContent = String(state.duration);
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
  state.remaining = Math.max(0, state.duration - elapsed);
  el("timer").textContent = String(Math.ceil(state.remaining));
  updateLiveStats();
  if (state.remaining <= 0) endGame();
}

// Count a single newly-typed character against the keystroke tallies.
function tallyKeystroke(typedChar, expectedChar) {
  state.totalKeys += 1;
  if (normEq(typedChar, expectedChar)) state.correctKeys += 1;
}

// Recompute correctChars: count of currently-correct chars in finished work.
// correctChars accumulates per completed sentence (Task 4) plus the correct
// prefix of the current in-progress sentence.
let completedCorrectChars = 0; // correct chars banked from finished sentences

function currentCorrectPrefix() {
  let n = 0;
  for (let i = 0; i < state.typed.length && i < state.sentence.length; i++) {
    if (normEq(state.typed[i], state.sentence[i])) n += 1;
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
    // Korok reacts to the latest keystroke: hop on a hit, wobble on a miss.
    const last = next.length - 1;
    korokReact(normEq(next[last], state.sentence[last]) ? "hop" : "wiggle");
  }

  state.typed = next;
  renderSentence();

  // Start timer on the very first keystroke.
  if (!hadInput && state.typed.length > 0) {
    onFirstKeystroke();
  }

  // Update running correctChars (banked + current correct prefix).
  state.correctChars = completedCorrectChars + currentCorrectPrefix();

  // Advance when the sentence is fully typed (apostrophe variants count).
  if (state.typed.length === state.sentence.length &&
      normChar(state.typed) === normChar(state.sentence)) {
    completedCorrectChars += state.sentence.length;
    state.correctChars = completedCorrectChars;
    korokCheer();
    loadNextSentence();
    el("hidden-input").value = "";
  }

  updateLiveStats();
}

function elapsedMinutes() {
  if (!state.startTime) return 0;
  const sec = Math.min(state.duration, (Date.now() - state.startTime) / 1000);
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

// Best scores are stored per duration: { "30": {wpm,accuracy,date}, "60": {...} }.
function loadAllBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Migrate the old single-record shape -> treat it as the 60s best.
    if (parsed && typeof parsed.wpm === "number") {
      return { "60": parsed };
    }
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function loadBest(duration) {
  return loadAllBest()[String(duration)] || null;
}

function saveBest(duration, record) {
  try {
    const all = loadAllBest();
    all[String(duration)] = record;
    localStorage.setItem(BEST_KEY, JSON.stringify(all));
  } catch (e) {
    /* storage unavailable — play continues without persistence */
  }
}

function formatBest(duration) {
  const best = loadBest(duration);
  if (!best) return "—";
  return `${best.wpm} WPM · ${best.accuracy}% acc`;
}

function refreshBestDisplay() {
  el("best-display").textContent = formatBest(selectedDuration);
  el("best-scope").textContent = `(${selectedDuration}s)`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function finishResults(wpm, acc, chars) {
  el("final-wpm").textContent = String(wpm);
  el("final-acc").textContent = String(acc);
  el("final-chars").textContent = String(chars);

  const best = loadBest(state.duration);
  const isNewBest = !best || wpm > best.wpm;
  if (isNewBest && wpm > 0) {
    saveBest(state.duration, { wpm, accuracy: acc, date: todayISO() });
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
  const acc = state.totalKeys === 0 ? 100 : computeAccuracy();
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

// ---- Duration selector (30s / 60s) ----
document.querySelectorAll(".dur-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedDuration = Number(btn.dataset.seconds);
    document.querySelectorAll(".dur-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    refreshBestDisplay();
  });
});

// ---- Cozy particles (leaves + spores) ----
const reduceMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function spawnLeaf() {
  const host = el("particles");
  if (!host) return;
  const leaf = document.createElement("span");
  leaf.className = "leaf";
  const dur = rand(7, 13);
  const size = rand(10, 20);
  leaf.style.left = rand(-2, 100) + "vw";
  leaf.style.width = size + "px";
  leaf.style.height = size + "px";
  leaf.style.setProperty("--dx", rand(-120, 160) + "px");
  leaf.style.setProperty("--rot", rand(360, 900) + "deg");
  leaf.style.animation = `leafFall ${dur}s linear forwards`;
  leaf.addEventListener("animationend", () => leaf.remove());
  host.appendChild(leaf);
}

function spawnSpore() {
  const host = el("particles");
  if (!host) return;
  const spore = document.createElement("span");
  spore.className = "spore";
  const dur = rand(9, 16);
  const size = rand(4, 9);
  spore.style.left = rand(0, 100) + "vw";
  spore.style.width = size + "px";
  spore.style.height = size + "px";
  spore.style.setProperty("--dx", rand(-80, 80) + "px");
  spore.style.animation = `sporeRise ${dur}s linear forwards`;
  spore.addEventListener("animationend", () => spore.remove());
  host.appendChild(spore);
}

function startParticles() {
  if (reduceMotion) return;
  setInterval(spawnLeaf, 1200);
  setInterval(spawnSpore, 2600);
  // A few right away so the scene isn't empty after the intro.
  for (let i = 0; i < 3; i++) setTimeout(spawnLeaf, i * 500);
  for (let i = 0; i < 2; i++) setTimeout(spawnSpore, 800 + i * 700);
}

// ---- Intro: let the opening animation play, then settle ----
if (reduceMotion) {
  document.body.classList.remove("intro");
  startParticles();
} else {
  // Begin drifting once the scene has risen in.
  setTimeout(startParticles, 1600);
  // Remove the intro class after the timeline so idle animations take over cleanly.
  setTimeout(() => document.body.classList.remove("intro"), 2600);
}

refreshBestDisplay();
console.log("Cozy Typing ready.");
