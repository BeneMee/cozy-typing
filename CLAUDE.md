# CLAUDE.md — Cozy Typing

Guidance for working in this repository.

## What this is

A cozy, browser-based **typing sprint game** in a *Breath of the Wild* visual
style. Type randomly-chosen real sentences as fast as you can within a timed
sprint (30s or 60s) and chase your best WPM. Single-player, fully offline,
no backend.

- **Live:** https://cozy-typing.vercel.app
- **Source:** https://github.com/BeneMee/cozy-typing

## Tech & constraints

- **Pure static site — zero dependencies, no build step, no framework.** Plain
  HTML + CSS + vanilla JS. The whole game runs by opening `index.html`.
- **No image assets.** The entire scene (sky, sun, hills, trees, grass) is
  hand-built with CSS gradients and inline SVG; leaves/spores are JS-spawned
  DOM elements. Keep it this way — do not add image files or libraries without
  a deliberate reason.
- **Offline-first.** No network calls at runtime. Sentence pack is built in.

## File map

- `index.html` — markup: the decorative `.scene` (sky/sun/SVG hills + trees/
  grass/particles) and three game screens (`#screen-start`, `#screen-game`,
  `#screen-results`). Scripts load `sentences.js` **before** `game.js`.
- `style.css` — the cozy theme, the BotW scene, the opening-intro timeline,
  idle animations (sway/sun pulse), particle keyframes, and the
  `prefers-reduced-motion` block. This is where most visual work happens.
- `game.js` — all logic: state machine, screen routing, per-character render &
  coloring, timer, scoring, highscore persistence, duration selector, particle
  spawner, intro kickoff.
- `sentences.js` — `const SENTENCES = [...]` (123 real sentences). Data only.
- `docs/` — `SPEC.md` (root), plus design & implementation-plan docs under
  `docs/superpowers/`.

## Key conventions / invariants

- `sentences.js` defines a **global** `const SENTENCES`; `game.js` reads it.
  No imports/exports — scripts share global scope and must load in order.
- **Sprint duration:** `selectedDuration` (30 or 60) is chosen on the start
  screen; `startGame()` snapshots it into `state.duration` so a mid-run toggle
  can't change the active sprint. Use `state.duration` for all in-game timing.
- **Timer** starts on the first keystroke, not before.
- **Scoring (verified correct):**
  - WPM = `(state.correctChars / 5) / minutesElapsed`, rounded; net WPM
    (correct characters only). Elapsed time is capped at `state.duration`.
  - Accuracy = `correctKeys / totalKeys * 100`, rounded; shows 100 when no keys
    typed yet.
- **Highscores** live in `localStorage` key `cozytype.best` as a **per-duration
  map**: `{ "30": {wpm,accuracy,date}, "60": {...} }`. `loadAllBest()` migrates
  the legacy single-record shape into the `"60"` slot. All storage access is
  wrapped in try/catch — play must continue if storage is blocked.
- **Accessibility:** every animation (intro, sway, particles, caret, shimmer)
  is disabled under `@media (prefers-reduced-motion: reduce)`, and `game.js`
  skips spawning particles when reduced motion is requested. Preserve this when
  adding new motion.

## Running locally

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8000   # then visit http://localhost:8000
```

There is **no test runner** (consistent with the zero-dependency choice).
Verification is manual in the browser: start a run, type, confirm live
WPM/accuracy update, the timer ends the run, results show, and the best score
persists across reloads. Also check 30s vs 60s and reduced-motion.

## Deploying

The project is linked to the Vercel project `benelab/cozy-typing` (alias
`cozy-typing.vercel.app`).

- **Auto-deploy:** the GitHub repo is connected to Vercel — pushing to `main`
  triggers a production deployment automatically. Normal flow is just
  `git push`.
- **Manual deploy** (fallback): `npx vercel deploy --prod --yes` from the repo
  root.

## Project history (what's been built)

1. **Initial game** (spec → plan → implementation): 60s sprint, 123-sentence
   built-in pack, per-character live coloring, caret, live WPM/accuracy, three
   screens, local best score, warm cozy theme with gentle animations, deployed
   to Vercel.
2. **Cozy BotW overhaul:** replaced the flat background with a layered
   CSS/SVG Breath-of-the-Wild scene (golden-hour sky, pulsing sun, swaying
   trees & grass, drifting leaves and light spores) behind a frosted-glass
   card; added a one-time "zeldaish" opening animation; added a **30s/60s**
   duration selector with **separate highscores per duration**; confirmed the
   WPM math; pushed to GitHub and connected Vercel Git auto-deploy.

## Workflow notes

- Per the user's global workflow: plan before coding; keep changes scoped to
  one feature at a time.
- Commit messages used here end with a `Co-Authored-By: Claude ...` trailer.
- The user prefers a warm **golden-hour** mood for the scene; ask before
  shifting the palette (e.g. to midday or dusk/fireflies).
