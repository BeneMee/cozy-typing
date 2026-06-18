# Cozy Typing Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cozy, browser-based 60-second typing sprint where the player types random real sentences, sees live WPM/accuracy, and chases a locally-stored best score.

**Architecture:** A static, dependency-free, no-build site of four files (`index.html`, `style.css`, `game.js`, `sentences.js`). `game.js` holds a small state machine driving three screens (start / game / results). State and best score persist in `localStorage`. Coziness is delivered via a warm CSS theme and gentle animations.

**Tech Stack:** Plain HTML5, CSS3 (custom properties + keyframes), vanilla ES (no modules build needed; scripts loaded via `<script>` tags in order). Deployed as static files to Vercel.

## Global Constraints

- **Zero dependencies, zero build step.** No npm packages, no framework, no bundler. Plays by opening `index.html`.
- **Offline-first.** No network calls at runtime. Sentence pack is built-in.
- **Scripts load in order:** `sentences.js` before `game.js`. `sentences.js` defines a global `const SENTENCES = [...]`; `game.js` reads it.
- **Persistence key:** `localStorage` key is exactly `cozytype.best`, storing JSON `{ wpm: number, accuracy: number, date: string }`. All `localStorage` access wrapped in try/catch.
- **WPM formula:** `(correctChars / 5) / minutesElapsed`, rounded to a whole number for display.
- **Accuracy formula:** `correctKeystrokes / totalKeystrokes`, displayed as a whole-number percent. When `totalKeystrokes === 0`, both WPM and accuracy display `0`.
- **Sprint length:** exactly 60 seconds; timer starts on the first keystroke.
- **Accessibility:** honor `@media (prefers-reduced-motion: reduce)`.
- **Verification is manual in the browser** (no test runner). "Run" steps describe what to open/do and the expected on-screen result. Pure-logic checks use the browser console.

---

### Task 1: Scaffold files, screens, and base theme

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `game.js` (stub)
- Create: `sentences.js` (stub)

**Interfaces:**
- Consumes: nothing.
- Produces: DOM element IDs that later tasks rely on, exactly:
  - Screens: `#screen-start`, `#screen-game`, `#screen-results` (toggled by adding/removing the `hidden` attribute).
  - Start screen: `#best-display` (text), `#start-btn` (button).
  - Game screen: `#sentence` (holds per-char `<span>`s), `#hidden-input` (a focusable text input capturing keystrokes), `#timer`, `#live-wpm`, `#live-acc`.
  - Results screen: `#final-wpm`, `#final-acc`, `#final-chars`, `#newbest` (celebration banner, `hidden` by default), `#again-btn`, `#menu-btn`.
- Produces CSS custom properties on `:root` for the warm palette (used by later tasks).

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cozy Typing</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="ambient" aria-hidden="true"></div>

  <main class="card">
    <!-- START -->
    <section id="screen-start" class="screen">
      <h1 class="title">Cozy&nbsp;Typing</h1>
      <p class="subtitle">Type as many sentences as you can in 60 seconds.</p>
      <ul class="howto">
        <li>Sentences appear one at a time — just start typing.</li>
        <li>The timer starts on your first keystroke.</li>
        <li>Backspace to fix mistakes. Chase your best WPM.</li>
      </ul>
      <p class="best">Best: <span id="best-display">—</span></p>
      <button id="start-btn" class="btn">Start</button>
    </section>

    <!-- GAME -->
    <section id="screen-game" class="screen" hidden>
      <div class="hud">
        <div class="hud-item"><span class="hud-num" id="timer">60</span><span class="hud-label">seconds</span></div>
        <div class="hud-item"><span class="hud-num" id="live-wpm">0</span><span class="hud-label">wpm</span></div>
        <div class="hud-item"><span class="hud-num" id="live-acc">100</span><span class="hud-label">% acc</span></div>
      </div>
      <p id="sentence" class="sentence"></p>
      <input id="hidden-input" class="hidden-input" type="text" autocomplete="off"
             autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Type here" />
      <p class="hint">Click here if typing stops registering.</p>
    </section>

    <!-- RESULTS -->
    <section id="screen-results" class="screen" hidden>
      <h2 class="results-title">Time!</h2>
      <div id="newbest" class="newbest" hidden>✨ New personal best! ✨</div>
      <div class="results-grid">
        <div class="result"><span class="result-num" id="final-wpm">0</span><span class="result-label">WPM</span></div>
        <div class="result"><span class="result-num" id="final-acc">0</span><span class="result-label">% accuracy</span></div>
        <div class="result"><span class="result-num" id="final-chars">0</span><span class="result-label">characters</span></div>
      </div>
      <div class="results-actions">
        <button id="again-btn" class="btn">Play Again</button>
        <button id="menu-btn" class="btn btn-ghost">Back to Menu</button>
      </div>
    </section>
  </main>

  <script src="sentences.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css` with the cozy base theme**

