# Cozy Typing — SPEC

A cozy, browser-based typing game. Type real sentences as fast as you can in a
60-second sprint, chase your best WPM, and enjoy a warm, calm, animated vibe.

## Goal

Deliver a polished single-player typing sprint that is:

- **Cozy in feel** — warm palette, soft shapes, gentle animations.
- **Real-content** — randomly drawn from a built-in pack of natural sentences.
- **Offline & zero-setup** — open the file (or a static URL) and play.
- **Replayable** — a local highscore (best WPM) to beat.

## Core gameplay

- **Mode:** Timed sprint, 60 seconds.
- **Loop:** A random sentence appears. The player types it. On completion a new
  random sentence fades in. Repeat until the timer hits zero.
- **Timer start:** The countdown begins on the first keystroke, not before.
- **Sentence source:** A built-in pack of ~120 real, natural-language sentences
  (varied length and topic; content does NOT need to be themed/cozy — the
  coziness is purely visual). A sentence never repeats back-to-back.

## Typing mechanics

- **Free typing** (monkeytype-style). Characters are colored live:
  - correct → warm green
  - incorrect → soft red
  - untyped → muted
- **Caret:** a gentle blinking caret marks the current position.
- **Backspace:** allowed, to correct mistakes.
- **Advance:** finishing the current sentence (all chars typed) loads the next.

## Scoring

- **Headline metric:** WPM = (correct characters ÷ 5) ÷ minutes elapsed.
- **Accuracy:** correct keystrokes ÷ total keystrokes, shown alongside but does
  not change the rank.
- **Characters typed:** shown on results as a secondary stat.

## Highscore / persistence

- A single **best WPM** run stored in `localStorage`:
  `{ wpm, accuracy, date }`.
- Private, per-browser, offline. No accounts, no backend.
- New best triggers a celebratory animation on the results screen.

## Screens & flow

1. **Start screen** — title, brief how-to, Start button, current best score.
2. **Game screen** — current sentence (per-character coloring), 60s countdown,
   live WPM & accuracy.
3. **Results screen** — final WPM (headline), accuracy %, characters typed,
   new-best indicator + celebration. Buttons: Play Again, Back to Menu.

## Aesthetics & animation

- **Palette:** soft cream / amber / terracotta / muted brown. Rounded, soft
  shapes. A warm, readable font.
- **Animations:** sentence fade/slide-in, caret pulse, subtle correct-char
  settle, calm ambient background (slow warm gradient drift / floating motes),
  shimmer on a new best. Smooth and calm — never flashy.
- **Accessibility:** respects `prefers-reduced-motion` (reduces/disables
  non-essential motion).

## Architecture

Static, dependency-free, no build step:

- `index.html` — markup & screen containers.
- `style.css` — cozy theme, layout, animations.
- `game.js` — all game logic (state, timer, scoring, rendering, persistence).
- `sentences.js` — the built-in sentence pack as a plain array (separate file so
  it is easy to expand).

Runs by opening `index.html` directly or by serving the folder from any static
host.

## Deployment

- **Primary: Vercel.** A plain static site — no build command, no `vercel.json`
  required. Deploy the project folder to get a live URL. (The session has a
  Vercel deploy integration available to push it directly.)
- **Alternatives:** Netlify, GitHub Pages, or Cloudflare Pages would work
  identically since the output is just static files.
- **Flow:** build → test locally in the browser → deploy to Vercel → share the
  live link.

## Testing / verification

No build = manual verification in the browser:

- Start a run; confirm timer begins on first keystroke.
- Type correct/incorrect chars; confirm live coloring and accuracy update.
- Confirm WPM updates and is sane.
- Confirm timer ends the run at 0 and shows results.
- Confirm best score persists across reloads and new-best celebration fires.
- Confirm `prefers-reduced-motion` reduces animation.

## Out of scope (YAGNI)

- Online/global leaderboards, accounts, backend.
- Multiple game modes, difficulty tiers, multiplayer.
- Live online sentence/quote APIs.
- Sound (can be a later addition if desired).
