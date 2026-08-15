/* ================================================================
   Project globe — the little objects orbiting the right column
   ----------------------------------------------------------------
   Each project is one tile on a Fibonacci sphere (even distribution, no
   clustering at the poles), drawn as a *billboarded* tile: positioned in
   3D but never rotated, so every drawing stays flat and upright facing
   the viewer. That's what keeps the clean graphic read instead of a
   warped-texture look — and it means plain DOM + CSS transforms are
   enough, no WebGL dependency.

   Motion: a slow constant drift by default; grabbing it hands control to
   the pointer, and letting go decays the throw back down to the ambient
   drift.

     drag     anywhere on the globe that isn't an object spins it
     hover    an object pulls focus: the rest of the globe greys out and
              goes soft, the drift holds still, and the project's name
              rises in underneath the object
     click    that object flies to the centre and opens its card

   The drawings themselves are cloned out of the inert #deskTemplate in
   index.html; the data is in projects.js.
   ================================================================ */
(function projectGlobe() {
  const root = document.getElementById("sphere");
  if (!root) return;

  const stage = root.querySelector(".sphere-stage");
  if (!stage) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- what sits on the globe ---------------------------------
     The projects, and nothing else. Data and artwork frames live in
     projects.js; the drawings themselves are in the #deskTemplate
     <template> in index.html, which never renders — each tile clones one
     <g> out of it. */
  const PROJECTS = window.PROJECTS || {};
  const PROJECT_KEYS = Object.keys(PROJECTS);
  const template = document.getElementById("deskTemplate");
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* Nine tiles, so each one can be big: this is a constellation of objects
     you're meant to pick from, not a dense volume you look at. */
  const COUNT = PROJECT_KEYS.length;
  /* Tile edge in px at unit depth. Bigger than the drawings look, because
     each object's frame is a square with breathing room around the art (see
     projects.js) — the drawing itself lands at roughly 80% of this. */
  const ICON_SIZE = 100;
  const RADIUS = 208;      // sphere radius in px
  /* Scaled with RADIUS so the perspective distortion stays constant as the
     globe grows — must match the CSS perspective. */
  const PERSPECTIVE = 820;
  const DRIFT = reduce ? 0 : 0.000435; // ambient radians/ms
  /* Keeps tiles off the poles: latitudes span ±0.95 instead of ±1, so no tile
     lands on the rotation axis where yaw can't move it. Loose enough that the
     globe still reads as a full sphere top to bottom — the only thing being
     excluded is the exact axis point itself. */
  const POLE_CAP = 0.95;

  const items = [];

  /* Fill a tile with a project object: clone the drawing out of the
     template, drop the bits that only made sense in the old desk scene
     (its hit rect, and the transform that placed it in that composition),
     and frame it with the authored viewBox. */
  function setIcon(it, key) {
    const p = PROJECTS[key];
    const src = template && template.content.getElementById(p.icon.id);
    if (!src) return false;

    const art = src.cloneNode(true);
    art.removeAttribute("id");
    art.removeAttribute("transform"); // scene placement — upright on a tile
    art.classList.remove("desk-item");
    art.querySelectorAll(".desk-hit").forEach((n) => n.remove());

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", p.icon.view);
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.appendChild(art);

    it.el.innerHTML = "";
    it.el.appendChild(svg);
    it.el.dataset.project = key;
    it.el.tabIndex = 0;
    it.el.setAttribute("role", "button");
    it.el.setAttribute("aria-label", p.name);
    return true;
  }

  function build() {
    stage.innerHTML = "";
    items.length = 0;

    const golden = Math.PI * (3 - Math.sqrt(5)); // ~2.39996, golden angle

    PROJECT_KEYS.forEach((key, i) => {
      /* Fibonacci sphere: even coverage, no polar bunching.
         Cell *midpoints* ((2i+1)/COUNT) rather than endpoints, then scaled
         by POLE_CAP. Endpoints would put a tile at exactly y = ±1, where the
         ring radius is zero — that tile sits on the rotation axis and never
         appears to move under yaw. The cap also keeps a clear polar gap so
         nothing bunches up at the top or bottom. */
      const y = POLE_CAP * (1 - (2 * i + 1) / COUNT);
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;

      const el = document.createElement("div");
      /* All one size. These are targets you aim at, so the old photo size
         tiers would only have made some of the projects harder to click than
         others — depth already does the size work. */
      el.className = "sphere-item is-icon";
      el.style.width = ICON_SIZE + "px";
      el.style.marginLeft = -ICON_SIZE / 2 + "px";
      el.style.marginTop = -ICON_SIZE / 2 + "px";

      const it = {
        el,
        project: key,
        x: Math.cos(theta) * r,
        y: y,
        z: Math.sin(theta) * r,
      };

      if (!setIcon(it, key)) return; // artwork missing — skip the tile

      wireIcon(it);
      stage.appendChild(el);
      items.push(it);
    });
  }

  /* ---- rotation state ---------------------------------------- */
  let rotY = 0.6;   // yaw
  let rotX = -0.15; // pitch
  let velY = DRIFT; // current angular velocity
  let velX = 0;
  let dragging = false;
  let lastT = 0;

  /* While the globe is hidden behind a panel there's no point writing a
     transform per tile every frame. Rotation keeps integrating so it drifts on
     in the background and returns where it would have been, but the DOM writes
     pause until it's visible again. */
  const FADE_OUT_MS = 560; // just past the CSS fade-out (420ms / 520ms)
  let frozen = false;
  let freezeT = 0;

  /* Put one tile where the current rotation says it belongs. Split out of
     render() so the closing card can send everything home with a single write
     per tile and let CSS ease it there — see closeProject(). */
  function place(it) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    const cx = Math.cos(rotX), sx = Math.sin(rotX);

    // rotate about Y then X
    let x = it.x * cy - it.z * sy;
    let z = it.x * sy + it.z * cy;
    let y = it.y * cx - z * sx;
    z = it.y * sx + z * cx;

    const px = x * RADIUS;
    const py = y * RADIUS;
    const pz = z * RADIUS;

    /* Billboard: translate only, never rotate. Scale by depth so the
       near face reads larger, and fade the back hemisphere so the
       silhouette stays legible instead of muddying. */
    const depth = (pz + RADIUS) / (RADIUS * 2); // 0 back .. 1 front
    const persp = PERSPECTIVE / (PERSPECTIVE - pz);
    const scale = persp * (0.55 + depth * 0.75);
    const alpha = 0.18 + depth * 0.82;

    it.el.style.transform =
      `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) ` +
      `scale(${scale.toFixed(3)})`;
    it.el.style.opacity = alpha.toFixed(3);
    it.el.style.zIndex = String(1000 + Math.round(pz));
  }

  function render() {
    for (let i = 0; i < items.length; i++) place(items[i]);
  }

  /* ================================================================
     Objects: focus, and the card behind them
     ================================================================ */
  const label = document.getElementById("sphereLabel");
  const labelText = document.getElementById("sphereLabelText");
  const detail = document.getElementById("deskDetail");

  let focused = null;   // item under the cursor
  let opened = null;    // item whose card is up
  let returning = null; // item flying back to its place on the globe
  let zoomT = 0;

  /* The globe holds still while an object has your attention — including the
     whole way home after a card closes. Letting the drift restart mid-flight
     was the stutter: every frame wrote a new transform target, so the tile
     chased a moving destination instead of easing to a fixed one.

     The hold outlasts the hover by a beat. Crossing the gap between two
     objects leaves nothing focused for a few frames, and without this the
     globe took every one of those gaps as permission to start moving —
     so the object you were reaching for shifted just as you arrived. */
  const HOVER_GRACE_MS = 150;
  let graceUntil = 0;

  function held() {
    return !!(focused || opened || returning) ||
      performance.now() < graceUntil;
  }

  function focusIcon(it) {
    if (opened || focused === it) return;
    if (focused) focused.el.classList.remove("is-focused");
    focused = it;
    it.el.classList.add("is-focused");
    /* The recede stays inside the globe: the objects you aren't pointing at
       blur and grey out, and the page beside it is left alone. */
    root.classList.add("is-focusing");

    if (!label) return;
    const name = PROJECTS[it.project].name;
    // swap the text before revealing so the mask never shows a stale name
    if (labelText.textContent !== name) {
      label.classList.remove("is-visible");
      labelText.textContent = name;
      void label.offsetHeight; // restart the reveal from the masked state
    }
    placeLabel(it);
    label.classList.add("is-visible");
  }

  /* Park the name directly under the object, in the globe's own coordinates.
     The tile's box already carries its depth scale, so reading it back is
     enough to sit the label right beneath whatever size it currently is — and
     because the drift holds still while an object has focus, the label stays
     put rather than trailing a moving tile.

     Two things this has to be careful about, both of which read as "the name
     isn't under the object":

     The globe itself is scaled (0.97 while the story is being read, 0.94
     before it arrives), so getBoundingClientRect gives back *visual* pixels
     while left/top are written in unscaled local ones. Mixing the two pulled
     the label toward the left edge of the column by a few percent of the
     tile's distance across it — nothing at all near the edge, half the width
     of the name out at the far side, which is why it looked intermittent.

     And the clamp that keeps a name from hanging off the column was a fixed
     80px, unrelated to how wide the name actually is: it shoved short names
     around for no reason and still let long ones overhang. Measure the label
     and move it only as far as it genuinely needs. */
  function placeLabel(it) {
    const box = root.getBoundingClientRect();
    const tile = it.el.getBoundingClientRect();
    const width = root.offsetWidth; // layout px, so it's the space we write in
    const scale = width ? box.width / width : 1;
    if (!scale) return;

    const cx = (tile.left + tile.width / 2 - box.left) / scale;
    const bottom = (tile.bottom - box.top) / scale;

    // half the name, plus a little air; never more than half the column
    const half = Math.min(label.offsetWidth / 2 + 10, width / 2);

    label.style.left = Math.max(half, Math.min(cx, width - half)).toFixed(1) + "px";
    label.style.top = (bottom + 10).toFixed(1) + "px";
  }

  function clearIconFocus() {
    if (focused) focused.el.classList.remove("is-focused");
    focused = null;
    graceUntil = performance.now() + HOVER_GRACE_MS;
    root.classList.remove("is-focusing");
    if (label) label.classList.remove("is-visible");
  }

  /* ---- click through to the project ---------------------------
     The tile you clicked flies to the middle of the globe and grows while
     everything else fades off, then the card takes the space. Because the
     rotation is already held, the target transform is a fixed point — no
     need to chase a moving tile. render() has to stop writing transforms
     for the duration or it would overwrite the flight every frame. */
  function openProject(it) {
    if (opened || returning) return;
    opened = it;
    clearTimeout(zoomT);
    clearIconFocus();

    const p = PROJECTS[it.project];
    document.getElementById("deskCardName").textContent = p.name;
    document.getElementById("deskCardDate").textContent = p.date;
    document.getElementById("deskCardDesc").textContent = p.desc;
    document.getElementById("deskCardDesc").scrollTop = 0;
    document.getElementById("deskCardLink").href = p.url;
    const chips = document.getElementById("deskCardChips");
    chips.innerHTML = "";
    p.chips.forEach((c) => {
      const s = document.createElement("span");
      s.textContent = c;
      chips.appendChild(s);
    });

    /* Hand the transforms over to CSS for the flight. is-zoomed carries the
       timings and stays on until the tile is home again; is-card is the
       "a card is up" state that dims the rest of the globe, and comes off the
       moment the card starts leaving. */
    frozen = true;
    root.classList.add("is-zoomed");
    root.classList.add("is-card");
    it.el.classList.add("is-flying");
    it.el.style.zIndex = "2000";
    it.el.style.transform = "translate3d(0, 0, 0) scale(4.2)";
    it.el.style.opacity = "0";
    items.forEach((other) => {
      if (other !== it) other.el.style.opacity = "0";
    });

    zoomT = setTimeout(() => detail.classList.add("is-visible"), 430);
  }

  function closeProject() {
    if (!opened) return;
    const it = opened;
    opened = null;
    returning = it;
    clearTimeout(zoomT);
    detail.classList.remove("is-visible");
    root.classList.remove("is-card");

    /* One write per tile, then CSS carries all of them home together — the
       transforms stay frozen and the rotation stays held, so nothing moves the
       destination while they travel. Un-freezing only happens once everything
       has landed, at which point the per-frame values already match what's on
       screen and the handover is invisible. */
    zoomT = setTimeout(() => {
      items.forEach(place);
      it.el.style.zIndex = "2000"; // stay in front while it settles back in
      zoomT = setTimeout(() => {
        it.el.classList.remove("is-flying");
        it.el.style.zIndex = "";
        root.classList.remove("is-zoomed");
        returning = null;
        frozen = false;
      }, 680);
    }, 220);
  }

  function wireIcon(it) {
    const el = it.el;
    el.addEventListener("pointerenter", () => focusIcon(it));
    el.addEventListener("pointerleave", () => {
      if (focused === it) clearIconFocus();
    });
    // keyboard parity: tabbing to an object reveals the same label
    el.addEventListener("focus", () => focusIcon(it));
    el.addEventListener("blur", () => {
      if (focused === it) clearIconFocus();
    });
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (suppressClick) return; // this was the end of a drag
      openProject(it);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProject(it);
      }
    });
  }

  function frame(now) {
    const dt = lastT ? Math.min(48, now - lastT) : 16;
    lastT = now;

    /* Hovering an object holds the globe still. Without this the tile you're
       aiming at drifts out from under the cursor, which makes a small target
       feel like it's dodging you — and the click you were lining up lands on
       a photo instead. The throw velocity is left untouched, so letting go of
       the hover picks the drift back up where it was. */
    if (!dragging && !held()) {
      // decay a throw back down to the ambient drift
      velY += (DRIFT - velY) * 0.045;
      velX += (0 - velX) * 0.08;
      rotY += velY * dt;
      rotX += velX * dt;
      // keep pitch sane
      rotX = Math.max(-0.9, Math.min(0.9, rotX));
    } else if (!dragging) {
      /* Held: nothing moves, but the throw still bleeds off. It used to be
         preserved intact for as long as you pointed at something — and a
         throw runs an order of magnitude faster than the drift, so the globe
         came back to life at ~1200px/s the instant the hover ended. Tiles
         swept across the cursor, each one taking the focus the last had just
         lost and stopping the globe dead again, and pointing at anything
         became a fight. Bleeding it off here means a hover ends in a drift
         rather than a lunge, however long you held it. */
      velY += (DRIFT - velY) * 0.045;
      velX += (0 - velX) * 0.08;
    }

    if (!frozen) render();
    requestAnimationFrame(frame);
  }

  /* ---- drag to spin ------------------------------------------
     You spin the globe by dragging the parts of it that aren't projects: the
     photos and the gaps between them. Starting a drag on an object would put
     the two gestures in competition on the same 66px target, and the object
     is the one that has to win — it's the only thing here you can click. */
  let lastX = 0, lastY = 0, lastMoveT = 0;
  let dragDist = 0;
  let suppressClick = false;

  function onIcon(target) {
    return !!(target && target.closest && target.closest(".sphere-item.is-icon"));
  }

  stage.addEventListener("pointerdown", (e) => {
    if (onIcon(e.target) || opened) return;
    dragging = true;
    dragDist = 0;
    suppressClick = false;
    root.classList.add("is-grabbed");
    lastX = e.clientX;
    lastY = e.clientY;
    lastMoveT = performance.now();
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dt = Math.max(1, now - lastMoveT);

    rotY += dx * 0.006;
    rotX = Math.max(-0.9, Math.min(0.9, rotX + dy * 0.004));

    // carry the drag speed into the release throw
    velY = (dx * 0.006) / dt;
    velX = (dy * 0.004) / dt;

    /* A spin that ends with the cursor over an object would otherwise fire
       that object's click. Past a few pixels of travel this was a drag, and
       the click that follows it isn't an intent. */
    dragDist += Math.abs(dx) + Math.abs(dy);
    if (dragDist > 6) suppressClick = true;

    lastX = e.clientX;
    lastY = e.clientY;
    lastMoveT = now;
    render();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    root.classList.remove("is-grabbed");
    try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    // release the click guard after this event's click has come and gone
    if (suppressClick) setTimeout(() => { suppressClick = false; }, 0);
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  /* ---- run --------------------------------------------------- */
  build();
  render();
  requestAnimationFrame(frame);

  // leaving the globe entirely drops any hover state the tiles missed
  root.addEventListener("pointerleave", () => {
    if (focused) clearIconFocus();
  });

  const back = document.getElementById("deskBack");
  if (back) back.addEventListener("click", closeProject);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && opened) closeProject();
  });
  // wait for the loader to finish, then drift the sphere in
  function revealSphere() {
    requestAnimationFrame(() => {
      root.classList.add("is-entering");
      root.classList.add("is-in");
      root.addEventListener("transitionend", function cleanup(e) {
        if (e.propertyName === "opacity") {
          root.classList.remove("is-entering");
          root.removeEventListener("transitionend", cleanup);
        }
      });
    });
  }
  if (document.documentElement.classList.contains("is-loading")) {
    const mo = new MutationObserver(() => {
      if (!document.documentElement.classList.contains("is-loading")) {
        mo.disconnect();
        setTimeout(revealSphere, 200);
      }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  } else {
    setTimeout(revealSphere, 200);
  }

  /* ---- recede while a panel is open ---------------------------
     The resume panel shares the right column with the globe outright, and the
     full-screen sections cover it, so it steps aside for both. Panel
     controllers call window.sphereRecede() at the moment the gesture starts
     rather than waiting for a class to land; the class check stays on as an
     OR'd safety net for any path that doesn't signal. */
  const resumePanel = document.getElementById("resumePanel");

  let resumeIntent = false; // set on the resume click, before its class lands

  function shouldRecede() {
    const resumeOpen = resumeIntent ||
      !!(resumePanel && resumePanel.classList.contains("is-open"));
    // the full-screen panels cover the globe outright; recede so it isn't
    // mid-drift underneath when one of them closes
    const fsOpen = !!document.querySelector(".fs-panel.is-open");
    return resumeOpen || fsOpen;
  }

  /* How long the globe waits before coming back. Long enough for a
     full-screen section to have finished travelling off the page (880ms) —
     the globe drifting in *underneath* a moving viewport-sized panel was
     two expensive animations sharing one frame budget, and it showed. */
  const RETURN_DELAY = 920;
  let returnT = 0;
  let returnPending = false;

  function apply() {
    const off = shouldRecede();

    if (off) {
      /* A card left open behind a panel would still be there on the way back,
         over a globe that has meanwhile drifted on. Send it home first. */
      if (opened) closeProject();
      if (focused) clearIconFocus();

      clearTimeout(returnT);
      returnPending = false;
      root.classList.add("is-dimmed");
      /* Fully faded tiles would still swallow drags, so drop the stage out
         of the hit-testing entirely while it's away. */
      stage.style.pointerEvents = "none";
      // stop writing transforms once it's actually invisible, not before —
      // freezing mid-fade would read as a stall
      clearTimeout(freezeT);
      freezeT = setTimeout(() => { frozen = true; }, FADE_OUT_MS);
      return;
    }

    // already home, or on its way there — a re-evaluation shouldn't restart it
    if (returnPending || !root.classList.contains("is-dimmed")) return;

    clearTimeout(freezeT);
    returnPending = true;
    returnT = setTimeout(() => {
      returnPending = false;
      /* Catch the tiles up to where the drift got to while they were frozen,
         then start the fade on the *next* frame. Unfreezing and fading in
         together put nine transform writes and the re-raster of nine dormant
         tiles into the first frame of the fade, which is the stutter. */
      if (!opened && !returning) frozen = false;
      render();
      requestAnimationFrame(() => {
        root.classList.remove("is-dimmed");
        stage.style.pointerEvents = "auto";
      });
    }, RETURN_DELAY);
  }

  /* Panel controllers call this on click so the fade starts with the
     gesture. Passing nothing just re-evaluates the current state. */
  window.sphereRecede = function (on) {
    if (arguments.length) resumeIntent = !!on;
    apply();
  };

  /* Reading state: main.js's scroll loop calls this every frame. Once the
     reader has moved past the opening the globe quiets down so it isn't
     pulling the eye away from the prose. Idempotent — toggling a class to a
     value it already holds is a no-op, so a per-frame call is cheap. */
  window.sphereQuiet = function (on) {
    root.classList.toggle("is-quiet", !!on);
  };

  const obs = new MutationObserver(apply);
  if (resumePanel) obs.observe(resumePanel, { attributes: true, attributeFilter: ["class"] });
  document.querySelectorAll(".fs-panel").forEach((p) =>
    obs.observe(p, { attributes: true, attributeFilter: ["class"] })
  );
  // is-gallery lands on <html>
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  apply();
})();