```css
:root {
  --bg: #2b211c;
  --bg-warm: #3a2c24;
  --card: #f6ead8;
  --card-edge: #e7d4b8;
  --ink: #4a3b30;
  --ink-soft: #8a7159;
  --amber: #d98e4a;
  --amber-deep: #c1702e;
  --terracotta: #c96f4a;
  --correct: #6f8f5a;
  --wrong: #c25b54;
  --muted: #c8b79c;
  --radius: 22px;
  --font: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
}

* { box-sizing: border-box; }

html, body { height: 100%; }

body {
  margin: 0;
  font-family: var(--font);
  color: var(--ink);
  background: radial-gradient(circle at 30% 20%, var(--bg-warm), var(--bg));
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
}

.ambient {
  position: fixed;
  inset: -20%;
  background:
    radial-gradient(40% 40% at 20% 30%, rgba(217,142,74,0.18), transparent 70%),
    radial-gradient(45% 45% at 80% 70%, rgba(201,111,74,0.16), transparent 70%);
  z-index: 0;
}

.card {
  position: relative;
  z-index: 1;
  width: min(720px, 92vw);
  background: var(--card);
  border: 1px solid var(--card-edge);
  border-radius: var(--radius);
  box-shadow: 0 24px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4);
  padding: clamp(24px, 5vw, 48px);
}

.screen[hidden] { display: none; }

.title { font-size: clamp(2rem, 6vw, 3rem); margin: 0 0 .25em; letter-spacing: .5px; }
.subtitle { color: var(--ink-soft); margin: 0 0 1.25em; font-size: 1.1rem; }
.howto { color: var(--ink-soft); line-height: 1.7; padding-left: 1.1em; margin: 0 0 1.5em; }
.best { font-size: 1.15rem; margin: 0 0 1.5em; }
#best-display { color: var(--amber-deep); font-weight: bold; }

.btn {
  font-family: var(--font);
  font-size: 1.1rem;
  color: #fff;
  background: linear-gradient(180deg, var(--amber), var(--amber-deep));
  border: none;
  border-radius: 999px;
  padding: .7em 1.8em;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(193,112,46,0.4);
  transition: transform .12s ease, box-shadow .12s ease;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(193,112,46,0.5); }
.btn:active { transform: translateY(0); }
.btn-ghost {
  background: transparent;
  color: var(--ink-soft);
  box-shadow: none;
  border: 1px solid var(--card-edge);
}
.btn-ghost:hover { box-shadow: none; color: var(--ink); }

.hud { display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 1.75rem; }
.hud-item { display: flex; flex-direction: column; align-items: center; min-width: 70px; }
.hud-num { font-size: 1.9rem; font-weight: bold; color: var(--amber-deep); line-height: 1; }
.hud-label { font-size: .8rem; color: var(--ink-soft); text-transform: lowercase; }

.sentence {
  font-size: clamp(1.3rem, 3.2vw, 1.8rem);
  line-height: 1.7;
  letter-spacing: .3px;
  min-height: 4.5em;
  margin: 0 0 1rem;
}
.sentence .char { color: var(--muted); transition: color .12s ease; }
.sentence .char.correct { color: var(--correct); }
.sentence .char.wrong { color: var(--wrong); text-decoration: underline wavy var(--wrong); }
.sentence .char.current { position: relative; }

.hidden-input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}
.hint { color: var(--ink-soft); font-size: .85rem; opacity: .6; text-align: center; margin: 0; }

.results-title { font-size: 2rem; margin: 0 0 .5em; text-align: center; }
.newbest { text-align: center; color: var(--amber-deep); font-size: 1.2rem; margin-bottom: 1rem; }
.results-grid { display: flex; justify-content: center; gap: 2rem; margin: 1.5rem 0; }
.result { display: flex; flex-direction: column; align-items: center; }
.result-num { font-size: 2.6rem; font-weight: bold; color: var(--amber-deep); line-height: 1; }
.result-label { color: var(--ink-soft); font-size: .9rem; }
.results-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
```

