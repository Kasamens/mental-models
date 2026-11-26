/* Mental Models hub: scene registry + shared Three.js engine.
 *
 * SCENE CONTRACT (scenes/*.js call this):
 *   MM.register({
 *     id: 'first-principles',          // url hash, ascii-hyphen
 *     day: 1, week: 1,
 *     title: 'First principles',
 *     tagline: 'One sentence: what the model says.',
 *     prompt: 'Short instruction for the interactive, shown above the stage.',
 *     body: '<section>...</section>',  // HTML explainer below the stage (h2/h3/p/.points/.math allowed)
 *     mount(ctx) { ... return { dispose() {} } }  // dispose optional
 *   });
 *
 * ctx = {
 *   THREE, scene, camera, renderer, host,   // host = stage div (position:relative) for HTML overlays
 *   controls,                               // div below stage: put buttons/sliders/readouts here
 *   colors,                                 // live object of THREE.Color: bg, fg, muted, line, accent, warm, bad, good, c1..c4, neutral
 *   css(name),                              // read a CSS token string
 *   reduce,                                 // prefers-reduced-motion
 *   onFrame(fn(dt, t)),                     // per-frame callback; cleared on unmount
 *   onTheme(fn()),                          // called after colors update; cleared on unmount
 *   fit(width, height, target?)             // frame a world-space box of that size with the camera
 *   tag(html) -> el                         // absolutely positioned overlay label; place with ctx.place(el, vec3)
 *   place(el, vec3)                         // projects vec3 to screen and positions el (call each frame)
 *   kit()                                   // shared helpers: theme-tracked materials (std/basic/lineMat), tags, btn/chips/toggle/slider/readout
 * }
 * Everything added to ctx.scene is disposed automatically on unmount, as are overlay tags and controls.
 */
