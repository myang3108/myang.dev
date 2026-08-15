/* ---------------------------------------------------------------
   The two sections below the story: ramblings and gallery.

   Neither is reachable until the reader finishes the prose — the buttons
   that open them rise into view as the last words land. Clicking one
   scrolls that section up over the page, and the "back up" control is the
   only way out, so the sections read as places you travelled to rather
   than dialogs you summoned.

   To add a post, push onto POSTS. To add a photo, push onto PHOTOS.
   --------------------------------------------------------------- */
(function () {
  const POSTS = [
    {
      title: 'Traversing 750M edges without waking the on-call',
      date: 'Jul 2026',
      read: '6 min read',
      tags: ['Neptune', 'openCypher', 'Lambda'],
      excerpt:
        'What I learned building a customer-behavior knowledge graph big enough that every query plan mistake costs a full second.',
      body: `
        <p>A graph with 750 million weighted relationships is not a bigger version
        of a graph with 750 thousand. The queries that feel instant in a notebook
        against a sample turn into full-index scans the moment the edge count
        crosses whatever threshold the planner was quietly relying on.</p>

        <h2>Bound the traversal, not the result</h2>
        <p>The first version of the recommendation query looked like the obvious
        thing: start at a customer, walk out to products, walk back to other
        customers, rank. It was correct and it was unusable. The fix wasn't a
        faster machine — it was putting a ceiling on the hop-out step so the
        planner never materialized the wide middle of the traversal.</p>
        <blockquote>The cheapest optimization in graph work is refusing to
        visit a node you were never going to rank.</blockquote>

        <h2>Small samples lie</h2>
        <p>Raw co-purchase counts rank obscure pairs far too highly — two people
        buying the same odd thing looks like a stronger signal than two hundred
        people buying a common one. Scoring affinity with a Wilson lower bound
        instead of a raw ratio pushes low-sample pairs down toward the mean,
        which is exactly the behavior you want when the tail is most of the graph.</p>

        <h2>Make rebuilds boring</h2>
        <p>The thing I'd insist on from day one next time: deterministic
        rebuilds. Same inputs, same edge weights, byte for byte. It turns
        "did my change help?" from an argument into a diff.</p>
      `,
    },
    {
      title: 'An MCP server is mostly a documentation problem',
      date: 'May 2026',
      read: '4 min read',
      tags: ['MCP', 'LLM', 'Tooling'],
      excerpt:
        'The hard part of exposing a system to an agent is not the transport. It is writing tool descriptions that a model can actually act on.',
      body: `
        <p>I've now wrapped three very different systems — a seismic simulation
        pipeline, a graph endpoint, and an internal shopping service — as MCP
        servers. Every time, the code was the easy half.</p>

        <h2>The description is the API</h2>
        <p>A model doesn't read your implementation. It reads the name, the
        description, and the parameter schema, and it decides from those alone.
        A tool called <code>query</code> described as "runs a query" will be
        called wrongly and constantly. The same tool called
        <code>find_related_products</code> with a description that states what
        it returns, what it costs, and when <em>not</em> to reach for it gets
        used correctly on the first try.</p>

        <h2>Return shapes the model can reason about</h2>
        <ul>
          <li>Prefer a handful of labeled fields over a large raw blob.</li>
          <li>Say why something is missing rather than returning empty.</li>
          <li>Put the number the model needs to compare in the response — don't
          make it do arithmetic across three calls.</li>
        </ul>

        <h2>Fewer, sharper tools</h2>
        <p>Twelve overlapping tools is worse than five clearly separated ones.
        Overlap is where a model hesitates, and hesitation shows up as latency
        and retries in the trace.</p>
      `,
    },
    {
      title: 'Building this site: motion as the only decoration',
      date: 'Mar 2026',
      read: '5 min read',
      tags: ['Canvas', 'CSS', 'Design'],
      excerpt:
        'No images in the layout, no color beyond one accent. Everything that carries feeling here is timing.',
      body: `
        <p>The constraint I set was: one typeface, one accent color, no
        decorative imagery in the layout itself. Whatever personality the site
        has would have to come from how things move.</p>

        <h2>Reveal at reading speed</h2>
        <p>The prose activates word by word as you scroll, tied to a smoothed
        scroll position rather than the raw wheel delta. The smoothing is the
        whole trick — raw deltas feel mechanical, and a little inertia makes the
        page feel like it has weight.</p>

        <h2>Let one gesture finish before the next starts</h2>
        <p>The work panel traces its outline open over about 1.2 seconds. Early
        on, clicking the resume chip mid-trace left two animations fighting
        underneath each other. The fix was a small state machine: mid-transition
        clicks become <em>intent</em>, applied once the current sequence lands,
        never a second sequence layered on a live one.</p>

        <h2>Everything has an off switch</h2>
        <p>Every animation here collapses under
        <code>prefers-reduced-motion</code>. Blur especially — it's a common
        migraine trigger, so the reduced-motion path recedes with opacity and
        contrast only.</p>
      `,
    },
  ];


  const PHOTOS = [
    { src: 'photos/img_0095_720.jpg' },
    { src: 'photos/img_0520_720.jpg' },
    { src: 'photos/img_0756_720.jpg' },
    { src: 'photos/img_0819_original_720.jpg' },
    { src: 'photos/img_1125_720.jpg' },
    { src: 'photos/img_1416_720.jpg' },
    { src: 'photos/img_2016_720.jpg' },
    { src: 'photos/img_2185_720.jpg' },
    { src: 'photos/img_2450_720.jpg' },
    { src: 'photos/img_2734_720.jpg' },
    { src: 'photos/img_4017_720.jpg' },
    { src: 'photos/img_4039_720.jpg' },
    { src: 'photos/img_4104_720.jpg' },
    { src: 'photos/img_4381_720.jpg' },
    { src: 'photos/img_4625_720.jpg' },
    { src: 'photos/img_4734_720.jpg' },
    { src: 'photos/img_5161_720.jpg' },
    { src: 'photos/img_5348_720.jpg' },
    { src: 'photos/img_5436_720.jpg' },
    { src: 'photos/img_5508_720.jpg' },
    { src: 'photos/img_5801_720.jpg' },
    { src: 'photos/img_5876_720.jpg' },
    { src: 'photos/img_5937_720.jpg' },
    { src: 'photos/img_6152_720.jpg' },
    { src: 'photos/img_6216_720.jpg' },
    { src: 'photos/img_7346_720.jpg' },
  ];

  /* ---- section manager ------------------------------------------- */

  const sections = {
    blog: document.getElementById('blogPanel'),
    gallery: document.getElementById('galleryPanel'),
  };
  const root = document.documentElement;
  const blogArticle = document.getElementById('blogArticle');

  function openKey() {
    return Object.keys(sections).find((k) =>
      sections[k].classList.contains('is-open')
    );
  }
  // main.js consults this so the story behind us doesn't scroll
  window.fsPanelIsOpen = () => !!openKey();

  let leaveTimer = null;

  function closeSection() {
    const key = openKey();
    if (!key) return;
    const section = sections[key];
    /* is-leaving carries its own curve for the exit — see the stylesheet.
       It has to come off once the section is parked off screen, or the next
       open would inherit the leaving transform. */
    section.classList.add('is-leaving');
    section.classList.remove('is-open');
    section.setAttribute('aria-hidden', 'true');
    root.classList.remove('is-sectioned');
    if (key === 'blog') closeArticle();

    /* The exit is the busiest moment on the page — a full-viewport panel
       travelling, the story and chrome coming back, and the globe drifting in
       behind it — so everything that doesn't have to happen during it waits
       until the panel is parked. That's a slightly longer close in exchange
       for one that doesn't hitch. */
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      /* First: stop the carousel. Its loop used to run for the rest of the
         session after the first open, so five cards were still being
         transformed every frame all the way through the exit. */
      if (key === 'gallery') carousel.sleep();
      // reset scroll now it's out of sight, so nothing visibly jumps
      section.querySelectorAll('.fs-scroll, .blog-article').forEach((el) => {
        el.scrollTop = 0;
      });
      /* Dropping is-leaving snaps the panel from transparent back to opaque,
         which is a repaint of a viewport-sized layer. It's parked off screen
         and invisible either way, so give it its own frame rather than landing
         it on top of the scroll reset. */
      requestAnimationFrame(() => section.classList.remove('is-leaving'));
    }, 1150);

    // sphere.js holds the globe back until the panel has finished leaving
    if (window.sphereRecede) window.sphereRecede(false);
  }
  window.closeSection = closeSection;

  function openSection(key) {
    const section = sections[key];
    if (!section || section.classList.contains('is-open')) return;
    // re-opening mid-exit: drop the leaving state so it rises from where
    // it is rather than from the shrunken transform
    clearTimeout(leaveTimer);
    Object.keys(sections).forEach((k) => sections[k].classList.remove('is-leaving'));
    /* Lay the strip out first. wake() reads the stage's size, and a read
       taken after the class changes below forces the browser to resolve
       that whole new layout on the spot — synchronous work landing on the
       first frame of the open, which is the frame with the least room for
       it. Ask while the page is still settled instead; the answer is the
       same either way (see wake). */
    if (key === 'gallery') carousel.wake();
    // hand off from whatever else is showing — one surface at a time
    if (window.closeResumePanel) window.closeResumePanel();
    if (window.sphereRecede) window.sphereRecede(true);
    root.classList.add('is-sectioned');
    section.classList.add('is-open');
    section.setAttribute('aria-hidden', 'false');
  }

  /* ---- the buttons at the end of the story ----------------------- */

  const endActions = document.getElementById('endActions');
  const blogBtn = document.getElementById('blogBtn');
  const galleryBtn = document.getElementById('galleryBtn');

  function wire(btn, key) {
    /* The icon's two-turn spin runs on hover over 780ms, so at the click
       it's nearly always mid-turn. Freezing it there snapped a half-rotated
       glyph straight to upright on the very element under the cursor — the
       one place a jump is guaranteed to be seen. So the click pins the
       spin's destination and lets the turn land, and only then hands over
       to the frozen state, where identity and 720deg are the same picture.
       See .end-action.is-holding / .is-held. */
    let holdT = null;
    btn.addEventListener('click', () => {
      btn.classList.add('is-holding');
      clearTimeout(holdT);
      holdT = setTimeout(() => {
        btn.classList.add('is-held');
        btn.classList.remove('is-holding');
      }, 820); // the spin's 780ms, plus a little
      openSection(key);
    });
    /* Released on the way in rather than on the way out: the freeze has to
       survive the panel covering the button, and only needs lifting in time
       for the next hover to spin up from rest. */
    btn.addEventListener('pointerenter', () => {
      clearTimeout(holdT);
      btn.classList.remove('is-held');
      btn.classList.remove('is-holding');
    });
  }
  wire(blogBtn, 'blog');
  wire(galleryBtn, 'gallery');

  function smoothstep(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
  }

  /* main.js calls this every frame with story progress. The buttons rise
     over the last stretch of the read rather than popping in at a
     threshold — driven per frame, so there's no CSS transition to lag
     behind the scroll, and they leave just as smoothly on the way up. */
  let shown = -1;
  window.endActions = function (storyProgress) {
    const v = smoothstep((storyProgress - 0.955) / 0.045);
    if (Math.abs(v - shown) < 0.002) return;
    shown = v;
    endActions.style.opacity = v.toFixed(3);
    endActions.style.transform =
      'translateX(-50%) translateY(' + ((1 - v) * 16).toFixed(2) + 'px)';
    endActions.style.pointerEvents = v > 0.85 ? 'auto' : 'none';
    endActions.setAttribute('aria-hidden', v > 0.85 ? 'false' : 'true');
  };

  document.getElementById('blogClose').addEventListener('click', closeSection);
  document.getElementById('galleryClose').addEventListener('click', closeSection);

  /* The hand-off in the other direction. The resume chip's own listener is
     attached later (inline in index.html), so we're out of the way before it
     animates in — otherwise it'd open underneath a section that sits above
     it. The desk needs no equivalent: a section covers the whole viewport,
     and openSection already sends the desk away. */
  document.getElementById('resumeBtn').addEventListener('click', closeSection);

  /* ---- ramblings: post list -------------------------------------- */

  const blogList = document.getElementById('blogList');
  const blogArticleBody = document.getElementById('blogArticleBody');

  POSTS.forEach((post, i) => {
    const card = document.createElement('button');
    card.className = 'blog-card';
    card.type = 'button';
    // drives the entrance stagger in CSS
    card.style.setProperty('--i', String(i));

    /* left rail: the entry's number and date, like the margin of a
       notebook page. The list is newest-first, so number them from the
       bottom up — the oldest entry is no. 01. */
    const rail = document.createElement('div');
    rail.className = 'blog-rail';
    const no = document.createElement('span');
    no.className = 'blog-no';
    no.textContent = 'no. ' + String(POSTS.length - i).padStart(2, '0');
    const date = document.createElement('span');
    date.className = 'blog-date';
    date.textContent = post.date;
    const read = document.createElement('span');
    read.className = 'blog-read';
    read.textContent = post.read;
    rail.append(no, date, read);

    const entry = document.createElement('div');

    const title = document.createElement('h2');
    title.className = 'blog-card-title';
    title.textContent = post.title;
    const arrow = document.createElement('span');
    arrow.className = 'blog-card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    title.appendChild(arrow);

    const excerpt = document.createElement('p');
    excerpt.className = 'blog-card-excerpt';
    excerpt.textContent = post.excerpt;

    entry.append(title, excerpt);

    if (post.tags && post.tags.length) {
      const tags = document.createElement('div');
      tags.className = 'blog-tags';
      post.tags.forEach((t) => {
        const tag = document.createElement('span');
        tag.textContent = t;
        tags.appendChild(tag);
      });
      entry.appendChild(tags);
    }

    card.append(rail, entry);
    card.addEventListener('click', () => openArticle(post));
    blogList.appendChild(card);
  });

  /* ---- ramblings: reading view ----------------------------------- */

  function openArticle(post) {
    /* Body copy is authored above, not user input, so innerHTML is the
       right tool here — the headings and lists are the point. */
    blogArticleBody.innerHTML =
      '<h1></h1><p class="blog-article-meta"></p>' + post.body;
    blogArticleBody.querySelector('h1').textContent = post.title;
    blogArticleBody.querySelector('.blog-article-meta').textContent =
      post.date + ' · ' + post.read;
    blogArticle.scrollTop = 0;
    blogArticle.classList.add('is-open');
    blogArticle.setAttribute('aria-hidden', 'false');
  }

  function closeArticle() {
    if (!blogArticle.classList.contains('is-open')) return;
    blogArticle.classList.remove('is-open');
    blogArticle.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('blogBack').addEventListener('click', closeArticle);

  /* ---- gallery: curved carousel ----------------------------------
     A port of the OGL circular-gallery to plain DOM. The cards sit on a
     horizontal strip bent around a very large circle: the further a card
     is from center, the further it sinks along the arc and the more it
     tilts to stay tangent to it. One smoothed scroll value drives
     everything, and each card wraps around the strip when it leaves the
     stage, so it spins forever in either direction.

     The original's per-vertex ripple shader is the one thing left behind —
     it needs a mesh, and this has none. Everything else (the arc, the
     wrap, the wheel/drag easing, the snap-to-nearest on release) is here.
  --------------------------------------------------------------------- */

  const carousel = (function () {
    const stage = document.getElementById('carousel');
    const BEND = 3; // the reference component's default curvature
    const EASE = 0.06; // how fast `current` chases `target`
    const DRAG_SPEED = 1.35;
    const WHEEL_SPEED = 0.75;
    const SNAP_REST_MS = 180;

    let items = [];
    let geo = {};
    let scroll = { current: 0, target: 0, last: 0 };
    let running = false;
    let lastInputAt = 0;
    let snapped = true;

    /* Card size and spacing are functions of the stage height, the same
       relationship the OGL version derives from its viewport — that's what
       keeps the curve looking identical at any window size. */
    function measure() {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const narrow = w < 720;
      const cardH = h * (narrow ? 0.44 : 0.56);
      const cardW = cardH * (narrow ? 0.82 : 0.78);
      const gap = h * (narrow ? 0.07 : 0.1);
      geo = {
        w: w,
        h: h,
        cardW: cardW,
        cardH: cardH,
        stride: cardW + gap,
        // half the stage: the arc is measured across exactly this span
        half: w / 2,
        bend: h * 0.18 * (BEND / 3),
      };
      geo.total = geo.stride * items.length;
      items.forEach((it) => {
        it.el.style.width = cardW.toFixed(2) + 'px';
        it.el.style.height = cardH.toFixed(2) + 'px';
      });
    }

    function build() {
      PHOTOS.forEach((photo, i) => {
        const el = document.createElement('div');
        el.className = 'carousel-item';

        const figure = document.createElement('div');
        figure.className = 'carousel-figure';
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.text || '';
        img.draggable = false;
        img.decoding = 'async';
        figure.appendChild(img);

        /* No caption under the card — the photo is the whole point, and a
           line of type under it only asks to be read instead. `text` stays
           on as the image's alt, which is where it's actually needed. */
        el.appendChild(figure);
        // click a card to bring it to the front of the curve
        el.addEventListener('click', () => {
          if (dragMoved) return; // that was a drag, not a click
          scroll.target = geo.stride * i + wrapOffset(items[i]);
          snapped = true;
        });
        stage.appendChild(el);
        items.push({ el: el, figure: figure, extra: 0, index: i });
      });
      measure();
    }

    // how many whole strips this card has been shifted by, in px
    function wrapOffset(item) {
      return item.extra;
    }

    function render() {
      const dir = scroll.current > scroll.last ? 'right' : 'left';

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let x = geo.stride * item.index - scroll.current - item.extra;

        /* Wrap: once a card is fully past the edge it's moving away from,
           jump it a whole strip-length to the other side. Checked before
           the transform is written, so the jump is never visible. */
        const halfCard = geo.cardW / 2;
        if (dir === 'right' && x + halfCard < -geo.half) {
          item.extra -= geo.total;
          x += geo.total;
        } else if (dir === 'left' && x - halfCard > geo.half) {
          item.extra += geo.total;
          x -= geo.total;
        }

        /* The arc. R is the radius of a circle that drops `bend` over the
           half-width `half`; a card at horizontal offset x sits `arc`
           below the top of that circle and tilts by the angle it subtends,
           so the whole strip reads as one curve. */
        let y = 0;
        let rot = 0;
        if (geo.bend !== 0) {
          const H = geo.half;
          const B = Math.abs(geo.bend);
          const R = (H * H + B * B) / (2 * B);
          const ex = Math.min(Math.abs(x), H);
          const arc = R - Math.sqrt(Math.max(R * R - ex * ex, 0));
          y = arc;
          rot = Math.sign(x) * Math.asin(ex / R) * (180 / Math.PI);
        }

        item.el.style.transform =
          'translate(-50%, -50%) translate(' + x.toFixed(2) + 'px, ' +
          y.toFixed(2) + 'px) rotate(' + rot.toFixed(3) + 'deg)';

        // focus: 1 for the card at center, fading out over one stride
        const focus = Math.max(0, 1 - Math.abs(x) / geo.stride);
        item.el.style.setProperty('--sat', (focus * focus).toFixed(3));
        item.el.style.zIndex = String(100 + Math.round(focus * 100));
      }
    }

    function frame() {
      if (!running) return;

      /* A settled strip doesn't need redrawing. Without this the loop wrote
         five transforms, five filters and five z-indexes every frame for as
         long as the section was open, even sitting perfectly still. */
      if (!snapped || Math.abs(scroll.target - scroll.current) > 0.01) {
        scroll.current += (scroll.target - scroll.current) * EASE;
        render();
        scroll.last = scroll.current;
      }

      /* Settle onto the nearest card once input stops — the reference
         component's onCheck, on a timer instead of a debounce. */
      if (!snapped && performance.now() - lastInputAt > SNAP_REST_MS) {
        const n = Math.round(scroll.target / geo.stride);
        scroll.target = n * geo.stride;
        snapped = true;
      }
      requestAnimationFrame(frame);
    }

    function nudge(delta) {
      scroll.target += delta;
      lastInputAt = performance.now();
      snapped = false;
      stage.classList.add('is-touched');
    }

    /* ---- input ---- */

    let dragging = false;
    let dragStartX = 0;
    let dragStartTarget = 0;
    let dragMoved = false;

    stage.addEventListener('pointerdown', (e) => {
      dragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartTarget = scroll.target;
      stage.classList.add('is-grabbed');
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    });

    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = dragStartX - e.clientX;
      if (Math.abs(dx) > 3) dragMoved = true;
      scroll.target = dragStartTarget + dx * DRAG_SPEED;
      lastInputAt = performance.now();
      snapped = false;
      stage.classList.add('is-touched');
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-grabbed');
      lastInputAt = performance.now();
      try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* gone */ }
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    /* Wheel: main.js's page-level handler bails while a section is open,
       so the gesture is ours to use for the strip instead. */
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      nudge((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * WHEEL_SPEED);
    }, { passive: false });

    window.addEventListener('resize', () => {
      if (!running) return;
      measure();
      render();
    });

    return {
      /* Build the strip and get the photos decoded ahead of the click —
         see the warm-up below. Safe to call more than once; only the first
         does anything. */
      prepare: function () {
        if (items.length) return;
        build();
        render();
        items.forEach((it) => {
          const img = it.figure.firstElementChild;
          if (img.decode) img.decode().catch(() => { /* it'll load anyway */ });
        });
      },
      /* Called on open. A closed panel is still full-size — it's only
         translated off screen — so the stage measures the same before the
         open as during it, which is what lets openSection ask early. */
      wake: function () {
        if (!items.length) build();
        measure();
        if (!running) {
          running = true;
          requestAnimationFrame(frame);
        }
        render();
      },
      /* Called once the section is parked off screen. Nothing can see the
         strip from here, so the loop has no reason to keep going — wake()
         re-measures and re-renders on the way back in. */
      sleep: function () {
        running = false;
      },
      step: function (dir) {
        nudge(dir * geo.stride);
        // a step is already aligned, so let it settle immediately
        const n = Math.round(scroll.target / geo.stride);
        scroll.target = n * geo.stride;
        snapped = true;
      },
    };
  })();

  /* ---- warming the strip -----------------------------------------
     These photos are the only raster images on the page, and the strip
     used to be built inside the click that opens the section: fetching and
     decoding ~2MB of JPEG on the first frame of a viewport-sized panel's
     travel. The cards arrived grey and filled in behind the slide, and the
     slide hitched while they did — a first open that felt nothing like the
     second. Do it once, early, so the click has nothing left to pay for.

     After the loader, because it owns the opening beat of the page and a
     canvas animation shouldn't be sharing frames with two dozen image
     decodes; and at idle after that, so this waits behind anything the
     reader is actually looking at. */
  function warmCarousel() {
    const go = () => carousel.prepare();
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 2500 });
    else setTimeout(go, 500);
  }

  if (document.documentElement.classList.contains('is-loading')) {
    const mo = new MutationObserver(() => {
      if (!document.documentElement.classList.contains('is-loading')) {
        mo.disconnect();
        warmCarousel();
      }
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  } else {
    warmCarousel();
  }

  /* ---- keyboard -------------------------------------------------- */

  /* Capture phase: main.js also listens on window for scroll keys, and
     while a section is open those shouldn't move the story underneath
     (main.js bails on fsPanelIsOpen for the same reason). */
  window.addEventListener(
    'keydown',
    (e) => {
      const key = openKey();
      if (!key) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        // peel one layer at a time: the reading view, then the section
        if (blogArticle.classList.contains('is-open')) closeArticle();
        else closeSection();
        return;
      }

      if (key === 'gallery') {
        if (e.key === 'ArrowLeft') { e.preventDefault(); carousel.step(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); carousel.step(1); }
      }
    },
    true
  );
})();
