/* ---------------------------------------------------------------
   Scroll-linked word reveal — the reboot.studio technique.

   Native scrolling is disabled. Wheel / touch / keyboard input
   drives a virtual scroll value hard-clamped to [0, end] — you
   can never scroll above the start or past the end, no bounce.

   The scroll range is the story: words light up one by one, and the page
   hard-stops on the last one.
   --------------------------------------------------------------- */

/* Copy is a list of paragraphs. Tokens in <angle-brackets> render
   as inline animated elements instead of text — same trick reboot
   uses for its Rive icons. */
/* Words wrapped in *asterisks* get the Illini blue-orange gradient
   treatment when they activate. */
const PARAGRAPHS = [
  "hello hello! <wave> i'm michael, an ece student at uiuc ( *go* *illini!* )",
  "\nmy passions lie within <roller> with the occasional detour towards building whatever cool idea catches my curiosity.",
  "the past two summers, i've worked on the Sandstone ML team at <amazon> building infrastructure for foundational behavioral model training and a knowledge-graph powered recommendation engine to predict customer shopping activity.",
  "i got my start interning at various startups, building C# and devops tooling for cancer-detection scanners at <mh3d> then full-stack edtech products at <geni>",
  "along the way i co-founded <vault> a time-capsule app for preserving memories. it started as a way to capture summers with my friends and grew to over 1,000 users!",
  "currently, i'm part of the <crane> <fahnestock> at uiuc, using ai agents to modernize structural engineering design principles.",
  "thanks for stopping by, and feel free to take a look at my work :)",
  "want to connect? <cta>",
];

/* Virtual-scroll pixels per word — raise for a slower read. */
const SCROLL_PER_WORD = 63;

/* Dwell after the last word (in word-units) before the projects
   section starts sliding in. */
const TAIL_WORDS = 10;

/* Scroll easing (lower = floatier). Each frame closes this fraction of the
   remaining distance, so a smaller value means a longer, gliding coast after
   the wheel stops — the "on ice" feel — rather than arriving and stopping
   dead. Paired with a larger SCROLL_PER_WORD above, which sets the rate. */
const SMOOTHING = 0.062;

/* Below this many pixels of remaining distance we just land on the target.
   Kept tight so the long tail actually plays out instead of being cut short;
   too large a value would clip the glide right where it's most visible. */
const SCROLL_SNAP_EPS = 0.02;

