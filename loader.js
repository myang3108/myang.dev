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

  function build() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ink = getComputedStyle(document.documentElement)
      .getPropertyValue("--ink").trim() || "#232323";

    cell = Math.max(6, Math.round(Math.min(w, h) / 86));
    cols = Math.ceil(w / cell);
    rows = Math.ceil(h / cell);

    /* Mask: render at 4x resolution then box-downsample to one value per
       cell. The extra resolution preserves thin counters (the hole in "e")
       that a 1px-per-cell render anti-aliases shut. */
    const SS = 4; // supersampling factor
    const mW = cols * SS, mH = rows * SS;
    const m = document.createElement("canvas");
    m.width = mW;
    m.height = mH;
    const mc = m.getContext("2d");
    mc.textBaseline = "middle";
    mc.textAlign = "left";

    // size the whole word to ~74% of the width, then place chars by run
    mc.font = FONT;
    const base = mc.measureText(TEXT).width || 1;
    const target = mW * 0.74;
    const size = Math.max(6, (100 * target) / base);
    const sizedFont = FONT.replace("100px", size + "px");
    mc.font = sizedFont;

    const fullW = mc.measureText(TEXT).width;
    let penX = (mW - fullW) / 2;
    const midY = mH / 2;

    const n = cols * rows;
    coverage = new Float32Array(n);
    glyphAt = new Uint8Array(n); // index into TEXT of the owning glyph

    for (let ci = 0; ci < TEXT.length; ci++) {
      const ch = TEXT[ci];
      const chW = mc.measureText(ch).width;
      mc.clearRect(0, 0, mW, mH);
      mc.fillStyle = "#fff";
      if (ch === ".") {
        const rad = size * 0.14;
        mc.beginPath();
        mc.arc(penX + chW / 2, midY + size * 0.32, rad, 0, Math.PI * 2);
        mc.fill();
      } else {
        mc.fillText(ch, penX, midY);
      }
      const data = mc.getImageData(0, 0, mW, mH).data;
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
          const a = sum / (SS * SS * 255);
          const i = r * cols + c;
          if (a > coverage[i]) { coverage[i] = a; glyphAt[i] = ci; }
        }
      }
      penX += chW;
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
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

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

        let alpha, size, glyph;
        if (cov > 0.06) {
          // lift low-coverage cells so thin glyphs (. e v) read as solid
          // as the heavy ones — keeps the whole wordmark an even weight
          alpha = Math.min(1, 0.5 + cov * 0.8) * local;
          size = cell * (0.74 + 0.44 * Math.min(1, cov)) * (0.7 + 0.3 * local);
          // each letter is built from copies of itself
          glyph = TEXT[glyphAt[i]];
        } else if (rnd > 0.93) {
          // sparse faint marks outside the letterforms — the grain.
          // borrow the letter from the nearest column so it stays on-theme
          alpha = 0.1 * local;
          size = cell * 0.5;
          const idx = Math.min(TEXT.length - 1, Math.floor((c / cols) * TEXT.length));
          glyph = TEXT[idx];
        } else {
          continue;
        }
        if (glyph === " ") continue;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = ink;
        ctx.font = "700 " + size.toFixed(1) + 'px -apple-system, ' +
          'BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        ctx.fillText(glyph, x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- run ---- */
  build();

  // rebuild on resize, but only while the loader is still on screen
  let live = true;
  window.addEventListener("resize", () => { if (live) build(); });

  const start = performance.now();

  /* Time-driven: the loader always runs for TOTAL_MS regardless of how
     fast the page itself loads, so the intro is a deliberate beat rather
     than a flicker on a warm cache. */
  function frame(now) {
    const t = now - start;

    if (t < DISSOLVE_AT) {
      draw("in", clamp01(t / IN_MS));
      requestAnimationFrame(frame);
      return;
    }

    const op = clamp01((t - DISSOLVE_AT) / OUT_MS);
    draw("out", op);
    overlay.style.opacity = String(1 - easeOut(op));

    if (op >= 1) {
      live = false;
      overlay.remove();
      document.documentElement.classList.remove("is-loading");
      return;
    }
    requestAnimationFrame(frame);
  }

  document.documentElement.classList.add("is-loading");
  requestAnimationFrame(frame);
})();
