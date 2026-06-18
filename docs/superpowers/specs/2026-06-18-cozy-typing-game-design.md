# Design: Cozy Typing Game — 2026-06-18

Design doc for a cozy, browser-based 60-second typing sprint. This mirrors the
root `SPEC.md` and records the decisions made during brainstorming.

## Decisions (from brainstorming)

| Question | Decision |
|----------|----------|
| Game mode | Timed sprint, 60 seconds |
| Sentence source | Built-in pack of ~120 real, random sentences (not back-to-back repeats); content need not be themed |
| Coziness | Lives in visuals: warm palette, soft shapes, gentle animations |
| Highscores | Local `localStorage` (single best WPM); private, offline |
| Score metric | WPM headline, accuracy shown alongside (does not affect rank) |
| Build approach | Single self-contained static site, no framework, no build step |
| Deployment | Vercel (static, no config); Netlify/GitHub Pages/Cloudflare as alternatives |

## Architecture

Static, dependency-free:

- `index.html` — three screen containers (start / game / results).
- `style.css` — theme variables, layout, keyframe animations, reduced-motion.
- `game.js` — state machine, timer, input handling, scoring, rendering, storage.
- `sentences.js` — `const SENTENCES = [ ... ]` plain array.

### Module responsibilities

- **`sentences.js`** — data only. Exposes the sentence pool. No logic.
- **`game.js`** — single source of game logic, organized into clear concerns:
  - *State*: which screen, current sentence, typed buffer, timer, keystroke
    tallies (correct/total), correct-character count.
  - *Timer*: starts on first keystroke; 60s countdown; ends run → results.
  - *Input*: keydown handling (printable chars + backspace), updates buffer,
    re-renders per-character coloring, advances to next random sentence on
    completion.
  - *Scoring*: WPM = (correct chars ÷ 5) ÷ minutes; accuracy = correct ÷ total
    keystrokes.
  - *Persistence*: read/write best run in `localStorage`.
  - *Render*: swap screens, paint the sentence, update live stats, fire
    celebration on new best.

## Data flow

1. Start screen reads best score from `localStorage` and shows it.
2. Player clicks Start → game screen, a random sentence rendered, awaiting input.
3. First keystroke starts the 60s timer.
4. Each keystroke updates the typed buffer → re-render coloring → update tallies
   and live WPM/accuracy.
5. Sentence complete → pick a new random sentence (≠ previous) → fade in.
6. Timer reaches 0 → compute final stats → compare to stored best → maybe write
   new best → show results (celebrate if new best).
7. Play Again restarts; Back to Menu returns to start screen.

## Error / edge handling

- No keystrokes typed → timer never starts; run cannot end with a divide-by-zero
  (guard WPM/accuracy when total keystrokes is 0 → show 0).
- `localStorage` unavailable/blocked → game still plays; best score silently not
  persisted (wrapped in try/catch).
- Sentence pool exhaustion is impossible (random with-replacement, only blocking
  immediate repeat).
- Backspace at position 0 is a no-op.

## Aesthetics & animation

- CSS custom properties for the warm palette; rounded containers; readable font.
- Keyframes: sentence fade/slide-in, caret pulse, correct-char settle, ambient
  background drift, new-best shimmer.
- `@media (prefers-reduced-motion: reduce)` reduces/disables non-essential
  motion.

## Testing / verification

Manual, in-browser (no build pipeline) — see SPEC.md "Testing / verification".

## Deployment

Vercel static deploy (no build command / no `vercel.json`). Flow: build → local
test → deploy → share live URL.

## Out of scope

Online leaderboards, accounts, backend, multiple modes, difficulty tiers,
multiplayer, live sentence APIs, sound.