const TOKEN_BUILDERS = {
  "<roller>": () => {
    const el = document.createElement("span");
    el.className = "word roller";
    const words = ["ai engineering", "ml infrastructure", "backend systems", "app development", "ui/ux design"];
    words.forEach((w, i) => {
      const item = document.createElement("span");
      item.className = "roller-word" + (i === 0 ? " is-visible" : "");
      item.textContent = w;
      el.appendChild(item);
    });
    let active = 0;
    let started = false;

    /* Every word's width is measured once, up front, and then only ever read
       out of this array. setWidth() used to read scrollWidth and write
       style.width back to back — a forced synchronous layout — and it was
       called from a 2.2s interval that runs for the entire session, so the
       page paid a layout flush plus a 400ms width reflow of the whole
       163-word paragraph every 2.2 seconds forever. The widths cannot change
       after build: the five strings are fixed and the font is loaded. */
    const items = el.querySelectorAll(".roller-word");
    const widths = new Array(items.length).fill(0);

    function measureAll() {
      for (let i = 0; i < items.length; i++) widths[i] = items[i].scrollWidth;
      applyWidth();
    }
    function applyWidth() {
      if (widths[active]) el.style.width = widths[active] + "px";
    }

    requestAnimationFrame(() => requestAnimationFrame(measureAll));
    const mo = new MutationObserver(() => {
      if (el.classList.contains("is-active") && !started) {
        started = true;
        mo.disconnect(); // nothing left to watch for
        applyWidth();
        setInterval(() => {
          items[active].classList.remove("is-visible");
          items[active].classList.add("is-out");
          const prev = active;
          active = (active + 1) % items.length;
          items[active].classList.add("is-visible");
          applyWidth();
          setTimeout(() => items[prev].classList.remove("is-out"), 400);
        }, 2200);
      }
    });
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return el;
  },
  "<wave>": () => {
    const el = document.createElement("span");
    el.className = "token token-wave";
    el.textContent = "\u{1F44B}";
    return el;
  },
  "<spark>": () => {
    const el = document.createElement("span");
    el.className = "token token-spark";
    el.innerHTML = '<svg width="0" height="0" viewBox="0 0 20 20"><polygon points="10,0 12,7 20,8 13,12 15,20 10,15 5,20 7,12 0,8 8,7" fill="currentColor"/></svg>';
    return el;
  },
  "<mh3d>": () => {
    const el = document.createElement("a");
    el.className = "word-link token-mh3d";
    el.href = "https://www.mh3dinc.com/";
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.innerHTML = '<span class="token token-scanner"><svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="2.5" width="19" height="19" rx="3" stroke="currentColor" stroke-width="1.4"/><circle class="scanner-blip" cx="12" cy="12" r="1.8" fill="currentColor" opacity="0.35"/><line class="scanner-beam" x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span> <span class="mh3d-logo">MH3D,</span>';
    return el;
  },
  "<geni>": () => {
    const el = document.createElement("a");
    el.className = "word-link token-geni";
    el.href = "https://geni.zone/";
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.innerHTML = '<span class="token token-cap"><svg viewBox="0 0 24 24" fill="none"><path d="M2 10l10-5 10 5-10 5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="9" r="1" fill="currentColor"/><path d="M6 12.5v4.5c0 1 2.7 3 6 3s6-2 6-3v-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line class="cap-tassel" x1="20" y1="10" x2="20" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle class="cap-bob" cx="20" cy="18.5" r="1" fill="currentColor"/></svg></span> <span class="geni-name">Geni.</span>';
    return el;
  },
  "<fahnestock>": () => {
    const el = document.createElement("a");
    el.className = "word-link token-fahnestock";
    el.href = "https://publish.illinois.edu/fahnestock/people/";
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.innerHTML = '<span class="fahnestock-name">Fahnestock Research Group</span>';
    return el;
  },
  "<amazon>": () => {
    const el = document.createElement("a");
    el.className = "word-link token-amazon";
    el.href = "https://www.amazon.com/";
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.innerHTML = '<span class="token token-truck"><svg viewBox="0 0 32 22" fill="none">'
      + '<g class="truck-body">'
      + '<rect x="2" y="5" width="16" height="10" rx="1.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
      + '<path d="M18 8h5.5l4 4v3h-9.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
      + '<line x1="18" y1="15" x2="18" y2="8" stroke="currentColor" stroke-width="1.2"/>'
      + '<path class="truck-smile" d="M5 10 C 8 13, 12 13, 15 9" stroke="#00d4ff" stroke-width="1.6" stroke-linecap="round" fill="none"/>'
      + '<polygon class="truck-smile-arrow" points="15.5,7.5 16.5,10.5 13.5,10" fill="#00d4ff"/>'
      + '<circle class="truck-wheel" cx="8" cy="17" r="2.4" stroke="currentColor" stroke-width="1.4" fill="var(--bg)"/>'
      + '<circle class="truck-wheel" cx="23" cy="17" r="2.4" stroke="currentColor" stroke-width="1.4" fill="var(--bg)"/>'
      + '<line class="truck-wheel-spoke" x1="8" y1="15.4" x2="8" y2="18.6" stroke="currentColor" stroke-width="1"/>'
      + '<line class="truck-wheel-spoke2" x1="23" y1="15.4" x2="23" y2="18.6" stroke="currentColor" stroke-width="1"/>'
      + '</g>'
      + '<g class="truck-lines" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">'
      + '<line x1="-4" y1="7" x2="-1" y2="7"/>'
      + '<line x1="-6" y1="11" x2="-2" y2="11"/>'
      + '</g>'
      + '</svg></span> <span class="amazon-name">Amazon,</span>';
    return el;
  },
  "<vault>": () => {
    const el = document.createElement("a");
    el.className = "word-link token-vault";
    el.href = "https://apps.apple.com/us/app/vault-safekeep-your-memories/id6590602325";
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.innerHTML = '<span class="token token-camera"><svg viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.5"/></svg></span> <span class="vault-name">vault,</span>';
    return el;
  },
  "<bars>": () => {
    const el = document.createElement("span");
    el.className = "token token-bars";
    for (let i = 0; i < 3; i++) el.appendChild(document.createElement("span"));
    return el;
  },
  "<box>": () => {
    const el = document.createElement("span");
    el.className = "token token-box";
    el.innerHTML = '<svg width="0" height="0" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12L2 7M12 12l10-5M12 12v10" stroke="currentColor" stroke-width="1.2"/></svg>';
    return el;
  },
  "<crane>": () => {
    const el = document.createElement("span");
    el.className = "token token-bridge";
    el.innerHTML = '<svg width="0" height="0" viewBox="0 0 48 24" fill="none">'
      + '<line class="bridge-deck" x1="1" y1="17" x2="47" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
      + '<line class="bridge-tower" x1="14" y1="17" x2="14" y2="4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
      + '<line class="bridge-tower" x1="34" y1="17" x2="34" y2="4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
      + '<line class="bridge-tower-brace" x1="12.5" y1="9" x2="15.5" y2="9" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>'
      + '<line class="bridge-tower-brace" x1="12.5" y1="13" x2="15.5" y2="13" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>'
      + '<line class="bridge-tower-brace" x1="32.5" y1="9" x2="35.5" y2="9" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>'
      + '<line class="bridge-tower-brace" x1="32.5" y1="13" x2="35.5" y2="13" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>'
      + '<path class="bridge-cable-main" d="M1 8 C6 15, 10 16, 14 4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" fill="none"/>'
      + '<path class="bridge-cable-main" d="M14 4 C20 17, 28 17, 34 4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" fill="none"/>'
      + '<path class="bridge-cable-main" d="M34 4 C38 16, 42 15, 47 8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" fill="none"/>'
      + '<line class="bridge-hanger" x1="20" y1="11.5" x2="20" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-hanger" x1="24" y1="13" x2="24" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-hanger" x1="28" y1="11.5" x2="28" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-hanger" x1="7" y1="12.5" x2="7" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-hanger" x1="41" y1="12.5" x2="41" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="4" y1="17" x2="7" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="7" y1="20" x2="10" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="10" y1="17" x2="13" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="13" y1="20" x2="16" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="16" y1="17" x2="19" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="19" y1="20" x2="22" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="22" y1="17" x2="25" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="25" y1="20" x2="28" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="28" y1="17" x2="31" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="31" y1="20" x2="34" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="34" y1="17" x2="37" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="37" y1="20" x2="40" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="40" y1="17" x2="43" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="1" y1="20" x2="4" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-truss" x1="43" y1="20" x2="47" y2="17" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-endcap" x1="1" y1="17" x2="1" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-endcap" x1="47" y1="17" x2="47" y2="20" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>'
      + '<line class="bridge-deck-lower" x1="1" y1="20" x2="47" y2="20" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>'
      + '</svg>';
    return el;
  },
  "<cta>": () => {
    const el = document.createElement("a");
    el.className = "cta";
    el.href = "mailto:mryang3108@gmail.com?subject=hello%20michael!";
    el.textContent = "send me a message!";
    return el;
  },
};