- [ ] **Step 3: Create stub `sentences.js`**

```javascript
// Replaced with the full pack in Task 2.
const SENTENCES = ["The quick brown fox jumps over the lazy dog."];
```

- [ ] **Step 4: Create stub `game.js`**

```javascript
// Game logic is built up across Tasks 3-6.
console.log("Cozy Typing loaded.");
```

- [ ] **Step 5: Verify in the browser**

Run: open `index.html` in a browser (double-click or drag into a tab).
Expected: The cozy card shows the start screen — title "Cozy Typing", the how-to list, "Best: —", and a Start button. Background is warm/dark with soft glow. The console logs "Cozy Typing loaded." (Game and Results sections are hidden.)

- [ ] **Step 6: Commit**

```bash
git add index.html style.css game.js sentences.js
git commit -m "feat: scaffold cozy typing screens and base theme"
```

---

### Task 2: Build the sentence pack

**Files:**
- Modify: `sentences.js`

**Interfaces:**
- Consumes: nothing.
- Produces: global `const SENTENCES` — an array of ≥120 strings, each a real, natural English sentence ending in punctuation, no leading/trailing whitespace, no newlines.

- [ ] **Step 1: Replace `sentences.js` with the full pack**

```javascript
// Built-in pack of real, natural sentences. Picked at random at runtime.
const SENTENCES = [
  "The morning light slipped quietly through the kitchen window.",
  "She poured another cup of tea and watched the rain fall.",
  "A good book and a warm blanket make any evening better.",
  "The old wooden floor creaked softly under his bare feet.",
  "Somewhere down the street a dog barked at the passing train.",
  "We talked for hours about everything and nothing at all.",
  "The bakery smelled of cinnamon long before it opened.",
  "He folded the letter carefully and slipped it into his pocket.",
  "Autumn leaves drifted across the empty playground.",
  "The cat curled into a tight ball on the sunlit chair.",
  "Snow began to fall just as the lamps flickered on.",
  "Her grandmother always said patience was its own reward.",
  "The garden was quiet except for the hum of bees.",
  "They watched the last train leave without saying a word.",
  "A single candle lit the corner of the crowded room.",
  "The coffee had gone cold but he kept drinking it anyway.",
  "Waves rolled gently against the worn stone harbor.",
  "She hummed an old song while kneading the bread.",
  "The map was creased and faded but still good enough.",
  "Fireflies blinked across the meadow as dusk settled in.",
  "He learned to whistle the tune his father used to play.",
  "The library was silent save for the turning of pages.",
  "Rain tapped a steady rhythm on the tin roof above.",
  "We shared an umbrella and laughed at the puddles.",
  "The kettle whistled just as the storm broke outside.",
  "A warm loaf of bread sat cooling on the counter.",
  "The stars seemed brighter far away from the city lights.",
  "She wrapped the gift in plain brown paper and string.",
  "The path wound gently through the misty morning fields.",
  "He always kept a spare pencil tucked behind his ear.",
  "The clock on the wall had stopped at half past three.",
  "They roasted marshmallows until the fire burned low.",
  "Soft music drifted from the open window next door.",
  "The puppy chased its tail in dizzy little circles.",
  "She pressed wildflowers between the pages of her diary.",
  "The train rattled past fields of golden wheat.",
  "He sketched the harbor while the gulls wheeled overhead.",
  "A gentle breeze carried the scent of fresh cut grass.",
  "The children built a fort out of every cushion they could find.",
  "We counted the stars until we both fell asleep.",
  "The shop bell jingled each time the door swung open.",
  "Morning fog hung low over the sleepy little village.",
  "She knitted a scarf the color of late autumn leaves.",
  "The river moved slow and silver beneath the bridge.",
  "He read the same paragraph three times before giving up.",
  "The orchard was heavy with apples ready to be picked.",
  "They danced in the kitchen long after the music ended.",
  "A thin ribbon of smoke rose from the chimney.",
  "The lighthouse blinked patiently across the dark water.",
  "She saved the crossword for the quiet part of the afternoon.",
  "Warm bread and cold butter is a simple kind of joy.",
  "The trail was muddy but the view was worth every step.",
  "He whittled a small boat from a piece of driftwood.",
  "The market buzzed with the chatter of early shoppers.",
  "Snowflakes melted the moment they touched her glove.",
  "The porch swing creaked gently in the evening wind.",
  "We followed the sound of music to the little square.",
  "A stack of records leaned against the dusty turntable.",
  "The soup simmered slowly while the snow piled higher.",
  "She tucked a note inside the book before returning it.",
  "The old dog stretched and yawned in the patch of sun.",
  "Lanterns swayed above the narrow cobblestone street.",
  "He saved the best chair by the window for himself.",
  "The valley filled with mist as the sun went down.",
  "They planted tomatoes along the sunny side of the fence.",
  "A worn quilt covered the foot of the narrow bed.",
  "The first frost laced the windows with delicate patterns.",
  "She always knew exactly which key opened which door.",
  "The campfire crackled and sent sparks into the dark.",
  "He kept every postcard he had ever received.",
  "The hills turned gold in the slow light of evening.",
  "We picked blackberries until our fingers were stained purple.",
  "The radio played softly through the静 quiet afternoon.",
  "A row of boots stood drying by the back door.",
  "The cabin smelled of pine and woodsmoke and rain.",
  "She traced the rim of her mug while she thought.",
  "The ferry crossed the bay just as the sky turned pink.",
  "He hummed to himself as he swept the front steps.",
  "The meadow was loud with crickets after dark.",
  "They left the porch light on for whoever came home last.",
  "A soft rain made the whole town smell like spring.",
  "The bookshop cat slept in the window every afternoon.",
  "She wrote letters she never quite got around to sending.",
  "The bridge was lined with little locks and faded ribbons.",
  "He kept his change in an old chipped teacup.",
  "The bakery sold out of rolls before nine every morning.",
  "We watched the tide come in and erase our footprints.",
  "The attic was full of boxes nobody dared to open.",
  "She left fresh flowers on the table every Sunday.",
  "The wind chimes sang in the cool of the morning.",
  "He could fix almost anything with patience and tape.",
  "The path home was longer but far more beautiful.",
  "A pot of stew bubbled away on the back burner.",
  "They told stories until the candles guttered out.",
  "The first cup of coffee is always the best one.",
  "She hung the laundry to dry between the apple trees.",
  "The snow muffled every sound in the little town.",
  "He found an old photograph tucked inside the frame.",
  "The garden gate squeaked a friendly sort of welcome.",
  "We shared a slice of pie and two clean forks.",
  "The harbor lights reflected in the still black water.",
  "She always read the last page first, just to be safe.",
  "The fire threw dancing shadows across the low ceiling.",
  "He carried the groceries up three flights without complaint.",
  "The afternoon stretched long and warm and unhurried.",
  "A single sparrow hopped along the frosty railing.",
  "They watched old films until the sun came up.",
  "The kettle was the first thing she reached for each day.",
  "He folded the map wrong and we laughed the whole way.",
  "The orchard hummed with the sound of summer afternoons.",
  "She wore her father's old sweater all through winter.",
  "The lake was a perfect mirror in the early calm.",
  "We left the window open to listen to the storm.",
  "The little café kept one table just for regulars.",
  "He saved string and buttons in a battered tin box.",
  "The trail ended at a quiet, sunlit clearing.",
  "She baked an extra loaf to leave on a neighbor's step.",
  "The moon rose huge and orange over the rooftops.",
  "They spent the whole rainy day building a blanket fort.",
  "A warm light glowed in the window all through the night.",
  "The old clock ticked a slow and steady comfort.",
  "He whistled the same three notes whenever he was happy.",
  "The first snow always made the whole world feel new."
];
```

