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
      title: 'check back later :p',
      date: 'Jul 2026',
      read: '2 min read',
      tags: ['nontech'],
      excerpt:
        '',
      body: `
        <p></p>
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
    projects: document.getElementById('projectsPanel'),
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
    if (key === 'projects') closeProject();

    /* The exit is the busiest moment on the page — a full-viewport panel
       travelling, the story and chrome coming back, and the globe drifting in
       behind it — so everything that doesn't have to happen during it waits
       until the panel is parked. That's a slightly longer close in exchange
       for one that doesn't hitch. */
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      leaveTimer = null;
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
    /* Re-opening mid-exit: drop the leaving state so it rises from where it
       is rather than from the shrunken transform.

       Clearing leaveTimer also cancels the only path that ever stopped the
       carousel loop, so the stop has to happen here as well. Open gallery ->
       close -> open the blog inside the 1150ms window and the strip's rAF
       loop used to survive for the rest of the session, transforming and
       re-filtering five cards every frame behind a closed panel. */
    if (leaveTimer) carousel.sleep();
    clearTimeout(leaveTimer);
    leaveTimer = null;
    Object.keys(sections).forEach((k) => sections[k].classList.remove('is-leaving'));
    /* Lay the strip out first. wake() reads the stage's size, and a read
       taken after the class changes below forces the browser to resolve
       that whole new layout on the spot — synchronous work landing on the
       first frame of the open, which is the frame with the least room for
       it. Ask while the page is still settled instead; the answer is the
       same either way (see wake). */
    if (key === 'gallery') carousel.wake();
    // hand off from whatever else is showing — one surface at a time
    setMenu(false); // the phone's "more" card, if the tap came from inside it
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
  let live = -1; // last written value of the clickable flag, see below

  /* On phones the row is not the end of the story, it's the chrome under the
     nav (see the phone layout in styles.css), so the progress drive has
     nothing to say about it: no inline opacity or transform to fight the
     pinned rule, and aria-hidden off for good so the two buttons are reachable
     before the read rather than after it. The listener matters because the
     breakpoint can be crossed by rotating the phone — leaving the desktop
     side, the inline styles have to go or the row stays frozen at whatever
     opacity the last frame wrote. */
  const phone = window.matchMedia('(max-width: 720px)');
  const menuBtn = document.getElementById('menuBtn');
  let pinned = false;

  function pinTop() {
    if (pinned) return;
    pinned = true;
    shown = -1;
    live = -1;
    endActions.style.opacity = '';
    endActions.style.transform = '';
    endActions.style.pointerEvents = '';
    setMenu(false);
  }

  function unpinTop() {
    pinned = false;
    setMenu(false);
  }

  /* aria-hidden tracks the card rather than the reading progress here: shut,
     the menu is as absent to a screen reader as it is to a thumb. */
  function setMenu(open) {
    endActions.classList.toggle('is-menu-open', open);
    menuBtn.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    endActions.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function menuIsOpen() {
    return endActions.classList.contains('is-menu-open');
  }

  /* pointerdown, not click: the story is dragged, and a drag that starts on
     the page behind an open menu should dismiss it as it begins rather than
     leave it hanging over the words for the length of the gesture.

     The button's own handler stops the event here, so opening the menu isn't
     also the outside-tap that closes it. */
  menuBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu(!menuIsOpen());
  });

  document.addEventListener('pointerdown', (e) => {
    if (!menuIsOpen()) return;
    if (endActions.contains(e.target)) return;
    setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !menuIsOpen()) return;
    setMenu(false);
    menuBtn.focus();
  });

  if (phone.matches) pinTop();
  phone.addEventListener('change', (e) => (e.matches ? pinTop() : unpinTop()));

  /* Named updateEndActions, not endActions. There is a <div id="endActions">
     on the page, and the browser publishes every element id as a property of
     window — so `window.endActions` already existed as that div before this
     line ever ran, and main.js's `if (window.endActions)` guard happily
     called a DOM node. Any name that doesn't shadow an id is fine; this one
     also reads as a verb, which is what it is. */
  window.updateEndActions = function (storyProgress) {
    if (pinned) return;
    const v = smoothstep((storyProgress - 0.955) / 0.045);
    if (Math.abs(v - shown) < 0.002) return;
    shown = v;
    endActions.style.opacity = v.toFixed(3);
    endActions.style.transform =
      'translateX(-50%) translateY(' + ((1 - v) * 16).toFixed(2) + 'px)';

    /* These two are booleans that flip once on the way in and once on the
       way out, but they were being rewritten on every frame of the rise.
       Writing aria-hidden in particular invalidates accessibility state for
       no reason 60 times a second. */
    const clickable = v > 0.85;
    if (clickable !== live) {
      live = clickable;
      endActions.style.pointerEvents = clickable ? 'auto' : 'none';
      endActions.setAttribute('aria-hidden', clickable ? 'false' : 'true');
    }
  };

  document.getElementById('blogClose').addEventListener('click', closeSection);
  document.getElementById('galleryClose').addEventListener('click', closeSection);

  /* The hand-off in the other direction. The resume chip's own listener is
     attached later (inline in index.html), so we're out of the way before it
     animates in — otherwise it'd open underneath a section that sits above
     it. The desk needs no equivalent: a section covers the whole viewport,
     and openSection already sends the desk away. */
  document.getElementById('resumeBtn').addEventListener('click', () => {
    closeSection();
    setMenu(false);
  });

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

  /* ---- work: the projects, for viewports with no globe --------------
     Below 1500px .sphere is display:none, which removed all eleven projects,
     their drawings and their cards from the page with no other route to
     them. This is that route.

     The artwork is extracted exactly the way sphere.js does it (see
     setIcon there): clone the <g> out of the inert #deskTemplate, drop the
     transform that placed it in the old desk composition and the .desk-hit
     rect that only mattered there, then frame it with the per-project
     viewBox authored in projects.js. Same source of truth, so a change to
     a drawing shows up in both places.

     Rows are built once, lazily, on first open — eleven SVG clones is not
     work worth doing at startup for a panel most visits never open. */

  const PROJECTS = window.PROJECTS || {};
  const projectList = document.getElementById('projectList');
  const projectDetail = document.getElementById('projectDetail');
  const projectDetailBody = document.getElementById('projectDetailBody');
  const deskTemplate = document.getElementById('deskTemplate');
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let projectsBuilt = false;

  function projectArt(p) {
    const src = deskTemplate && deskTemplate.content.getElementById(p.icon.id);
    if (!src) return null;
    const art = src.cloneNode(true);
    art.removeAttribute('id');
    art.removeAttribute('transform'); // scene placement — upright here
    art.classList.remove('desk-item');
    art.querySelectorAll('.desk-hit').forEach((n) => n.remove());
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', p.icon.view);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.appendChild(art);
    return svg;
  }

  function buildProjects() {
    if (projectsBuilt) return;
    projectsBuilt = true;

    Object.keys(PROJECTS).forEach((key, i) => {
      const p = PROJECTS[key];
      const row = document.createElement('button');
      row.className = 'proj-row';
      row.type = 'button';
      row.style.setProperty('--i', String(i)); // entrance stagger, as blog

      const art = document.createElement('span');
      art.className = 'proj-art';
      const svg = projectArt(p);
      if (svg) art.appendChild(svg);

      const body = document.createElement('span');
      body.className = 'proj-body';

      const name = document.createElement('span');
      name.className = 'proj-name';
      name.textContent = p.name;

      const date = document.createElement('span');
      date.className = 'proj-date';
      date.textContent = p.date;

      const arrow = document.createElement('span');
      arrow.className = 'proj-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      name.appendChild(arrow);

      body.append(name, date);
      row.append(art, body);
      row.addEventListener('click', () => openProject(p));
      projectList.appendChild(row);
    });
  }

  function openProject(p) {
    projectDetailBody.textContent = '';

    const art = document.createElement('div');
    art.className = 'proj-detail-art';
    const svg = projectArt(p);
    if (svg) art.appendChild(svg);

    const h1 = document.createElement('h1');
    h1.textContent = p.name;

    const meta = document.createElement('p');
    meta.className = 'blog-article-meta';
    meta.textContent = p.date;

    /* The descriptions in projects.js are ☩-prefixed bullets separated by
       newlines, so they need pre-line to read as a list rather than as one
       run-on sentence — the same thing .desk-detail .desk-card-desc does for
       the globe's card. */
    const desc = document.createElement('p');
    desc.className = 'proj-desc';
    desc.textContent = p.desc;

    const chips = document.createElement('div');
    chips.className = 'blog-tags';
    (p.chips || []).forEach((c) => {
      const s = document.createElement('span');
      s.textContent = c;
      chips.appendChild(s);
    });

    projectDetailBody.append(art, h1, meta, desc, chips);

    if (p.url) {
      const link = document.createElement('a');
      link.className = 'proj-link';
      link.href = p.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'visit ↗';
      projectDetailBody.appendChild(link);
    }

    projectDetail.scrollTop = 0;
    projectDetail.classList.add('is-open');
    projectDetail.setAttribute('aria-hidden', 'false');
  }

  function closeProject() {
    if (!projectDetail.classList.contains('is-open')) return;
    projectDetail.classList.remove('is-open');
    projectDetail.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('projectBack').addEventListener('click', closeProject);
  document.getElementById('projectsClose').addEventListener('click', closeSection);
  document.getElementById('projectsBtn').addEventListener('click', () => {
    buildProjects();
    openSection('projects');
  });

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
        items.push({
          el: el, figure: figure, extra: 0, index: i,
          sat: -1, z: -1, // last written values, so render can skip no-ops
        });
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

        /* focus: 1 for the card at center, fading out over one stride.
           --sat drives a grayscale() on the card's image, so every write
           rebuilds a filter chain and re-rasterizes a several-hundred-px
           photo. Quantizing to 1/24ths means that happens on the order of
           twenty times a second instead of sixty, which is still finer than
           the eye can follow a desaturation. zIndex is already integral, so
           it only needs writing when it actually changes. */
        const focus = Math.max(0, 1 - Math.abs(x) / geo.stride);
        const sat = Math.round(focus * focus * 24) / 24;
        if (sat !== item.sat) {
          item.sat = sat;
          item.el.style.setProperty('--sat', sat.toFixed(3));
        }
        const z = 100 + Math.round(focus * 100);
        if (z !== item.z) {
          item.z = z;
          item.el.style.zIndex = String(z);
        }
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

     On *intent* rather than at idle, though. Unconditional idle warming meant
     every visit fetched all ~1.9MB of JPEG and ran two dozen img.decode()
     calls — tens of megabytes of bitmap held for the session — even for the
     large majority of readers who never open the gallery, and it landed in
     the window where a slow machine is still settling into the first scroll.
     Pointing at the button is a reliable half-second of warning, and focus
     covers the keyboard path. */
  let warmed = false;
  function warmCarousel() {
    if (warmed) return;
    warmed = true;
    carousel.prepare();
  }

  ['pointerenter', 'pointerdown', 'focus'].forEach((ev) => {
    galleryBtn.addEventListener(ev, warmCarousel, { passive: true });
  });

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
        // peel one layer at a time: the detail view, then the section
        if (blogArticle.classList.contains('is-open')) closeArticle();
        else if (projectDetail.classList.contains('is-open')) closeProject();
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