const prose = document.getElementById("prose");
const progressEl = document.getElementById("progress");
const navLogoEl = document.querySelector(".nav-logo");
const scrollHint = document.getElementById("scrollHint");

/* Build the DOM: one element per word, collected in order so the
   element's position in this array IS its activation index. */
const activatable = [];

PARAGRAPHS.forEach((paragraph, pIndex) => {
  if (pIndex > 0) {
    const gap = document.createElement("span");
    gap.className = "para-break";
    prose.appendChild(gap);
  }

  paragraph.split(/\s+/).filter(Boolean).forEach((word) => {
    const build = TOKEN_BUILDERS[word];
    const isIllini = !build && word.startsWith("*") && word.endsWith("*");
    const el = build ? build() : document.createElement("span");
    if (!build) {
      if (isIllini) {
        el.className = "word illini";
        el.textContent = word.slice(1, -1);
      } else {
        el.className = "word";
        el.textContent = word;
      }
    }
    prose.appendChild(el);
    prose.appendChild(document.createTextNode(" "));
    activatable.push(el);
  });
});

const totalWords = activatable.length;
const maxScroll = (totalWords + TAIL_WORDS) * SCROLL_PER_WORD;

/* ---- virtual scroll state ---- */
let target = 0; // where input says we should be (hard-clamped)
let current = 0; // smoothed position that actually renders