> Note: fix the stray non-ASCII character in the "radio played softly" line — it must read exactly: `"The radio played softly through the quiet afternoon.",` Remove the erroneous `静 ` before "quiet".

- [ ] **Step 2: Verify the pack loads and is clean**

Run: open `index.html`, then in the browser console run:
```javascript
SENTENCES.length >= 120 && SENTENCES.every(s => typeof s === "string" && s.trim() === s && !s.includes("\n"))
```
Expected: `true`. Also run `SENTENCES.find(s => /[^\x00-\x7F]/.test(s))` and expect `undefined` (no stray non-ASCII characters).

- [ ] **Step 3: Commit**

```bash
git add sentences.js
git commit -m "feat: add built-in pack of cozy sentences"
```

---

### Task 3: Game state, screen routing, and sentence rendering

**Files:**
- Modify: `game.js`

**Interfaces:**
- Consumes: `SENTENCES`; DOM IDs from Task 1.
- Produces (used by later tasks):
  - `state` object: `{ screen, sentence, typed, prevSentence, startTime, timerId, remaining, correctChars, totalKeys, correctKeys }`.
  - `showScreen(name)` where name ∈ `"start" | "game" | "results"`.
  - `pickSentence()` → returns a random sentence string ≠ `state.prevSentence`.
  - `renderSentence()` → paints `#sentence` as per-char `<span class="char">`, applying `correct` / `wrong` / `current` classes based on `state.typed`.
  - `startGame()` → resets state, shows game screen, focuses `#hidden-input`, renders first sentence.

