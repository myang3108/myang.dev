# Motion ideas — Studio Dumbar inspired

Parking lot for main-page motion concepts. Reference:
[Studio Dumbar × OpenAI](https://studiodumbar.com/work/openai) — their stated
principle is *restraint* and "meaningful, poetic gestures," not spectacle.
Worth keeping in mind: the goal is that the page feels like one system
responding to you, not a pile of individual effects.

## Built

### 1. Read-head wave + velocity-reactive type ✅
Replaced the binary per-word `is-active` flip with a continuous falloff around
a fractional read head, so ~5 words are mid-transition at once and the
paragraph reads as a single wave. Plus the prose block reacts to scroll
velocity (letter-spacing opens, slight lean) and relaxes when you settle.

Implementation notes live in `main.js` (`WAVE_*` / velocity constants) and
`styles.css` (`.word` custom-property transforms).

### 2. Desk hover focus (work panel) ✅
Hovering a project object recedes its siblings (opacity + small blur, slower
curve than the lift) and reveals its name rising into a mask, centered on the
object. Hit areas are derived from `getBBox()` so padding is uniform.

### 3. Work-box trace-out ✅
Clicking "take a look at my work :)" draws a connector line out to a box that
traces itself open (SVG `stroke-dasharray`/`stroke-dashoffset`), then reverses
on close. Open/close is driven by a `workState` machine ('closed' | 'opening' |
'open' | 'closing') with a `workPendingIntent` queue and cancellable timer
chain (`workSchedule` / `workClearTimers`), so spam-clicking the trigger can
never run two trace sequences at once — mid-transition clicks queue the
opposite intent and flush when the current chain settles.

## Tried and rejected

- **Persistent hairline rule (was #4)** — built as a tail-rule → work handoff.
  Rejected: "remove that i dont like it." Read as decorative clutter, not the
  single continuity element it was meant to be. Don't re-propose.
- **Grid-reveal scaffold (was #5)** — built as an SVG layout grid drawing
  itself before the work panel content lands. Rejected: "get rid of this
  scaffold i dont like it." Also finished ~100ms *after* content was already
  visible, so it read as lag. Don't re-propose.

Taste signal from these plus the wave rework: the user wants subtle,
continuous, color/opacity-based motion — not added decorative elements,
bounce, or one-shot spectacle.

## Not built yet

### Full-bleed type transition between panels
A word scales past the viewport to wipe from the story into the work section.

```
thanks for stopping by, feel free to WORK
                                      ↓
                            W O R K
                    ↓
         [ scales past viewport, wipes ]
                    ↓
              ▓▓ work panel ▓▓
```

Louder and more one-shot than the wave — real spectacle rather than restraint.
Fires once per scroll, so it risks feeling repetitive on a page people scroll
back and forth through. Would need care to not fight the wave's calm.

### 4. Persistent hairline rule that responds to scroll
A single thin rule that stretches, kinks, or re-anchors between sections.
Dumbar leans hard on one graphic element carrying continuity across a whole
identity. Cheap to build, high cohesion payoff. Probably the best next one.

### 5. Grid-reveal on the work panel
The layout grid briefly draws itself before content lands — echoes the
trace-out box animation already on the work panel, so it would feel of-a-piece
with what's there.

### Organic shader blob for the now-playing / audio moment
Closest to the actual ChatGPT Advanced Voice work Dumbar did (they did the
shader development for it). Would suit the Spotify now-playing chip. Heaviest
lift of the set — needs WebGL or a canvas noise field.

### Kinetic type stack on section entry
Headings arrive as tightly-tracked lines settling from a slight overshoot,
staggered per line rather than per word. Reads as restraint. Somewhat
redundant with the read-head wave now that #1 is built.
