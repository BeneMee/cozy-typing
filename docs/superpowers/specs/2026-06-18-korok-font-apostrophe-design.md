# Design: Korok-Begleiter, Tippfenster-Font/Farben & DE-Apostroph

**Date:** 2026-06-18
**Status:** Approved

## Ziel

Drei abgegrenzte Verbesserungen am Cozy-Typing-Spiel:

1. Font und Farbgebung des Satz-/Tippbereichs besser auf den Golden-Hour-BotW-Vibe abstimmen.
2. Ein hüpfender Korok-Begleiter über dem aktuellen Buchstaben.
3. Eingabe mit deutscher Tastatur ermöglichen: Apostroph-Varianten (`` ` ``, `´`, `'`, `'`) als gleichwertig behandeln.

Constraints bleiben: Zero-Dependency, kein Build-Step, offline-first, keine externen Bild-/Font-Dateien.

## 1. Font & Farben des Tippfensters

- **Font** des Satzes wechselt von der aktuellen kühlen Palatino-Serife auf eine **wärmere, runde, gut lesbare** websafe-Schrift mit Charakter (Slab-/weiche Serife). Keine externe Font-Datei — nur System-Font-Stack. Eigene CSS-Variable `--font-type` für den Satz, damit der restliche Card-Text unangetastet bleibt.
- **`.char`-Zustandsfarben** auf die Szene abgestimmt:
  - *Untyped (`--muted`):* wärmeres, leicht entsättigtes Sepia statt kühlem Graubraun.
  - *Korrekt (`--correct`):* das Wald-Grün der Szene (Richtung `--tree`/`--grass`), damit getippter Text wie aufblühendes Laub wirkt.
  - *Falsch (`--wrong`):* gedämpftes Terracotta/Rost statt grelles Rot.
  - *Caret:* warmes Bernstein (unverändert).

## 2. Korok-Begleiter

- **Grafik:** hand-gebautes Inline-SVG im HTML (Blattgesicht mit Punktaugen + kleiner Holzkörper), im weichen Golden-Hour-Stil. Selbst erzeugt — keine fremde Bilddatei (Copyright/Provenienz).
- **Position:** schwebt über dem aktuellen Zeichen. JS positioniert das Korok-Element per `offsetLeft`/`offsetTop` des `.char.current`-Spans relativ zum Satz-Container, mit weichem CSS-`transition` auf `transform`/`left`.
- **Bewegung:** Hüpfen pro korrektem Tastendruck + sanftes Idle-Wippen, wenn nicht getippt wird.
- **Fehler:** kurzes erschrockenes Wackeln (Klasse wird gesetzt, per `animationend` entfernt).
- **Satz fertig:** kleiner Jubel-Hüpfer, dann lädt der nächste Satz.
- **Sichtbarkeit:** nur auf dem Game-Screen; folgt dem Caret, verschwindet am Satzende/Bildschirmwechsel sauber.
- **Reduced-Motion:** Korok bleibt sichtbar und folgt dem Caret, aber ohne Hüpf-/Wippen-/Wackel-Animation — konsistent mit der bestehenden A11y-Regel (`prefers-reduced-motion`).

## 3. DE-Apostroph (Dead-Key)

- In der Vergleichslogik (`renderSentence`, `currentCorrectPrefix`, `tallyKeystroke`) wird Tipp- und Sollzeichen vor dem Vergleich normalisiert: `` ` ``, `´`, `'` (U+2019), `'` (U+2018) → `'` (U+0027).
- WPM- und Genauigkeits-Zähler bleiben korrekt: ein normalisiert passendes Zeichen zählt als korrekt.
- Der gerenderte Satz zeigt weiterhin das Originalzeichen; nur der Vergleich ist tolerant.

## Betroffene Dateien

- `style.css` — `--font-type`, `.char`-Farbvariablen, Korok-Styles + Keyframes (Hüpfen/Wippen/Wackeln/Jubel), Reduced-Motion-Block ergänzt.
- `index.html` — Korok-Inline-SVG im `#screen-game`.
- `game.js` — Apostroph-Normalisierung; Korok-Positionierung & Animations-Trigger im Render-/Input-/Satzende-Flow.
- `sentences.js` — unverändert.

## Verifikation (manuell im Browser)

- Satz-Font und -Farben wirken wärmer/stimmiger zur Szene.
- Korok folgt dem Caret, hüpft pro Buchstabe, wippt im Leerlauf, wackelt bei Fehler, jubelt am Satzende.
- „don't" lässt sich mit `` ` `` oder `´` statt `'` korrekt tippen; WPM/Accuracy stimmen.
- 30s/60s und `prefers-reduced-motion` weiterhin korrekt (kein Korok-Zappeln bei Reduced-Motion).