- [ ] **Step 1: Replace `game.js` with state + routing + rendering**

```javascript
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

console.log("Cozy Typing ready.");
```

- [ ] **Step 2: Verify routing and rendering**

Run: open `index.html`, click **Start**.
Expected: The game screen appears showing a random sentence in muted color with the first character marked as current; HUD shows `60 / 0 / 100`. The start screen is hidden.

- [ ] **Step 3: Verify `pickSentence` avoids immediate repeats**

Run: in the console:
```javascript
state.prevSentence = SENTENCES[0];
Array.from({length: 50}, () => pickSentence()).every(s => s !== SENTENCES[0]);
```
Expected: `true`.

- [ ] **Step 4: Commit**

```bash
git add game.js
git commit -m "feat: add game state, screen routing, and sentence rendering"
```

---

### Task 4: Input handling, live coloring, and sentence advance

**Files:**
- Modify: `game.js`

**Interfaces:**
- Consumes: `state`, `renderSentence`, `loadNextSentence` from Task 3.
- Produces (used by Task 5):
  - `handleInput(value)` → reconciles `state.typed` with the input's value, updates `state.totalKeys` / `state.correctKeys` / `state.correctChars`, re-renders, and advances to the next sentence when the current one is fully and exactly typed.
  - On the first input, calls `onFirstKeystroke()` (defined in Task 5; declared now as a no-op placeholder so Task 4 runs standalone).

