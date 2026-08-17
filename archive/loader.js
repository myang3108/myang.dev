/* ================================================================
   Intro loader — glyph-matrix wordmark
   ----------------------------------------------------------------
   "myang.dev" is rendered as a halftone: an offscreen canvas one
   pixel per grid cell gives us per-cell coverage of the letterforms,
   and each covered cell draws a small glyph sized/inked by that
   coverage. Cells outside the letters occasionally draw a very faint
   glyph, which is what reads as grain in the reference.

   Three phases: resolve in (left-to-right sweep with per-cell noise
   so it grains in rather than wiping), hold until the page has
   actually loaded, then dissolve out.
   ================================================================ */
(function loader() {
  const overlay = document.getElementById("loader");
  const canvas = document.getElementById("loaderCanvas");
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TEXT = "myang.dev";

  /* Deliberately a ~2-second sequence: grain in, hold on the resolved
     wordmark, then dissolve — fully gone right around TOTAL_MS. */
  const IN_MS = reduce ? 260 : 800;    // resolve in
  const OUT_MS = reduce ? 200 : 520;   // dissolve out
  const TOTAL_MS = reduce ? 700 : 2000; // whole thing, in to gone
  const DISSOLVE_AT = TOTAL_MS - OUT_MS; // when the dissolve begins

  const FONT = '700 100px -apple-system, BlinkMacSystemFont, "Segoe UI", ' +
    'Roboto, "Helvetica Neue", Arial, sans-serif';

  let cols = 0, rows = 0, cell = 0;
  let coverage = null;  // Float32Array, one entry per cell (0..1)
  let glyphAt = null;   // Uint8Array, which character index inked each cell
  let noise = null;     // Float32Array, stable per-cell randomness
  let ink = "#232323";
  /* Cells above this draw a faint off-letter glyph — the grain. It's a
     share of the grid, so the finer phone grid (below) would have drawn
     twice as many of them for the same look; build() lowers the share to
     keep the count, and the cost, where it was. */
  let grainCut = 0.93;

  /* ---- glyph atlas ----
     draw() used to build a font shorthand string and assign ctx.font for
     every drawn cell of every frame — order 2-3k font re-parses per frame,
     which was most of the loader's frame cost. Each character is instead
     rasterized once into an atlas, and a cell is a scaled drawImage out of
     it: no font work at all in the hot loop.

     The atlas is sized from the largest glyph a cell will ever draw, times a
     2x supersample, so the blit only ever downscales by about two. That
     ratio matters: a fixed 96px atlas scaled down to a ~10px cell visibly
     thinned the strokes against what fillText produced. */
  const ATLAS_SS = 2;
  let atlasBox = 0, atlasFont = 0, atlas = null;

  function buildAtlas(maxGlyphPx) {
    atlasFont = Math.max(8, Math.ceil(maxGlyphPx * ATLAS_SS));
    atlasBox = Math.ceil(atlasFont * 1.4); // room for ascenders/descenders
    atlas = document.createElement("canvas");
    atlas.width = atlasBox * TEXT.length;
    atlas.height = atlasBox;
    const ac = atlas.getContext("2d");
    ac.textAlign = "center";
    ac.textBaseline = "middle";
    ac.font = FONT.replace("100px", atlasFont + "px");
    ac.fillStyle = ink;
    for (let i = 0; i < TEXT.length; i++) {
      const ch = TEXT[i];
      if (ch === " ") continue;
      ac.fillText(ch, i * atlasBox + atlasBox / 2, atlasBox / 2);
    }
  }

  function build() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    /* Read style before touching the canvas: this used to sit between the
       four canvas-size writes below, so it forced a style recalc in the
       middle of reallocating the backing store. */
    ink = getComputedStyle(document.documentElement)
      .getPropertyValue("--ink").trim() || "#232323";

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = "high";

    /* The halftone is only legible if each letter gets enough cells across
       it, and that count is what the phone was starving. min(w, h) on a
       390x844 phone is the *width*, so the cell came out at the 6px floor,
       leaving 65 columns for the whole screen and about five per character —
       against roughly twelve on a desktop, which is why "myang.dev" arrived
       as a jumble of glyph blobs rather than a wordmark.

       Below 720px the cell is derived from the width alone and allowed to go
       finer, which puts the per-character count back in the same range. */
    const narrow = w < 720;
    cell = narrow
      ? Math.max(4, Math.round(w / 98))
      : Math.max(6, Math.round(Math.min(w, h) / 86));
    cols = Math.ceil(w / cell);
    rows = Math.ceil(h / cell);
    grainCut = narrow ? 0.965 : 0.93;

    // largest a covered cell's glyph ever gets: cov and local both at 1
    buildAtlas(cell * (0.74 + 0.44));

    /* Mask: render at 4x resolution then box-downsample to one value per
       cell. The extra resolution preserves thin counters (the hole in "e")
       that a 1px-per-cell render anti-aliases shut.

       The whole wordmark is drawn in a single pass and read back once. This
       used to clear, redraw, and getImageData once per character — nine
       full-canvas GPU->CPU readbacks (~7.5MB at 1440x900) and nine
       downsample passes (~1.9M iterations), all synchronous before first
       paint. Characters never overlap horizontally, so which glyph inked a
       cell is just which pen run its column falls in — no per-character
       render is needed to work that out. */
    const SS = 4; // supersampling factor
    const mW = cols * SS, mH = rows * SS;
    const m = document.createElement("canvas");
    m.width = mW;
    m.height = mH;
    const mc = m.getContext("2d");
    mc.textBaseline = "middle";
    mc.textAlign = "left";

    /* Size the whole word to ~74% of the width, then place chars by run.
       A phone gets 86%: the margins either side are what a wide screen has
       to spare, and here they are the difference between nine legible
       characters and nine smudges. */
    mc.font = FONT;
    const base = mc.measureText(TEXT).width || 1;
    const target = mW * (narrow ? 0.86 : 0.74);
    const size = Math.max(6, (100 * target) / base);
    const sizedFont = FONT.replace("100px", size + "px");
    mc.font = sizedFont;

    const fullW = mc.measureText(TEXT).width;
    let penX = (mW - fullW) / 2;
    const midY = mH / 2;

    const n = cols * rows;
    coverage = new Float32Array(n);
    glyphAt = new Uint8Array(n); // index into TEXT of the owning glyph

    // one pass: every glyph onto the same mask, recording its pen run
    const runStart = new Float32Array(TEXT.length);
    const runEnd = new Float32Array(TEXT.length);
    mc.fillStyle = "#fff";
    for (let ci = 0; ci < TEXT.length; ci++) {
      const ch = TEXT[ci];
      const chW = mc.measureText(ch).width;
      if (ch === ".") {
        const rad = size * 0.14;
        mc.beginPath();
        mc.arc(penX + chW / 2, midY + size * 0.32, rad, 0, Math.PI * 2);
        mc.fill();
      } else {
        mc.fillText(ch, penX, midY);
      }
      runStart[ci] = penX;
      runEnd[ci] = penX + chW;
      penX += chW;
    }

    const data = mc.getImageData(0, 0, mW, mH).data; // one readback

    // which glyph owns each column, resolved once per column not per cell
    const colGlyph = new Uint8Array(cols);
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * SS;
      let g = 0;
      for (let ci = 0; ci < TEXT.length; ci++) {
        if (cx >= runStart[ci]) g = ci;
        if (cx < runEnd[ci]) break;
      }
      colGlyph[c] = g;
    }

    // box-downsample: average the SS×SS block for each cell
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0;
        for (let sy = 0; sy < SS; sy++) {
          const rowOff = ((r * SS + sy) * mW + c * SS) * 4;
          for (let sx = 0; sx < SS; sx++) {
            sum += data[rowOff + sx * 4 + 3];
          }
        }
        const i = r * cols + c;
        coverage[i] = sum / (SS * SS * 255);
        glyphAt[i] = colGlyph[c];
      }
    }

    if (!noise || noise.length !== n) {
      noise = new Float32Array(n);
      for (let i = 0; i < n; i++) noise[i] = Math.random();
    }
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* phase: 'in' | 'out'; p is 0..1 within that phase */
  function draw(phase, p) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const globalOut = phase === "out" ? p : 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const cov = coverage[i];
        const rnd = noise[i];

        // sweep left-to-right, roughened per cell so it grains in
        const delay = (c / cols) * 0.55 + rnd * 0.3;
        let local = phase === "in"
          ? clamp01((p - delay) / 0.42)
          : 1;
        local = easeOut(local);

        // dissolve: cells leave in a different, noise-led order
        if (globalOut > 0) {
          local *= clamp01(1 - (globalOut - rnd * 0.35) / 0.5);
        }
        if (local <= 0.001) continue;

        const x = c * cell + cell / 2;
        const y = r * cell + cell / 2;

        let alpha, size, glyphIdx;
        if (cov > 0.06) {
          // lift low-coverage cells so thin glyphs (. e v) read as solid
          // as the heavy ones — keeps the whole wordmark an even weight
          alpha = Math.min(1, 0.5 + cov * 0.8) * local;
          size = cell * (0.74 + 0.44 * Math.min(1, cov)) * (0.7 + 0.3 * local);
          // each letter is built from copies of itself
          glyphIdx = glyphAt[i];
        } else if (rnd > grainCut) {
          // sparse faint marks outside the letterforms — the grain.
          // borrow the letter from the nearest column so it stays on-theme
          alpha = 0.1 * local;
          size = cell * 0.5;
          glyphIdx = Math.min(TEXT.length - 1, Math.floor((c / cols) * TEXT.length));
        } else {
          continue;
        }
        if (TEXT[glyphIdx] === " ") continue;

        /* Scaled blit out of the atlas instead of ctx.font + fillText. The
           atlas holds the glyph at atlasFont inside an atlasBox square,
           drawn centred, so reproducing a fillText at font-size `size`
           centred on (x, y) is the same box scaled by size/atlasFont. */
        const box = atlasBox * (size / atlasFont);
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          atlas,
          glyphIdx * atlasBox, 0, atlasBox, atlasBox,
          x - box / 2, y - box / 2, box, box
        );
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- run ---- */
  build();

  /* Rebuild on resize, but only while the loader is still on screen — and
     never straight off the event. build() is the most expensive function on
     the page, and an unthrottled resize ran the whole thing synchronously
     per event. A mobile URL bar collapsing fires resize too, which is why
     height-only changes under URLBAR_SLOP are ignored outright: the viewport
     hasn't meaningfully changed, so the halftone doesn't need re-deriving. */
  let live = true;
  const URLBAR_SLOP = 120;
  let lastW = window.innerWidth, lastH = window.innerHeight;
  let resizeT = 0;
  window.addEventListener("resize", () => {
    if (!live) return;
    const w = window.innerWidth, h = window.innerHeight;
    if (w === lastW && Math.abs(h - lastH) < URLBAR_SLOP) return;
    lastW = w;
    lastH = h;
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (live) build(); }, 150);
  });

  const start = performance.now();

  /* ---- capability probe ------------------------------------------
     The intro is a couple of seconds of continuous canvas animation that
     every visitor watches, which makes it a free benchmark: if frames are
     landing late here, they will land late in the story too. The median of
     the sampled deltas decides it — a median rather than a mean so one
     garbage-collection spike doesn't condemn a fast machine.

     What html.perf-low switches is in styles.css, and it is deliberately
     limited to render *quality* (blur radius, shadow spread, animation of
     detail too small to read). No duration, easing or delay changes, and
     nothing starts or stops moving, so the choreography is the same
     everywhere — only the cost of drawing it differs.

     Core count and device memory are priors rather than the decision: they
     are coarse and often wrong (a throttled 8-core laptop reports 8), so
     they only pre-arm the flag for hardware that is very likely to struggle,
     and the measured frame times can still clear it. */
  const deltas = [];
  let probeLast = 0;
  let probeDone = false;

  function tierPriors() {
    const cores = navigator.hardwareConcurrency || 8;
    const mem = navigator.deviceMemory || 8;
    return cores <= 4 || mem <= 4;
  }

  function settleTier() {
    if (probeDone) return;
    probeDone = true;
    if (deltas.length < 12) {
      // too few samples to judge; fall back to the priors alone
      if (tierPriors()) document.documentElement.classList.add("perf-low");
      return;
    }
    const sorted = deltas.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    /* 22ms: comfortably past a 16.7ms budget, but not so tight that a
       120Hz display or a single slow frame trips it. */
    const slow = median > 22 || (tierPriors() && median > 18);
    document.documentElement.classList.toggle("perf-low", slow);
    window.__perfTier = { median: median, low: slow };
  }

  /* Time-driven: the loader always runs for TOTAL_MS regardless of how
     fast the page itself loads, so the intro is a deliberate beat rather
     than a flicker on a warm cache. */
  function frame(now) {
    const t = now - start;

    /* Sample the middle of the run: the first few frames carry first-paint
       and font work that isn't representative, and the tail overlaps the
       dissolve. */
    if (t > 300 && t < DISSOLVE_AT) {
      if (probeLast) deltas.push(now - probeLast);
      probeLast = now;
    }

    if (t < DISSOLVE_AT) {
      draw("in", clamp01(t / IN_MS));
      requestAnimationFrame(frame);
      return;
    }

    settleTier();

    const op = clamp01((t - DISSOLVE_AT) / OUT_MS);
    draw("out", op);
    overlay.style.opacity = String(1 - easeOut(op));

    if (op >= 1) {
      live = false;
      clearTimeout(resizeT);
      overlay.remove();
      document.documentElement.classList.remove("is-loading");
      return;
    }
    requestAnimationFrame(frame);
  }

  document.documentElement.classList.add("is-loading");
  requestAnimationFrame(frame);
})();