/* "hello hello!" (words 0-1) is always lit, even at 0% scroll. The
   render loop clamps the read head to this floor so it can never
   deactivate them. The wave token at index 2 stays scroll-gated. */
const PRE_ACTIVE = 2;

function applyDelta(delta) {
  target = Math.max(0, Math.min(maxScroll, target + delta));
}

/* ---- input ----
   The full-screen blog/gallery panels own the viewport while they're up:
   their own regions scroll natively, and nothing reaches the prose behind
   them. Anywhere else inside a panel, swallow the gesture rather than
   letting it move a page the reader can't see. */

/* The resume counts too. It isn't one of panels.js's sections — it has its
   own open/close handlers and doesn't do the is-sectioned chrome retreat —
   so window.fsPanelIsOpen() doesn't know about it. On desktop that never
   mattered, because the resume is sized to fit one screen with no scrolling.
   On a narrow viewport it becomes a full-screen sheet with an overflowing
   .resume-content, and without this a drag inside it fell through to the
   handlers below and scrolled the story behind the sheet instead. */
const resumePanelEl = document.getElementById("resumePanel");

/* Gated on the same breakpoint that turns the resume into a full-screen
   sheet. Above it the resume is a card in the right column with the story
   still visible beside it, and scrolling the story while it's open has always
   worked — so leave that alone. It's only once the sheet covers the viewport
   and gains its own scroller that it needs to own the gesture. */
const resumeSheet = window.matchMedia("(max-width: 720px)");

function resumeUp() {
  return resumeSheet.matches &&
    !!(resumePanelEl && resumePanelEl.classList.contains("is-open"));
}

function fsPanelUp() {
  const fs = typeof window.fsPanelIsOpen === "function" && window.fsPanelIsOpen();
  return fs || resumeUp();
}

function inPanelScroller(target) {
  return !!(
    target &&
    target.closest &&
    target.closest(".fs-scroll, .blog-article, .resume-content")
  );
}

/* An open project card can be taller than the space it sits in, so it owns
   the gesture while the pointer is inside it — otherwise the read-head would
   scroll away underneath a card you're still reading. */
function inProjectCard(target) {
  return !!(target && target.closest && target.closest(".desk-detail.is-visible"));
}

window.addEventListener(
  "wheel",
  (e) => {
    if (fsPanelUp()) {
      if (inPanelScroller(e.target)) return; // let the panel scroll itself
      e.preventDefault();
      return;
    }
    if (inProjectCard(e.target)) return; // the card scrolls itself
    e.preventDefault();
    applyDelta(e.deltaY);
  },
  { passive: false }
);

/* ---- touch ----
   The story is a little over 10,000 virtual pixels long. Mapped 1:1 to
   finger travel that is fifteen-plus full-height swipes on a phone, with a
   dead stop at the end of each one, so reading the page became a chore that
   the same page on a laptop isn't.

   Two changes. TOUCH_GAIN multiplies finger distance, which is a separate
   constant from SCROLL_PER_WORD on purpose: that one also sets the pace of
   the word reveal, so changing it would alter the reading rhythm on
   desktop too. And a release now carries momentum.

   The momentum is fed into `target`, never into `current`. SMOOTHING is
   what produces the glide, and it owns the easing; pushing a decaying
   velocity into `target` lets the existing pipeline smooth it exactly as it
   smooths a wheel gesture, so the motion keeps its character. Writing
   velocity straight into `current` would stack a second decay curve on top
   of the first and the page would feel different on touch than on a
   trackpad. */