(function () {
  if (!window.THREE) { // three.js CDN failed: say so instead of a blank stage
    window.MM = { register() {} };
    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('stage').innerHTML = '<p class="stage-msg">The 3D library didn\u2019t load. Check your connection and reload the page.</p>';
    });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const scenes = [];
  window.MM = { register: s => scenes.push(s) };

  const host = document.getElementById('stage');
  const controls = document.getElementById('controls');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.prepend(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(38, 2, 0.1, 500);
  let scene = new THREE.Scene();
  const colors = {};
  const TOKENS = { bg: '--bg', fg: '--fg', muted: '--muted', line: '--line', accent: '--accent', warm: '--warm', bad: '--bad', good: '--good', c1: '--c1', c2: '--c2', c3: '--c3', c4: '--c4', neutral: '--neutral' };
  function readColors() { for (const k in TOKENS) colors[k] = new THREE.Color(css(TOKENS[k])); }
  readColors();

  let frameFns = [], themeFns = [], tags = [], current = null, fitBox = null;
  let W = 1, H = 1;

  function addLights(s) {
    s.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.85));
    const d = new THREE.DirectionalLight(0xffffff, 0.75); d.position.set(4, 10, 6); s.add(d);
  }

  function fitCamera() {
    if (!fitBox) return;
    const { w, h, target } = fitBox;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const dist = Math.max((h / 2) / Math.tan(vfov / 2), (w / 2) / Math.tan(hfov / 2)) * 1.12;
    const dir = (fitBox.dir || new THREE.Vector3(0, 0.45, 1)).clone().normalize();
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
  }

  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    fitCamera();
  }
  new ResizeObserver(resize).observe(host);

  const v = new THREE.Vector3();
  const ctx = {
    THREE, renderer, camera, host, controls, colors, css, reduce,
    get scene() { return scene; },
    onFrame: f => frameFns.push(f),
    onTheme: f => themeFns.push(f),
    fit(w, h, target, dir) { fitBox = { w, h, target: target || new THREE.Vector3(), dir }; fitCamera(); },
    tag(html) { const el = document.createElement('div'); el.className = 'tag'; el.innerHTML = html; host.appendChild(el); tags.push(el); return el; },
    place(el, vec) {
      v.copy(vec).project(camera);
      const hidden = v.z > 1;
      el.style.left = ((v.x + 1) / 2 * W) + 'px';
      el.style.top = ((1 - v.y) / 2 * H) + 'px';
      el.style.visibility = hidden ? 'hidden' : '';
    },
  };

  // ---------- shared scene kit (ctx.kit()): theme-tracked materials, overlay tags, controls ----------
  function kit(ctx) {
    const T = ctx.THREE, C = ctx.colors, mats = [], tags = [];
    const K = { T, C };
    const track = (m, key) => { m.userData.key = key; mats.push(m); return m; };
    K.std = (key, o) => track(new T.MeshStandardMaterial(Object.assign({ color: C[key].clone(), roughness: 0.7, metalness: 0.04 }, o)), key);
    K.basic = (key, o) => track(new T.MeshBasicMaterial(Object.assign({ color: C[key].clone() }, o)), key);
    K.lineMat = (key, o) => track(new T.LineBasicMaterial(Object.assign({ color: C[key].clone() }, o)), key);
    K.dashMat = (key, o) => track(new T.LineDashedMaterial(Object.assign({ color: C[key].clone(), dashSize: 0.25, gapSize: 0.18 }, o)), key);
    K.setKey = (m, key) => { m.userData.key = key; m.color.copy(C[key]); };
    K.recolor = () => mats.forEach(m => { if (m.userData.key) m.color.copy(C[m.userData.key]); });
    ctx.onTheme(K.recolor);
    // frame-rate independent easing factor; snaps when reduced motion is on
    K.f = (dt, rate) => ctx.reduce ? 1 : 1 - Math.exp(-(rate || 6) * dt);
    K.V = (x, y, z) => new T.Vector3(x, y, z);

    K.tag = (html, pos) => {
      const el = ctx.tag(html);
      const t = { el, pos: pos.clone(), on: true, h: html };
      t.show = b => { if (t.on !== b) { t.on = b; el.style.display = b ? '' : 'none'; } return t; };
      t.set = h => { if (t.h !== h) { t.h = h; el.innerHTML = h; } return t; };
      tags.push(t);
      return t;
    };
    ctx.onFrame(() => tags.forEach(t => { if (t.on) ctx.place(t.el, t.pos); }));

    K.el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    K.btn = (label, fn, ghost) => {
      const b = K.el('button', 'btn' + (ghost ? ' ghost' : ''), label);
      b.type = 'button'; b.addEventListener('click', fn); ctx.controls.appendChild(b); return b;
    };
    K.chips = (label, opts, init, fn) => {
      const wrap = K.el('div');
      wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', label);
      wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
      const bs = opts.map(o => {
        const b = K.el('button', 'chip', o.label); b.type = 'button';
        b.addEventListener('click', () => { set(o.v); fn(o.v); });
        wrap.appendChild(b); return [o.v, b];
      });
      function set(v) { bs.forEach(([k, b]) => b.setAttribute('aria-pressed', String(k === v))); }
      set(init); ctx.controls.appendChild(wrap);
      return { set };
    };
    K.toggle = (label, init, fn) => {
      const b = K.el('button', 'chip', label); b.type = 'button';
      let on = init; b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', () => { on = !on; b.setAttribute('aria-pressed', String(on)); fn(on); });
      ctx.controls.appendChild(b); return b;
    };
    K.slider = o => {
      const id = 'k-' + Math.random().toString(36).slice(2, 8);
      const f = K.el('div', 'field', `<label for="${id}">${o.label}</label><input id="${id}" type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.value}"><span class="val"></span>`);
      const inp = f.querySelector('input'), val = f.querySelector('.val');
      const upd = () => { const x = parseFloat(inp.value); val.textContent = o.fmt ? o.fmt(x) : x; o.on(x); };
      inp.addEventListener('input', upd);
      ctx.controls.appendChild(f);
      return { input: inp, update: upd };
    };
    K.readout = () => {
      const r = K.el('div', 'readout'); r.setAttribute('aria-live', 'polite'); ctx.controls.appendChild(r);
      queueMicrotask(() => { if (r.parentNode === ctx.controls) ctx.controls.appendChild(r); }); // keep it below the inputs
      return r;
    };
    return K;
  }
  ctx.kit = () => kit(ctx);

  function disposeScene(s) {
    s.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
  }

  function unmount() {
    if (current && current.handle && current.handle.dispose) { try { current.handle.dispose(); } catch (e) { console.error(e); } }
    frameFns = []; themeFns = [];
    tags.forEach(t => t.remove()); tags = [];
    controls.innerHTML = '';
    disposeScene(scene);
    scene = new THREE.Scene(); addLights(scene);
    fitBox = null;
    camera.position.set(0, 4, 12); camera.lookAt(0, 0, 0);
  }

  // ---------- nav + routing ----------
  const nav = document.getElementById('nav');
  const WEEKS = { 1: 'Week 1 \u00b7 The core six', 2: 'Week 2 \u00b7 Better decisions', 3: 'Week 3 \u00b7 How things grow and connect' };

  function buildNav() {
    scenes.sort((a, b) => a.day - b.day);
    let html = '';
    [1, 2, 3].forEach(w => {
      html += `<div class="wk"><span class="eyebrow">${WEEKS[w]}</span><ol>`;
      const days = [];
      scenes.filter(s => s.week === w).forEach(s => days.push({ day: s.day, html: `<li><a href="#${s.id}" data-id="${s.id}"><span class="d">${String(s.day).padStart(2, '0')}</span>${s.title}</a></li>` }));
      days.sort((a, b) => a.day - b.day).forEach(d => html += d.html);
      html += '</ol></div>';
    });
    nav.innerHTML = html;
  }

  function show(id) {
    let s = scenes.find(x => x.id === id), missing = null;
    if (!s) {
      s = scenes[0]; if (!s) return;
      if (id) { try { missing = decodeURIComponent(id); } catch (e) { missing = id; } history.replaceState(null, '', '#' + s.id); } // fix the address so a reload or share lands on a real model
    }
    unmount();
    current = { s };
    document.getElementById('day').textContent = `Day ${s.day} \u00b7 Week ${s.week}`;
    document.getElementById('title').textContent = s.title;
    document.title = `${s.title} \u00b7 Mental Models`;
    host.setAttribute('aria-label', `Interactive 3D illustration: ${s.tagline}`);
    const cur = document.getElementById('nav-current'); if (cur) cur.textContent = `Day ${s.day} \u00b7 ${s.title}`;
    const det = document.getElementById('nav-wrap'); if (det) det.open = !narrow.matches;
    const mainEl = document.querySelector('main');
    if (!reduce) { mainEl.classList.remove('enter'); void mainEl.offsetWidth; mainEl.classList.add('enter'); }
    document.getElementById('tagline').textContent = s.tagline;
    document.getElementById('prompt').textContent = missing
      ? `There’s no model called “${missing}”, so here’s Day ${s.day}. ${s.prompt || ''}`
      : (s.prompt || '');
    document.getElementById('body').innerHTML = s.body || '';
    nav.querySelectorAll('a[data-id]').forEach(a => a.setAttribute('aria-current', a.dataset.id === s.id ? 'page' : 'false'));
    const i = scenes.indexOf(s);
    const prev = scenes[i - 1], next = scenes[i + 1];
    [['m-prev', prev], ['m-next', next]].forEach(([id, sc]) => {
      const a = document.getElementById(id); if (!a) return;
      if (sc) { a.href = '#' + sc.id; a.removeAttribute('aria-disabled'); a.title = `Day ${sc.day}: ${sc.title}`; }
      else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.title = ''; }
    });
    document.getElementById('pager').innerHTML =
      (prev ? `<a href="#${prev.id}">\u2190 Day ${prev.day}: ${prev.title}</a>` : '<span></span>') +
      (next ? `<a href="#${next.id}">Day ${next.day}: ${next.title} \u2192</a>` : '<span></span>');
    resize();
    try { current.handle = s.mount(ctx) || {}; }
    catch (e) { console.error(e); controls.innerHTML = '<p class="readout">This scene failed to load.</p>'; }
    resize();
  }

  // the day list collapses into a disclosure on narrow screens
  const narrow = window.matchMedia('(max-width: 900px)');
  narrow.addEventListener('change', () => { const d = document.getElementById('nav-wrap'); if (d) d.open = !narrow.matches; });
  // on phones the open list is a dropdown: close it on an outside tap or Escape
  document.addEventListener('click', e => { const d = document.getElementById('nav-wrap'); if (narrow.matches && d && d.open && !d.contains(e.target)) d.open = false; });
  document.addEventListener('keydown', e => { const d = document.getElementById('nav-wrap'); if (e.key === 'Escape' && narrow.matches && d && d.open) { d.open = false; d.querySelector('summary').focus(); } });

  // keyboard paging: left/right arrows move between days unless a control has focus
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const a = document.activeElement;
    if (a && a !== document.body && a.matches('input, select, textarea, button, [contenteditable], [role="slider"]')) return;
    const i = scenes.indexOf(current && current.s); const n = scenes[i + (e.key === 'ArrowRight' ? 1 : -1)];
    if (n) { e.preventDefault(); location.hash = n.id; }
  });

  window.addEventListener('hashchange', () => { show(location.hash.slice(1)); document.getElementById('top').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });

  // theme: auto (follow the OS) / light / dark, remembered between visits
  const THEME_KEY = 'mm-theme';
  // data-theme always holds the resolved theme (light/dark); `mode` is the user's choice, where 'auto' follows the OS
  const darkOS = window.matchMedia('(prefers-color-scheme: dark)');
  let mode = 'auto';
  function applyTheme(m) {
    mode = (m === 'light' || m === 'dark') ? m : 'auto';
    const resolved = mode === 'auto' ? (darkOS.matches ? 'dark' : 'light') : mode;
    if (document.documentElement.dataset.theme !== resolved) document.documentElement.dataset.theme = resolved;
    document.querySelectorAll('#theme [data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  }
  let saved = null; try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  applyTheme(saved);
  document.getElementById('theme').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]'); if (!b) return;
    const m = b.dataset.mode; try { m === 'auto' ? localStorage.removeItem(THEME_KEY) : localStorage.setItem(THEME_KEY, m); } catch (err) {}
    applyTheme(m);
  });
  darkOS.addEventListener('change', () => { if (mode === 'auto') applyTheme('auto'); });

  // scenes recolour whenever the resolved theme changes
  function themeChanged() { readColors(); themeFns.forEach(f => f()); }
  new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // loop
  let last = performance.now(), t = 0;
  // skip work while the tab is hidden or the stage is scrolled out of view
  let onScreen = true;
  new IntersectionObserver(es => { onScreen = es[es.length - 1].isIntersecting; }).observe(host);
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || !onScreen) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    for (const f of frameFns) { try { f(dt, t); } catch (e) { console.error(e); frameFns = frameFns.filter(x => x !== f); } }
    renderer.render(scene, camera);
  }

  window.addEventListener('DOMContentLoaded', () => {
    addLights(scene);
    buildNav();
    show(location.hash.slice(1));
    requestAnimationFrame(frame);
  });
})();