- [ ] **Step 1: Add input handling to `game.js`** (insert before the final `console.log`)

```javascript
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
```

- [ ] **Step 2: Reset `completedCorrectChars` on new game**

In `startGame()` (from Task 3), add `completedCorrectChars = 0;` alongside the other resets (e.g. right after `state.correctChars = 0;`). The variable is declared with `let` at module scope in Step 1, so assignment works.

```javascript
  state.correctChars = 0;
  completedCorrectChars = 0;
```

- [ ] **Step 3: Verify live coloring**

Run: open `index.html`, click Start, type the sentence shown — include a deliberate wrong character.
Expected: correct characters turn green, the wrong one turns red with a wavy underline, untyped stays muted, and the caret-position char has the `current` class. Pressing Backspace removes coloring from the erased character.

- [ ] **Step 4: Verify advance to next sentence**

Run: type the entire current sentence correctly.
Expected: a new (different) sentence appears and the input clears, ready for more typing.

- [ ] **Step 5: Verify keystroke tallies**

Run: after typing a few correct and one wrong character, in the console check:
```javascript
state.totalKeys > 0 && state.correctKeys <= state.totalKeys
```
Expected: `true`.

- [ ] **Step 6: Commit**

```bash
git add game.js
git commit -m "feat: add input handling, live coloring, and sentence advance"
```

---

### Task 5: Timer, live WPM/accuracy, and ending the run

**Files:**
- Modify: `game.js`

**Interfaces:**
- Consumes: `state`, `handleInput`'s placeholders `onFirstKeystroke` / `updateLiveStats` from Task 4.
- Produces (used by Task 6):
  - `computeWpm()` → integer WPM from `state.correctChars` and elapsed minutes (0 if no time elapsed / no keys).
  - `computeAccuracy()` → integer percent (0 if `totalKeys === 0`).
  - `endGame()` → stops timer, computes finals, shows results (calls `finishResults(wpm, acc, chars)` defined in Task 6; declared now as a placeholder that just fills the result numbers).

- [ ] **Step 1: Replace the `onFirstKeystroke` and `updateLiveStats` placeholders and add timer/scoring in `game.js`**

Replace the line `let onFirstKeystroke = function () {};` with:

```javascript
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
```

Replace the line `let updateLiveStats = function () {};` with:

```javascript
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
```

- [ ] **Step 2: Add `endGame` and a results placeholder** (insert before the final `console.log`)

```javascript
// Task 6 replaces this with persistence + celebration.
let finishResults = function (wpm, acc, chars) {
  el("final-wpm").textContent = String(wpm);
  el("final-acc").textContent = String(acc);
  el("final-chars").textContent = String(chars);
  el("newbest").hidden = true;
};

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
  el("best-display").textContent = el("best-display").textContent; // refreshed in Task 6
  showScreen("start");
});
```

- [ ] **Step 3: Verify the timer starts on first keystroke**

Run: open `index.html`, click Start. Confirm the timer reads `60` and does **not** move until you press a key. Then type a character.
Expected: the countdown begins ticking down from 60 only after the first keystroke.

- [ ] **Step 4: Verify live WPM/accuracy update**

Run: type steadily for a few seconds, mixing in a wrong key.
Expected: `wpm` rises above 0 and `% acc` drops below 100 after the mistake.

- [ ] **Step 5: Verify the run ends and shows results**

Run: let the timer run to 0 (or in the console set `state.startTime = Date.now() - 61000` then type one key to force a tick).
Expected: the results screen appears with WPM, accuracy %, and character count populated; Play Again restarts a fresh run; Back to Menu returns to start.