const TOUCH_GAIN = 2.2;
const FLING_DECAY = 0.94;   // per frame; ~0.5s of coast
const FLING_MIN = 0.4;      // px/frame below which it's over

let touchY = null;
let touchT = 0;
let touchVel = 0; // px per ms, signed the same way as a wheel delta
let fling = 0;    // px per frame, consumed by the render loop

window.addEventListener(
  "touchstart",
  (e) => {
    touchY = e.touches[0].clientY;
    touchT = performance.now();
    touchVel = 0;
    fling = 0; // a new touch cancels the previous coast
  },
  { passive: true }
);
window.addEventListener(
  "touchmove",
  (e) => {
    if (touchY === null) return;
    if (fsPanelUp()) {
      if (inPanelScroller(e.target)) return; // let the panel scroll itself
      e.preventDefault();
      return;
    }
    if (inProjectCard(e.target)) return; // the card scrolls itself
    e.preventDefault();
    const y = e.touches[0].clientY;
    const now = performance.now();
    const dy = (touchY - y) * TOUCH_GAIN;
    applyDelta(dy);

    /* Blend rather than replace, so one jittery sample near the release
       can't decide the whole throw. */
    const dt = Math.max(1, now - touchT);
    touchVel = touchVel * 0.7 + (dy / dt) * 0.3;

    touchY = y;
    touchT = now;
  },
  { passive: false }
);

function endTouch() {
  if (touchY === null) return;
  touchY = null;
  // stale velocity from a finger that stopped before lifting isn't a throw
  if (performance.now() - touchT < 90) fling = touchVel * 16;
  touchVel = 0;
}
window.addEventListener("touchend", endTouch);
/* Without this an interrupted gesture — a system edge swipe, a call coming
   in — leaves touchY set, and the next touchmove treats the gap between two
   unrelated positions as one enormous drag. */
window.addEventListener("touchcancel", endTouch);

const KEY_DELTAS = {
  ArrowDown: 80,
  ArrowUp: -80,
  PageDown: 420,
  PageUp: -420,
  " ": 420,
};
window.addEventListener("keydown", (e) => {
  // arrows/space belong to the open panel, which scrolls natively
  if (fsPanelUp()) return;
  if (e.key === "Home") {
    e.preventDefault();
    target = 0;
  } else if (e.key === "End") {
    e.preventDefault();
    target = maxScroll;
  } else if (KEY_DELTAS[e.key] !== undefined) {
    e.preventDefault();
    applyDelta(KEY_DELTAS[e.key]);
  }
});


/* ---- odometer progress counter ----
   Each column's strip is 0-9 repeated REPEATS times, so a digit can roll
   past the 9/0 boundary in either direction instead of snapping back.
   `_ticks` is the absolute cell index currently shown; rising values roll
   the strip down, falling values roll it up. Because cell N and cell N+10
   are the same glyph, we silently rebase _ticks toward the middle of the
   strip once each roll settles — invisible, and it means the strip can
   never run out of runway no matter how much you scroll. */
const REPEATS = 12;
const CELLS = REPEATS * 10;
const HOME = Math.floor(REPEATS / 2) * 10; // middle of the strip
const SAFE = 20; // keep _ticks this far from either end
const odometer = { digits: [], lastValue: null };

function buildOdometerColumn(digit) {
  const col = document.createElement("span");
  col.className = "odo-col";
  const strip = document.createElement("span");
  strip.className = "odo-strip";
  for (let r = 0; r < REPEATS; r++) {
    for (let n = 0; n <= 9; n++) {
      const cell = document.createElement("span");
      cell.className = "odo-cell";
      cell.textContent = n;
      strip.appendChild(cell);
    }
  }
  col.appendChild(strip);
  col._strip = strip;
  col._ticks = HOME + digit;
  strip.style.transform = `translateY(${-(col._ticks / CELLS) * 100}%)`;
  return col;
}

