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
 * }
 * Everything added to ctx.scene is disposed automatically on unmount, as are overlay tags and controls.
 */
(function () {
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
  const EXTERNAL = { 10: { title: "Hanlon's razor", href: 'hanlons-razor.html' } };

  function buildNav() {
    scenes.sort((a, b) => a.day - b.day);
    let html = '';
    [1, 2, 3].forEach(w => {
      html += `<div class="wk"><span class="eyebrow">${WEEKS[w]}</span><ol>`;
      const days = [];
      scenes.filter(s => s.week === w).forEach(s => days.push({ day: s.day, html: `<li><a href="#${s.id}" data-id="${s.id}"><span class="d">${String(s.day).padStart(2, '0')}</span>${s.title}</a></li>` }));
      Object.entries(EXTERNAL).forEach(([d, e]) => { if (Math.ceil(d / 7) === w) days.push({ day: +d, html: `<li><a href="${e.href}"><span class="d">${d}</span>${e.title}</a></li>` }); });
      days.sort((a, b) => a.day - b.day).forEach(d => html += d.html);
      html += '</ol></div>';
    });
    nav.innerHTML = html;
  }

  function show(id) {
    const s = scenes.find(x => x.id === id) || scenes[0];
    if (!s) return;
    unmount();
    current = { s };
    document.getElementById('day').textContent = `Day ${s.day} \u00b7 Week ${s.week}`;
    document.getElementById('title').textContent = s.title;
    document.getElementById('tagline').textContent = s.tagline;
    document.getElementById('prompt').textContent = s.prompt || '';
    document.getElementById('body').innerHTML = s.body || '';
    nav.querySelectorAll('a[data-id]').forEach(a => a.setAttribute('aria-current', a.dataset.id === s.id ? 'page' : 'false'));
    const i = scenes.indexOf(s);
    const prev = scenes[i - 1], next = scenes[i + 1];
    document.getElementById('pager').innerHTML =
      (prev ? `<a href="#${prev.id}">\u2190 Day ${prev.day}: ${prev.title}</a>` : '<span></span>') +
      (next ? `<a href="#${next.id}">Day ${next.day}: ${next.title} \u2192</a>` : '<span></span>');
    resize();
    try { current.handle = s.mount(ctx) || {}; }
    catch (e) { console.error(e); controls.innerHTML = '<p class="readout">This scene failed to load.</p>'; }
    resize();
  }

  window.addEventListener('hashchange', () => { show(location.hash.slice(1)); document.getElementById('top').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });

  // theme
  function themeChanged() { readColors(); themeFns.forEach(f => f()); }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeChanged);
  new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // loop
  let last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    for (const f of frameFns) { try { f(dt, t); } catch (e) { console.error(e); frameFns = frameFns.filter(x => x !== f); } }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('DOMContentLoaded', () => {
    addLights(scene);
    buildNav();
    show(location.hash.slice(1));
    requestAnimationFrame(frame);
  });
})();