- [ ] **Step 6: Verify scoring formulas in isolation**

Run: in the console:
```javascript
state.correctChars = 250; state.startTime = Date.now() - 60000;
computeWpm(); // (250/5) / 1 = 50
```
Expected: `50`. Then:
```javascript
state.totalKeys = 200; state.correctKeys = 190; computeAccuracy(); // 95
```
Expected: `95`.

- [ ] **Step 7: Commit**

```bash
git add game.js
git commit -m "feat: add timer, live WPM/accuracy, and run completion"
```

---

### Task 6: Best-score persistence and new-best celebration

**Files:**
- Modify: `game.js`
- Modify: `style.css`

**Interfaces:**
- Consumes: `state`, `endGame`'s `finishResults` placeholder, `showScreen` from Task 5.
- Produces:
  - `loadBest()` → returns stored `{ wpm, accuracy, date }` or `null` (try/catch).
  - `saveBest(record)` → writes JSON to `localStorage["cozytype.best"]` (try/catch).
  - `formatBest()` → string for the start screen (`"— "` when none).
  - `refreshBestDisplay()` → updates `#best-display`.
  - Final `finishResults` that persists a new best and triggers the celebration.

- [ ] **Step 1: Add persistence + celebration to `game.js`**

Replace the placeholder `let finishResults = ...` block (from Task 5) with:

```javascript
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
```

- [ ] **Step 2: Refresh best on the menu button and on load**

Replace the `menu-btn` listener body (from Task 5) with:

```javascript
el("menu-btn").addEventListener("click", () => {
  refreshBestDisplay();
  showScreen("start");
});
```

Then, just before the final `console.log("Cozy Typing ready.")`, add:

```javascript
refreshBestDisplay();
```

- [ ] **Step 3: Add the shimmer animation to `style.css`**

```css
@keyframes shimmer {
  0%   { transform: scale(0.85); opacity: 0; }
  40%  { transform: scale(1.08); opacity: 1; }
  70%  { transform: scale(0.98); }
  100% { transform: scale(1); opacity: 1; }
}
.newbest.shimmer { animation: shimmer .7s ease-out; }
```

- [ ] **Step 4: Verify a new best persists**