/* Shift a column by `delta` cells (always a multiple of 10) without any
   visible change. The strip repeats every 10 cells, so if we move the
   *currently rendered* position and the stored tick count by the same
   multiple of 10, the glyphs land exactly where they were — even mid-roll.
   This is what keeps the strip from ever running off its end. */
function rebaseColumn(col, delta) {
  const strip = col._strip;
  const cell = strip.offsetHeight / CELLS;
  const y = new DOMMatrixReadOnly(getComputedStyle(strip).transform).m42;

  strip.style.transition = "none";
  strip.style.transform = `translateY(${y + delta * cell}px)`;
  void strip.offsetHeight; // flush so the restored transition ignores this jump
  strip.style.transition = "";
  col._ticks -= delta;
}

function renderOdometer(value) {
  if (value === odometer.lastValue) return;
  const rising = odometer.lastValue === null || value > odometer.lastValue;
  odometer.lastValue = value;

  const str = String(value);
  const needed = str.length;

  // grow/shrink the pool of digit columns to match the number's width.
  // new columns are seeded on their target digit so they fade in correct;
  // shrinking drops the *leading* column, since that's the place value
  // that went away (100 -> 99 loses the hundreds, not the ones).
  while (odometer.digits.length < needed) {
    const col = buildOdometerColumn(Number(str[odometer.digits.length]));
    progressEl.insertBefore(col, progressEl.querySelector(".odo-pct"));
    odometer.digits.push(col);
  }
  while (odometer.digits.length > needed) {
    odometer.digits.shift().remove();
  }

  for (let i = 0; i < needed; i++) {
    const digit = Number(str[i]);
    const col = odometer.digits[i];
    const shown = ((col._ticks % 10) + 10) % 10;
    if (shown === digit) continue;

    // travel in the direction the number is moving, so digits never
    // reverse against the scroll
    const step = rising
      ? (digit - shown + 10) % 10
      : -(((shown - digit + 10) % 10));

    // if this step would take us near either end of the strip, slide the
    // whole thing back toward the middle first (invisible, see above)
    const next = col._ticks + step;
    if (next < SAFE || next > CELLS - SAFE) {
      rebaseColumn(col, Math.round((col._ticks - HOME) / 10) * 10);
    }

    col._ticks += step;
    col._strip.style.transform = `translateY(${-(col._ticks / CELLS) * 100}%)`;
  }
}

/* seed the fixed "%" glyph once */
(function initOdometer() {
  progressEl.textContent = "";
  const pct = document.createElement("span");
  pct.className = "odo-pct";
  pct.textContent = "%";
  progressEl.appendChild(pct);
})();

/* ---- the read-head wave ----
   Each word's ink is a function of how far it sits behind or ahead of the
   fractional read head, rather than a binary is-active flip. The only
   thing that changes is colour — nothing moves, nothing blurs — so the
   sentence reads as one continuous gradient of attention sweeping through
   it instead of words clicking on one at a time.

   Only words inside the band get written each frame — the ones outside are
   clamped to their settled/waiting state exactly once. Otherwise this
   would touch every word in the document on every frame. */
const WAVE_LEAD = 3.2;   // words ahead of the head still coming up to ink
const WAVE_TRAIL = 1.1;  // words behind it still settling

/* At rest the page should show *only* "hello hello!" — none of the words
   after it pre-inked. Since the head starts at PRE_ACTIVE, its lead would
   otherwise light the next few words before you've scrolled at all. This
   gate fades the lead in over the first word of scroll, so the ramp
   appears as a consequence of scrolling rather than being there already. */
const WAVE_INTRO = SCROLL_PER_WORD;

/* smootherstep — zero first *and* second derivative at both ends, so a
   word entering or leaving the band has no visible kink */
function smootherstep(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/* remember which words we've already parked, so we don't rewrite styles
   for hundreds of settled words every frame */
let waveFrom = 0;
let waveTo = -1;

function paintWave(head, lead) {
  // band of words currently in transition
  const lo = Math.max(0, Math.floor(head - WAVE_TRAIL) - 1);
  const hi = Math.min(activatable.length - 1, Math.ceil(head + lead) + 1);

  // park anything that fell out of the band since last frame: words the
  // head has passed settle to 1, words ahead of it reset to 0
  for (let i = waveFrom; i <= waveTo; i++) {
    if (i >= lo && i <= hi) continue;
    const el = activatable[i];
    if (!el) continue;
    const settled = i < lo ? 1 : 0;
    el.style.setProperty("--w", settled);
    el.classList.toggle("is-active", settled === 1);
  }

  for (let i = lo; i <= hi; i++) {
    const el = activatable[i];
    if (!el) continue;
    // distance from the head, mapped through the falloff
    const d = head - i;
    const v = smootherstep((d + lead) / (lead + WAVE_TRAIL));
    el.style.setProperty("--w", v.toFixed(4));
    // keep is-active as the semantic gate the tokens/links already hook
    el.classList.toggle("is-active", d > 0);
  }

  waveFrom = lo;
  waveTo = hi;
}

/* ---- render loop ---- */
/* A settled page shouldn't be writing anything. Once the scroll lands, the
   head and the lead stop changing, and repainting the same band of words every
   frame is pure invalidation — worth skipping in its own right, and more so
   while a section is animating over the top. */
let lastPaintedHead = -1;
let lastPaintedLead = -1;
let lastLogoFill = -1;

function frame() {
  /* Coast after a touch release. This moves `target`, so the smoothing below
     still owns the visual easing — see the note by TOUCH_GAIN. */
  if (fling !== 0) {
    applyDelta(fling);
    fling *= FLING_DECAY;
    if (Math.abs(fling) < FLING_MIN) fling = 0;
  }

  current += (target - current) * SMOOTHING;
  if (Math.abs(target - current) < SCROLL_SNAP_EPS) current = target;

  /* Phase 1: story progress -> a *fractional* read head. We keep the
     fraction (rather than flooring to a word index) so each word can be
     inked by its distance to the head — that's what turns a row of
     independent on/off flips into one continuous sweep. */
  const storyProgress = Math.min(current / maxScroll, 1);
  const head = Math.max(
    Math.min(storyProgress * (totalWords + TAIL_WORDS), totalWords),
    PRE_ACTIVE
  );

  /* Ease the lead in over the first word of scroll. At current == 0 the
     lead is 0, so the falloff collapses to a hard edge at the head and
     nothing past "hello hello!" picks up any ink. */
  const lead = WAVE_LEAD * smootherstep(current / WAVE_INTRO);
  if (head !== lastPaintedHead || lead !== lastPaintedLead) {
    paintWave(head, lead);
    lastPaintedHead = head;
    lastPaintedLead = lead;
  }

  const progress = maxScroll > 0 ? storyProgress : 1;
  renderOdometer(Math.round(progress * 100));
  const logoFill = progress * 100;
  if (logoFill !== lastLogoFill) {
    navLogoEl.style.setProperty("--logo-fill", logoFill + "%");
    lastLogoFill = logoFill;
  }
  scrollHint.classList.toggle("is-hidden", current > 40);

  /* Quiet the globe once reading is underway so it stops competing for
     attention: full colour at the top of the page, greyscale from the moment
     you start reading, and colour again only under the cursor. Same threshold
     as the scroll hint, so the cue leaving and the globe settling back read
     as one gesture. */
  if (typeof window.sphereQuiet === "function") window.sphereQuiet(current > 40);

  /* The ramblings and gallery sections are the reward for finishing the
     read — their buttons rise into view over the last stretch of it.

     typeof, not truthiness. panels.js owns this function but it is the last
     script on the page, and this loop starts at the end of main.js — so the
     first frame can land before panels.js has run. A plain `if (window.x)`
     check passed anyway, because an element with id="endActions" makes the
     browser publish that div as window.endActions, which is very truthy and
     not at all callable. Calling it threw, and a throw in here used to kill
     the loop for the rest of the session (see the catch below). */
  if (typeof window.updateEndActions === "function") {
    window.updateEndActions(storyProgress);
  }

  paintProse(storyProgress);
}

/* The loop is the scroll engine: current only ever moves in frame(), so if
   this chain ever stops, the page still renders and still accepts wheel and
   touch input — target keeps climbing — but nothing visibly moves again
   until a reload. That failure mode is indistinguishable from "the site is
   broken", so re-arming is unconditional and one bad frame costs one frame
   rather than the session. */
let frameErrLogged = false;

function loop() {
  try {
    frame();
  } catch (err) {
    if (!frameErrLogged) {
      frameErrLogged = true; // once per session; don't flood the console
      console.error("scroll frame failed:", err);
    }
  }
  requestAnimationFrame(loop);
}

/* ---- subtle 3D glass tilt toward cursor ----
   Folded into the scroll loop rather than running a second always-on
   requestAnimationFrame of its own. It writes one transform, and it needs
   to be sequenced with the rest of the frame's writes anyway; two
   independent loops just meant two callbacks and two chances to land either
   side of a style flush.

   It also does nothing at all until the cursor has actually moved, which on
   a touch device is never — the old loop ran for the whole session on
   phones to write a transform that was always the identity. */
const proseEl = document.getElementById("prose");
let mouseX = 0.5, mouseY = 0.5;
let tiltReady = false;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX / window.innerWidth;
  mouseY = e.clientY / window.innerHeight;
  tiltReady = true;
}, { passive: true });