Run: open `index.html`, play a run and finish it (force the end via the console trick from Task 5 Step 5 if you don't want to wait).
Expected: results show "✨ New personal best! ✨" with a pop animation the first time. Reload the page — the start screen "Best:" now shows your WPM/accuracy. Play a worse run — no new-best banner; play a better one — banner returns and Best updates.

- [ ] **Step 5: Verify storage failure is non-fatal**

Run: in the console, simulate failure:
```javascript
const orig = Storage.prototype.setItem;
Storage.prototype.setItem = () => { throw new Error("blocked"); };
finishResults(40, 95, 200); // should not throw
Storage.prototype.setItem = orig;
```
Expected: no error thrown; results still display.

- [ ] **Step 6: Commit**

```bash
git add game.js style.css
git commit -m "feat: persist best score and celebrate new personal bests"
```

---

### Task 7: Cozy animations and reduced-motion polish

**Files:**
- Modify: `style.css`
- Modify: `game.js`

**Interfaces:**
- Consumes: `.sentence`, `.ambient`, `.char.current`, screen elements.
- Produces: a `fade-in` class applied to `#sentence` on each new sentence; ambient drift; caret pulse; reduced-motion overrides.

- [ ] **Step 1: Add animations to `style.css`**

```css
/* Ambient background drift */
@keyframes drift {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(2%, -1.5%) scale(1.05); }
  100% { transform: translate(0, 0) scale(1); }
}
.ambient { animation: drift 18s ease-in-out infinite; }

/* Sentence fade/slide in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sentence.fade-in { animation: fadeIn .35s ease-out; }

/* Caret pulse on the current character */
@keyframes caretPulse { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
.sentence .char.current {
  border-left: 2px solid var(--amber-deep);
  margin-left: -2px;
  animation: caretPulse 1s ease-in-out infinite;
}

/* Reduced motion: calm everything down */
@media (prefers-reduced-motion: reduce) {
  .ambient,
  .sentence.fade-in,
  .newbest.shimmer,
  .sentence .char.current {
    animation: none !important;
  }
  .btn { transition: none; }
}
```

- [ ] **Step 2: Trigger the fade-in on each new sentence in `game.js`**

In `loadNextSentence()` (Task 3), after `renderSentence();` add:

```javascript
  const s = el("sentence");
  s.classList.remove("fade-in");
  void s.offsetWidth;        // force reflow so the animation restarts
  s.classList.add("fade-in");
```

- [ ] **Step 3: Verify animations**

Run: open `index.html`, click Start, complete a sentence.
Expected: the ambient background slowly drifts; each new sentence gently fades/slides in; the current character shows a soft pulsing caret bar.

- [ ] **Step 4: Verify reduced-motion**

Run: enable "Reduce motion" in the OS/browser (or in DevTools: Rendering → Emulate CSS `prefers-reduced-motion: reduce`), then reload and play.
Expected: ambient drift, fade-in, caret pulse, and shimmer no longer animate; the game remains fully playable.

- [ ] **Step 5: Commit**

```bash
git add style.css game.js
git commit -m "feat: add cozy animations with reduced-motion support"
```

---

### Task 8: Deploy to Vercel

**Files:**
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: the finished static site.
- Produces: a live URL.

- [ ] **Step 1: Add a `.gitignore`**

```gitignore
.vercel
.DS_Store
node_modules
```

- [ ] **Step 2: Add a short `README.md`**

```markdown
# Cozy Typing

A cozy, browser-based 60-second typing sprint. Type random real sentences as
fast as you can and chase your best WPM. Fully offline, no build step.

## Play locally
Open `index.html` in any modern browser.

## Files
- `index.html` — screens and markup
- `style.css` — cozy theme and animations
- `game.js` — game logic (state, timer, scoring, persistence)
- `sentences.js` — the built-in sentence pack

## Deploy
Static site — deploy the folder to Vercel (no build command needed), or any
static host (Netlify, GitHub Pages, Cloudflare Pages).
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore README.md
git commit -m "chore: add gitignore and readme for deployment"
```

- [ ] **Step 4: Deploy**

Deploy the project folder to Vercel as a static site (via the session's Vercel deploy integration, or `npx vercel deploy` / the Vercel dashboard). No build command, no output directory override needed — the four static files are served as-is.
Expected: a live URL that loads the start screen and is fully playable.

- [ ] **Step 5: Verify the live deployment**

Run: open the returned URL in a fresh browser tab.
Expected: start screen loads, a run plays end-to-end, and best score persists across reloads on that browser.

---

## Self-Review Notes

- **Spec coverage:** Timed 60s sprint (Task 5); built-in ~120-sentence random pack, no back-to-back repeat (Tasks 2, 3); free typing with live correct/wrong/muted coloring + caret (Tasks 4, 7); backspace (Task 4); WPM headline + accuracy + chars (Tasks 5, 6); three screens (Tasks 1, 3, 5); localStorage best with try/catch + new-best celebration (Task 6); cozy palette/animations + reduced-motion (Tasks 1, 7); Vercel deployment (Task 8). All covered.
- **Placeholder discipline:** Tasks 4/5/6 use intentional, explicitly-named forward placeholders (`onFirstKeystroke`, `updateLiveStats`, `finishResults`) that are replaced in a later, named task — each step shows the full replacement code.
- **Type consistency:** `correctChars`, `totalKeys`, `correctKeys`, `completedCorrectChars`, `state.*`, `BEST_KEY`, and the `{ wpm, accuracy, date }` record shape are used consistently across tasks.
```