/* ---- the read-head slide (phones) ----
   On a desktop the whole story fits the screen and the scroll only inks it.
   A phone doesn't have the height for that: the type has to be big enough to
   read in a hand, and at that size the paragraph is taller than the screen.
   Rather than shrink the type until it fits — which is where the last few
   passes kept ending up — the block rides upward as the read head advances,
   so the words being inked are always the words in view. The scroll is the
   same virtual scroll; this is one more thing it drives.

   slideMax is the overflow and nothing more, so a screen the story already
   fits gets 0 and behaves exactly as before. That's why desktop needs no
   special case — it simply never overflows. */
const viewportEl = document.querySelector(".viewport");
const phoneLayout = window.matchMedia("(max-width: 720px)");
let slideMax = 0;

function measureSlide() {
  /* Only where .viewport lays the story out from the top. On desktop it is
     centred, so translating from a centred start would ride the first line
     up off the screen rather than reveal the last. */
  if (!phoneLayout.matches || !viewportEl) {
    slideMax = 0;
    return;
  }
  const cs = getComputedStyle(viewportEl);
  const avail = viewportEl.clientHeight -
    parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  slideMax = Math.max(0, proseEl.offsetHeight - avail);
}

/* Measured, not computed per frame: offsetHeight forces layout, and the
   answer only changes when the box does. Fonts land after first paint and
   reflow the paragraph, which is the one that bites if you only measure on
   load. */
measureSlide();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(measureSlide);
}
let measureT = 0;
window.addEventListener("resize", () => {
  clearTimeout(measureT);
  measureT = setTimeout(measureSlide, 150);
});
phoneLayout.addEventListener("change", measureSlide);

/* One writer for this element's transform, because there are now two things
   with an opinion about it and the last one to write would otherwise erase
   the other. Still only writes when the string actually changes: this used
   to set a new transform on the largest layer on the page every single
   frame, including while a full-screen section animated over it. */
let lastTransform = "";

function paintProse(progress) {
  let t = "";
  if (slideMax > 0) {
    t = `translate3d(0, ${(-slideMax * progress).toFixed(1)}px, 0)`;
  }
  // measured-slow hardware doesn't spend frame budget on ±1deg
  if (tiltReady && !document.documentElement.classList.contains("perf-low")) {
    const rotateY = (mouseX - 0.5) * 2;
    const rotateX = (0.5 - mouseY) * 2;
    t += ` perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }
  if (t !== lastTransform) {
    proseEl.style.transform = t;
    lastTransform = t;
  }
}

requestAnimationFrame(loop);
