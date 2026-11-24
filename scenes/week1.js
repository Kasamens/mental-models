/* Week 1 scenes: first principles, inversion, second-order thinking,
 * opportunity cost, circle of competence, the map is not the territory.
 * Contract: see the header of app.js. Every number in these scenes is
 * illustrative and is labelled so on the page. */
(function () {
  'use strict';

  /* ---------- shared helpers (local to this file) ---------- */
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
      const id = 'w1-' + Math.random().toString(36).slice(2, 8);
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

  // small deterministic PRNG so layouts are the same on every visit
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const money = v => (v < 0 ? '\u2212$' : '$') + Math.abs(v).toLocaleString('en-US');
  const muted = s => `<span style="color:var(--muted)">${s}</span>`;
  // label with its own backing so it stays readable over coloured geometry
  const pill = (s, c) => `<span style="display:inline-block;background:var(--surface);color:var(--${c || 'fg'});border:1px solid var(--${c || 'line'});border-radius:6px;padding:1px 6px;font-weight:600">${s}</span>`;

  /* ======================================================================
   * Day 1: First principles
   * A battery pack quoted at $600/kWh breaks into piles of raw materials
   * (with commodity costs), then the same parts rebuild into a new design.
   * ==================================================================== */
  MM.register({
    id: 'first-principles',
    day: 1, week: 1,
    title: 'First principles',
    tagline: 'Strip a problem down to what is actually true, then build up from there instead of copying how it is usually done.',
    prompt: 'A battery pack is quoted at $600 per kWh. Break it into its raw materials, then rebuild it from the same parts. (Illustrative numbers.)',
    body: `
<section>
  <h2>What it says</h2>
  <p>Most of the time we reason by analogy: this is how it has been done, so this is how it is done. That is fast and usually fine. First-principles thinking is the slow alternative. You take a thing apart until you reach pieces you are confident are true (physical limits, raw costs, hard constraints), throw away the assumptions stacked on top of them, and rebuild a solution from those pieces alone.</p>
  <p>The idea is old. Aristotle described a first principle as the first basis from which a thing is known. Descartes made a method out of doubting everything he could until only what he could not doubt was left. The modern business version comes from Elon Musk explaining why he thought batteries could get much cheaper: the quoted price of a pack was far above what its metals cost on a commodity exchange.</p>
</section>
<section>
  <h2>A worked example</h2>
  <p>The scene uses that battery story with rounded, illustrative figures. Quoted price: $600 per kWh. Ask what a pack is <em>made of</em> and price each ingredient: nickel, cobalt, lithium, graphite, aluminium, steel, polymers. Together they come to about $80. That doesn't mean a pack should cost $80. Turning metal into cells takes energy, factories and labour. But it moves the question from "why would it ever be cheaper?" to "what exactly are we paying the other $520 for, and which parts of that are habit?"</p>
  <p>The same move works on small things. A $14 cocktail is roughly $2 of ingredients. The other $12 pays for rent, staff and the evening. Once you see that, you can decide which of those parts you actually want.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>It's expensive. Rebuilding every belief from scratch would leave no time to live, so save it for decisions where the usual answer is costly or clearly stuck. It's also only as good as the "truths" you start from: one wrong base fact and the whole rebuild is wrong, but it feels rigorous. And existing solutions often hide knowledge nobody wrote down. Before you knock down a fence because you can't see its purpose, find out why it was put up.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Pick one thing you pay for every month (a phone plan, a gym, takeaway lunches). List its raw inputs and guess what each costs. Then ask what the gap between that total and the price is paying for, and whether you need every part of it.</p>
  </div>
</section>`,
    mount(ctx) {
      const K = kit(ctx), T = K.T, C = ctx.colors, S = ctx.scene;
      // illustrative cost per kWh; q = number of cubes (roughly by mass)
      const PARTS = [
        { n: 'Nickel', k: 'c1', cost: 22, q: 14 },
        { n: 'Cobalt', k: 'c3', cost: 14, q: 6 },
        { n: 'Lithium', k: 'c2', cost: 12, q: 6 },
        { n: 'Graphite', k: 'neutral', cost: 8, q: 8 },
        { n: 'Alum.', k: 'c4', cost: 6, q: 8 },
        { n: 'Steel', k: 'fg', cost: 4, q: 6 },
        { n: 'Other', k: 'warm', cost: 14, q: 6 },
      ];
      const s = 0.6, SP = 1.9;
      const geo = new T.BoxGeometry(0.56, 0.56, 0.56);
      const cubes = [];
      PARTS.forEach((p, pi) => { for (let j = 0; j < p.q; j++) cubes.push({ pi, j }); });
      // assembled order: shuffled, so the block hides what it's made of
      const r = rng(7), order = cubes.map((_, i) => i).sort(() => r() - 0.5);
      cubes.forEach((c, i) => {
        const g = order.indexOf(i);
        c.A = K.V(((g % 6) - 2.5) * s, 0.3 + Math.floor(g / 18) * s, ((Math.floor(g / 6) % 3) - 1) * s);
        c.P = K.V((c.pi - 3) * SP + ((c.j % 2) - 0.5) * s, 0.3 + Math.floor(c.j / 4) * s, (((c.j >> 1) % 2) - 0.5) * s);
        // rebuilt: flat 9 x 6 "skateboard", banded by material
        c.R = K.V(((i % 9) - 4) * s, 0.3, (Math.floor(i / 9) - 2.5) * s);
        c.mat = K.std('accent');
        c.mesh = new T.Mesh(geo, c.mat);
        c.mesh.position.copy(c.A);
        c.delay = 0;
        S.add(c.mesh);
      });
      // processing & assembly layer for the rebuilt design
      const slabMat = K.std('accent', { transparent: true, opacity: 0, depthWrite: false });
      const slab = new T.Mesh(new T.BoxGeometry(9 * s + 0.1, 0.34, 6 * s + 0.1), slabMat);
      slab.position.set(0, 0.6 + 0.17, 0); S.add(slab);
      // floor line
      const floor = new T.Mesh(new T.BoxGeometry(SP * 7, 0.04, 2.2), K.std('line'));
      floor.position.y = -0.02; S.add(floor);

      const quoteTag = K.tag('<b>$600/kWh</b>the quoted price', K.V(0, 2.95, 0));
      const pileTags = PARTS.map((p, pi) => {
        const top = 0.3 + Math.ceil(p.q / 4) * s;
        const pos = pi % 2 === 0 ? K.V((pi - 3) * SP, top + 0.55, 0) : K.V((pi - 3) * SP, -0.25, 1.15);
        return K.tag(`<b>$${p.cost}</b>${p.n}`, pos).show(false);
      });
      const newTag = K.tag('<b>\u2248 $150/kWh</b>$80 parts + $70 making', K.V(0, 2.1, 0)).show(false);

      let state = 0;
      const ro = K.readout();
      const TEXT = [
        'Quoted: <strong>$600 per kWh</strong>. Reasoning by analogy says it has always cost about that, so it always will. Press <em>Break into raw parts</em>.',
        'Raw materials at commodity prices: <strong>$80 per kWh</strong>. The other <strong>$520</strong> isn\u2019t physics. It\u2019s how packs happen to be made today. Illustrative numbers.',
        'Same parts, new design: <strong>\u2248 $150 per kWh</strong> ($80 of materials plus about $70 to process and assemble). That\u2019s a floor you reasoned up to, not a price someone quoted you. Illustrative numbers.',
      ];
      function go(st) {
        state = st;
        cubes.forEach((c, i) => {
          c.delay = ctx.reduce ? 0 : (st === 1 ? i * 0.012 : (cubes.length - i) * 0.008);
          c.target = st === 0 ? c.A : st === 1 ? c.P : c.R;
          c.key = st === 0 ? 'accent' : PARTS[c.pi].k;
        });
        quoteTag.show(st === 0);
        pileTags.forEach(t => t.show(st === 1));
        newTag.show(st === 2);
        ro.innerHTML = TEXT[st];
      }
      K.chips('Stage', [
        { v: 0, label: 'Quoted pack' },
        { v: 1, label: 'Break into raw parts' },
        { v: 2, label: 'Rebuild from parts' },
      ], 0, go);
      go(0);
      cubes.forEach(c => c.mesh.position.copy(c.target));

      ctx.onFrame((dt, t) => {
        const f = K.f(dt, 7);
        cubes.forEach(c => {
          if (c.delay > 0) { c.delay -= dt; return; }
          c.mesh.position.lerp(c.target, f);
          c.mat.color.lerp(C[c.key], f); c.mat.userData.key = c.key;
        });
        slabMat.opacity += ((state === 2 ? 0.38 : 0) - slabMat.opacity) * f;
        slab.visible = slabMat.opacity > 0.01;
      });
      ctx.fit(13.2, 5.6, K.V(0, 1.1, 0), K.V(0, 0.55, 1));
    },
  });

  /* ======================================================================
   * Day 2: Inversion
   * A board between you and a goal. The forward plan is a straight road
   * over hidden pits; inverting ("how would I fail?") reveals them and the
   * route bends around each one.
   * ==================================================================== */
  MM.register({
    id: 'inversion',
    day: 2, week: 1,
    title: 'Inversion',
    tagline: 'Instead of asking how to succeed, ask what would guarantee failure, then avoid those things.',
    prompt: 'Goal: save $10k this year. Walk the hopeful plan, then switch to \u201clist ways to fail\u201d and walk again.',
    body: `
<section>
  <h2>What it says</h2>
  <p>Some problems are easier to solve backwards. Instead of "how do I make this go well?", ask "what would make it go badly, for sure?" The answers to the second question are usually more concrete, easier to list and easier to act on. Then you steer around them.</p>
  <p>The mathematician Carl Jacobi advised his students to "invert, always invert" when stuck: restate a problem in its opposite form. Charlie Munger made it a life rule, joking that all he wanted to know was where he was going to die, so he'd never go there. Psychologist Gary Klein turned it into a team tool, the <em>pre-mortem</em>: imagine the project has already failed, then write the story of why.</p>
</section>
<section>
  <h2>A worked example</h2>
  <p>"How do I save $10k this year?" invites vague answers: be disciplined, spend less. Inverted: "What would make sure I save nothing?" No budget, so you never know where the money goes. Subscriptions you forgot about. Spending every raise. No emergency fund, so one car repair goes on a credit card. Impulse buys on payday. Each of those has an obvious fix, and fixing them gets you most of the way without any heroic willpower.</p>
  <p>In the scene, the forward plan is a straight line because that's what hope draws. It walks straight into the first pit it never looked for.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>Avoiding failure is not the same as succeeding. You can dodge every pit and still never get anywhere if you have no forward plan at all, so use inversion to check a plan, not to replace one. The list of possible failures is also endless. Rank by likely and costly and stop at a handful, or the exercise turns into anxiety.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Pick something you're working on. Set a five-minute timer and write: "It's a year from now and this failed completely. Here's why:" List at least five reasons. Pick the two most likely and decide one thing to do about each this week.</p>
  </div>
</section>`,
    mount(ctx) {
      const K = kit(ctx), T = K.T, S = ctx.scene;
      const NX = 7, NZ = 11, START = [3, 0], GOAL = [3, 10];
      const PITS = [
        { n: 'No budget', cells: [[2, 2], [3, 2], [4, 2]] },
        { n: 'Old subscriptions', cells: [[5, 0], [6, 0]] },
        { n: 'Spending every raise', cells: [[3, 5], [4, 5], [5, 5], [6, 5]] },
        { n: 'No emergency fund', cells: [[0, 7], [1, 7], [2, 7]] },
        { n: 'Payday impulse buys', cells: [[4, 8], [5, 8], [6, 8]] },
      ];
      const pitAt = {};
      PITS.forEach((p, pi) => p.cells.forEach(([i, j]) => { pitAt[i + ',' + j] = pi; }));
      const wpos = (i, j) => K.V(i - 3, 0, 5 - j);

      const tileGeo = new T.BoxGeometry(0.94, 0.25, 0.94);
      const tileMat = K.std('line'), pitMat = K.std('bad'), startMat = K.std('accent');
      const tiles = {};
      for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
        const m = new T.Mesh(tileGeo, (i === START[0] && j === START[1]) ? startMat : tileMat);
        const p = wpos(i, j); m.position.set(p.x, -0.125, p.z);
        m.userData.ty = -0.125;
        S.add(m); tiles[i + ',' + j] = m;
      }
      // goal flag
      const pole = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.5, 8), K.std('fg'));
      const gp = wpos(GOAL[0], GOAL[1]);
      pole.position.set(gp.x, 0.75, gp.z); S.add(pole);
      const flag = new T.Mesh(new T.BoxGeometry(0.6, 0.36, 0.03), K.std('good'));
      flag.position.set(gp.x + 0.32, 1.3, gp.z); S.add(flag);
      // path markers
      const markGeo = new T.CylinderGeometry(0.15, 0.15, 0.04, 16);
      const markMat = K.std('accent');
      const marks = [];
      for (let k = 0; k < 40; k++) { const m = new T.Mesh(markGeo, markMat); m.visible = false; S.add(m); marks.push(m); }
      // walker
      const walker = new T.Mesh(new T.SphereGeometry(0.26, 24, 16), K.std('warm'));
      S.add(walker);

      const pitTags = PITS.map(p => {
        const c = p.cells.reduce((a, [i, j]) => a.add(wpos(i, j)), K.V(0, 0, 0)).multiplyScalar(1 / p.cells.length);
        c.y = 0.6;
        return K.tag(pill(p.n, 'bad'), c).show(false);
      });
      K.tag('<b>Goal</b>$10k saved', K.V(gp.x, 1.95, gp.z));
      K.tag(muted('you'), K.V(wpos(3, 0).x, -0.1, wpos(3, 0).z + 0.75));

      function bfs() {
        const key = (i, j) => i + ',' + j, prev = {}, q = [START];
        prev[key(START[0], START[1])] = null;
        while (q.length) {
          const [i, j] = q.shift();
          if (i === GOAL[0] && j === GOAL[1]) break;
          [[0, 1], [1, 0], [-1, 0], [0, -1]].forEach(([di, dj]) => {
            const a = i + di, b = j + dj, k = key(a, b);
            if (a < 0 || b < 0 || a >= NX || b >= NZ || k in prev || k in pitAt) return;
            prev[k] = [i, j]; q.push([a, b]);
          });
        }
        const path = []; let cur = GOAL;
        while (cur) { path.unshift(cur); cur = prev[key(cur[0], cur[1])]; }
        return path;
      }
      const STRAIGHT = []; for (let j = 0; j < NZ; j++) STRAIGHT.push([3, j]);
      const SAFE = bfs();

      let mode = 'forward', path = STRAIGHT, revealed = new Set(), s = 0, walking = false, fallAt = -1, outcome = null;
      const ro = K.readout();
      function reveal(pi) { revealed.add(pi); }
      function showPath() {
        marks.forEach((m, k) => {
          m.visible = k < path.length;
          if (m.visible) { const p = wpos(path[k][0], path[k][1]); m.position.set(p.x, 0.02, p.z); }
        });
        K.setKey(markMat, mode === 'forward' ? 'accent' : 'good');
      }
      function text() {
        if (mode === 'forward') {
          if (outcome === 'fell') return `Fell into <strong>${PITS[pitAt[path[fallAt].join(',')]].n}</strong> after ${fallAt} steps. You never looked for it, so you never saw it. Switch to <em>List ways to fail</em>.`;
          return 'The forward plan: one straight road from here to the goal. It looks clear because you only drew the road you hope for. Press <em>Walk it</em>.';
        }
        if (outcome === 'arrived') return `Made it in <strong>${path.length - 1} steps</strong>, a longer road than the straight line\u2019s 10, by avoiding the failures rather than relying on willpower.`;
        return `Inverted: you asked \u201cwhat would guarantee I save nothing?\u201d and listed <strong>${PITS.length} ways</strong>. Now the route bends around every one. Press <em>Walk it</em>.`;
      }
      function reset() {
        walking = false; s = 0; outcome = null; fallAt = -1;
        revealed = new Set(mode === 'invert' ? PITS.map((_, i) => i) : []);
        path = mode === 'forward' ? STRAIGHT : SAFE;
        showPath(); ro.innerHTML = text();
      }
      function walk() {
        reset();
        fallAt = path.findIndex(c => (c.join(',') in pitAt));
        walking = true;
        if (ctx.reduce) finishWalk();
      }
      function finishWalk() {
        walking = false;
        if (fallAt >= 0) { s = fallAt; outcome = 'fell'; reveal(pitAt[path[fallAt].join(',')]); }
        else { s = path.length - 1; outcome = 'arrived'; }
        ro.innerHTML = text();
      }
      K.chips('Plan', [{ v: 'forward', label: 'Path to success' }, { v: 'invert', label: 'List ways to fail' }], 'forward', v => { mode = v; reset(); });
      K.btn('Walk it', walk);
      K.btn('Reset', reset, true);
      reset();

      const tmp = K.V(0, 0, 0);
      let wy = 0.26;
      ctx.onFrame((dt, t) => {
        const f = K.f(dt, 8);
        if (walking) {
          s += dt * 3.2;
          const end = fallAt >= 0 ? fallAt : path.length - 1;
          if (s >= end) { s = end; finishWalk(); }
        }
        const k = Math.min(Math.floor(s), path.length - 1), fr = s - k;
        const a = wpos(path[k][0], path[k][1]), b = wpos(...(path[Math.min(k + 1, path.length - 1)]));
        tmp.copy(a).lerp(b, fr);
        const falling = outcome === 'fell';
        wy += ((falling ? -0.7 : 0.26 + (walking && !ctx.reduce ? Math.abs(Math.sin(s * Math.PI)) * 0.18 : 0)) - wy) * (falling ? K.f(dt, 5) : 1);
        walker.position.set(tmp.x, wy, tmp.z);
        walker.visible = wy > -0.6;
        for (const key in pitAt) {
          const m = tiles[key], on = revealed.has(pitAt[key]);
          m.material = on ? pitMat : tileMat;
          m.position.y += ((on ? -0.55 : -0.125) - m.position.y) * f;
        }
        pitTags.forEach((tg, i) => tg.show(revealed.has(i)));
      });
      ctx.fit(8.4, 10.6, K.V(0, 0.2, 0.1), K.V(0, 1.25, 1));
    },
  });

  /* ======================================================================
   * Day 3: Second-order thinking
   * A decision dropped in a pond. Ripples reach 1st, 2nd and 3rd-order rings
   * as time passes; each consequence is marked good or bad, and the running
   * total often flips sign.
   * ==================================================================== */
  const SECOND = {
    price: {
      label: 'Cut prices 30%', short: 'Cut prices 30%', nodes: [
        ['Sales jump', 2], ['Thinner margins', -1],
        ['Rivals match the price', -1], ['More volume', 1], ['Less to reinvest', -1], ['Customers wait for sales', -1],
        ['Price war: everyone poorer', -2], ['Lower unit costs', 1], ['Product falls behind', -2], ['Full price stops working', -1],
      ],
    },
    gym: {
      label: 'Start exercising', short: 'Start exercising', nodes: [
        ['Sore and tired', -1], ['Less free time', -1],
        ['Sleep better', 1], ['Body adapts', 1], ['Drop a habit you won\u2019t miss', 1], ['Routine sticks', 1],
        ['More energy all day', 2], ['Stronger at 60', 2], ['Evenings used better', 1], ['Confidence carries over', 1],
      ],
    },
    tickets: {
      label: 'Pay the team per ticket closed', short: 'Pay per ticket', nodes: [
        ['Tickets close fast', 2], ['Dashboards look great', 1],
        ['Big jobs split into tiny tickets', -1], ['Hard bugs get dodged', -2], ['Managers trust the number', -1], ['People learn to game it', -1],
        ['Metric means nothing', -2], ['Quality drops', -2], ['Decisions made on bad data', -2], ['Best people leave', -2],
      ],
    },
  };
  MM.register({
    id: 'second-order-thinking',
    day: 3, week: 1,
    title: 'Second-order thinking',
    tagline: 'Every action has consequences, and those consequences have consequences. Keep asking \u201cand then what?\u201d',
    prompt: 'Pick a decision and drag time forward. Watch how the verdict changes as 2nd- and 3rd-order effects arrive. (Weights are illustrative.)',
    body: `
<section>
  <h2>What it says</h2>
  <p>First-order thinking stops at the immediate result: cut prices, sell more. Second-order thinking keeps going. What will people do in response to that result, and what happens after <em>that</em>? The first effect is usually the one you intended. The later ones are where the surprises live, and they often point the other way.</p>
  <p>The economist Fr\u00e9d\u00e9ric Bastiat wrote about it in 1850 as "what is seen and what is not seen": a broken window makes work for the glazier (seen) but takes money from whatever the owner would otherwise have bought (not seen). Ecologist Garrett Hardin boiled it down to one question, "and then what?" Investor Howard Marks calls it second-level thinking: the obvious first-level view is already in the price, so the edge is in the next step.</p>
</section>
<section>
  <h2>A worked example</h2>
  <p>The classic cautionary tale, possibly more legend than history, is the "cobra effect". A government pays a bounty for dead cobras to reduce their number. First order: people kill cobras. Second order: people start breeding cobras for the bounty. Third order: the bounty is scrapped, breeders release their now-worthless snakes, and there are more cobras than before.</p>
  <p>It cuts both ways. Starting to exercise looks bad at first (sore, tired, less free time) and only shows a payoff further out. Many good decisions look like mistakes at first, and many bad ones look like wins.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>Each step out is less certain than the last. By the third order you're guessing, and if you insist on mapping every branch you'll never decide anything. Use it to find the <em>direction</em> of the big effects and whether you could undo the decision if you're wrong. You aren't trying to predict the future exactly.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Take one decision you're facing this week. Write the obvious result, then ask "and then what?" twice more, noting who reacts and how. Mark each effect + or \u2212. Does the sign of the total change by the third line?</p>
  </div>
</section>`,
    mount(ctx) {
      const K = kit(ctx), T = K.T, S = ctx.scene;
      const R = [0, 2.6, 4.7, 6.8];
      const deg = d => d * Math.PI / 180;
      // tree: two 1st-order, each with two 2nd-order, each with one 3rd-order
      const ANG = [0, 180, -30, 30, 150, 210, -64, 64, 116, 244];
      const ORD = [1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
      const PAR = [-1, -1, 0, 0, 1, 1, 2, 3, 4, 5];
      const pos = ANG.map((a, i) => K.V(R[ORD[i]] * Math.cos(deg(a)), 0.32, R[ORD[i]] * Math.sin(deg(a))));

      const pond = new T.Mesh(new T.CircleGeometry(7.6, 72), K.std('line', { transparent: true, opacity: 0.55 }));
      pond.rotation.x = -Math.PI / 2; S.add(pond);
      const rings = [1, 2, 3].map(o => {
        const m = new T.Mesh(new T.RingGeometry(R[o] - 0.035, R[o] + 0.035, 120), K.basic('muted', { transparent: true, opacity: 0 }));
        m.rotation.x = -Math.PI / 2; m.position.y = 0.01; S.add(m); return m;
      });
      const waves = [0, 1, 2].map(() => {
        const m = new T.Mesh(new T.RingGeometry(0.96, 1, 120), K.basic('accent', { transparent: true, opacity: 0, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.y = 0.02; S.add(m); return m;
      });
      const stone = new T.Mesh(new T.DodecahedronGeometry(0.5), K.std('accent'));
      stone.position.y = 0.3; S.add(stone);
      const nodeGeo = new T.SphereGeometry(0.28, 24, 16);
      const nodes = pos.map((p, i) => {
        const m = new T.Mesh(nodeGeo, K.std('good')); m.position.copy(p); m.scale.setScalar(0.001); S.add(m);
        const from = PAR[i] < 0 ? K.V(0, 0.3, 0) : pos[PAR[i]];
        const lm = K.lineMat('muted', { transparent: true, opacity: 0 });
        const line = new T.Line(new T.BufferGeometry().setFromPoints([from, p]), lm); S.add(line);
        const tag = K.tag('', p.clone().add(K.V(0, 0.75, 0))).show(false);
        return { m, lm, tag, a: 0 };
      });
      const stoneTag = K.tag('', K.V(0, 0.1, 1.35));
      ['1st order', '2nd order', '3rd order'].forEach((s, i) => K.tag(muted(s), K.V(0, 0.05, R[i + 1] - 0.05)));

      let sc = 'price', time = 1;
      const ro = K.readout();
      function apply() {
        const d = SECOND[sc];
        stoneTag.set(pill(d.short, 'accent'));
        nodes.forEach((n, i) => {
          const [txt, v] = d.nodes[i];
          K.setKey(n.m.material, v > 0 ? 'good' : 'bad');
          n.tag.set(`<b style="color:var(--${v > 0 ? 'good' : 'bad'})">${v > 0 ? '+' : '\u2212'}${Math.abs(v)}</b>${txt}`);
        });
        readout();
      }
      const appear = i => Math.max(0, Math.min(1, (time - (ORD[i] - 0.45)) / 0.4));
      function readout() {
        const d = SECOND[sc];
        const vis = d.nodes.filter((_, i) => appear(i) >= 0.5);
        if (!vis.length) { ro.innerHTML = 'Today: only the decision itself. Drag time forward to see who reacts.'; return; }
        const net = vis.reduce((a, n) => a + n[1], 0);
        const first = d.nodes.slice(0, 2).reduce((a, n) => a + n[1], 0);
        const maxOrd = Math.max(...d.nodes.map((_, i) => appear(i) >= 0.5 ? ORD[i] : 0));
        const verdict = net > 0 ? 'looks like a good call' : net < 0 ? 'looks like a mistake' : 'looks like a wash';
        let s = `Counting up to ${['', '1st', '2nd', '3rd'][maxOrd]}-order effects: <strong>net ${net > 0 ? '+' : net < 0 ? '\u2212' : ''}${Math.abs(net)}</strong>, so it ${verdict}.`;
        if (maxOrd === 3) s += ` The first-order view said <strong>${first > 0 ? '+' : '\u2212'}${Math.abs(first)}</strong>. ${Math.sign(first) !== Math.sign(net) ? 'The sign flipped.' : 'Same direction, but a very different size.'}`;
        ro.innerHTML = s + ' Weights are illustrative.';
      }
      K.chips('Decision', Object.keys(SECOND).map(k => ({ v: k, label: SECOND[k].label })), sc, v => { sc = v; apply(); });
      const when = x => x < 0.5 ? 'today' : x < 1.5 ? 'about a month: 1st-order effects' : x < 2.5 ? 'about a year: 2nd-order effects' : 'years out: 3rd-order effects';
      K.slider({ label: 'Time since the decision', min: 0, max: 3, step: 0.01, value: time, fmt: when, on: x => { time = x; readout(); } }).update();
      apply();
      nodes.forEach((n, i) => { n.a = appear(i); });

      let clock = 0;
      ctx.onFrame((dt) => {
        const f = K.f(dt, 7);
        clock += dt;
        nodes.forEach((n, i) => {
          n.a += (appear(i) - n.a) * f;
          n.m.scale.setScalar(Math.max(0.001, n.a));
          n.lm.opacity = n.a * 0.8;
          n.tag.show(n.a > 0.5);
        });
        rings.forEach((m, i) => { m.material.opacity = 0.15 + 0.5 * Math.max(0, Math.min(1, time - i)); });
        const reach = 0.6 + time * 2.15;
        waves.forEach((m, k) => {
          if (ctx.reduce) { m.visible = false; return; }
          const p = (clock * 0.3 + k / 3) % 1;
          m.visible = true;
          m.scale.setScalar(Math.max(0.01, p * reach));
          m.material.opacity = (1 - p) * 0.55;
        });
        if (!ctx.reduce) stone.rotation.y += dt * 0.3;
      });
      ctx.fit(15.4, 11, K.V(0, 0, 0.3), K.V(0, 1.7, 1));
    },
  });

  /* ======================================================================
   * Day 4: Opportunity cost
   * $10,000 at a fork with four paths. Choosing one lights it and ghosts the
   * rest; the best path not taken is the real price of the choice.
   * ==================================================================== */
  MM.register({
    id: 'opportunity-cost',
    day: 4, week: 1,
    title: 'Opportunity cost',
    tagline: 'The real cost of a choice is the best thing you gave up to make it.',
    prompt: 'You have $10,000 and a $10,000 credit-card balance at 20%. Pick a path and see what it really cost. (Illustrative 5-year figures.)',
    body: `
<section>
  <h2>What it says</h2>
  <p>Every yes is a no to something else. The price tag of a choice is what you pay, but its cost includes the value of the best alternative you didn't take. That part is easy to ignore, because the road you didn't take leaves no receipt.</p>
  <p>The Austrian economist Friedrich von Wieser named the idea in the early 1900s, building on Bastiat's "what is not seen". It's behind the line "there's no such thing as a free lunch": even a free meal costs the hour you spent eating it.</p>
</section>
<section>
  <h2>A worked example</h2>
  <p>In the scene you hold $10,000 and also owe $10,000 on a card at 20% a year. Leaving the cash in savings earns about $250 over five years, which feels like a gain. Putting it in an index fund might make around $4,000. Paying off the card avoids roughly $14,900 of interest, a guaranteed 20% return that almost nothing else beats. Measured against that best alternative, "safe" savings leaves you about $14,650 worse off. (All figures are rounded and illustrative.)</p>
  <p>Note what's counted: the <em>single best</em> option given up, not the sum of all of them. You could only have taken one road.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>The value of a road not taken is always an estimate, and often a flattering one, which can feed endless regret. Many alternatives (rest, friendship, fun) don't convert neatly into money. And weighing every option for every small choice is a cost too: your time. Save it for choices that are large, lasting or repeated.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Before your next purchase over $50 or your next "yes" to a weekly commitment, finish the sentence: "Instead, I could have\u2026" with one specific alternative. If that alternative sounds better, you've just found the cost.</p>
  </div>
</section>`,
    mount(ctx) {
      const K = kit(ctx), T = K.T, S = ctx.scene;
      const OPTS = [
        { n: 'Leave it in savings', t: 'Savings', s: '0.5% a year', v: 250, k: 'c2' },
        { n: 'Index fund', t: 'Index fund', s: '~7% a year', v: 4000, k: 'c1' },
        { n: 'Pay off the 20% card', t: 'Pay off card', s: 'interest avoided', v: 14900, k: 'c3' },
        { n: 'Upgrade the car', t: 'New car', s: 'depreciation', v: -3500, k: 'bad' },
      ];
      const START = K.V(0, 0, 3.8);
      const ends = [-4.5, -1.5, 1.5, 4.5].map(x => K.V(x, 0, -2.6));
      const maxV = 14900, HMAX = 3.2;
      const startPad = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.12, 40), K.std('accent'));
      startPad.position.copy(START).setY(0.06); S.add(startPad);
      const token = new T.Mesh(new T.SphereGeometry(0.3, 24, 16), K.std('warm'));
      token.position.copy(START).setY(0.42); S.add(token);
      const towerGeo = new T.CylinderGeometry(0.55, 0.55, 1, 36);
      const opts = OPTS.map((o, i) => {
        const d = ends[i].clone().sub(START), len = d.length();
        const pm = K.std('neutral', { transparent: true, opacity: 0.6 });
        const pathM = new T.Mesh(new T.BoxGeometry(len, 0.06, 0.42), pm);
        pathM.position.copy(START).addScaledVector(d, 0.5).setY(0.03);
        pathM.rotation.y = -Math.atan2(d.z, d.x); S.add(pathM);
        const tm = K.std(o.k, { transparent: true, opacity: 0.25 });
        const h = Math.max(0.08, Math.abs(o.v) / maxV * HMAX);
        const tower = new T.Mesh(towerGeo, tm);
        tower.scale.set(1, h, 1);
        tower.position.copy(ends[i]).setY(o.v >= 0 ? h / 2 : -h / 2); S.add(tower);
        const em = K.std('line', { transparent: true, opacity: 0.25 });
        const endPad = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 0.06, 36), em);
        endPad.position.copy(ends[i]).setY(0.03); S.add(endPad);
        const tag = K.tag('', ends[i].clone().setY(o.v >= 0 ? h + 1.3 : 0.8));
        return { o, pm, tm, em, tag, h };
      });
      K.tag('<b>$10,000</b>' + muted('5 years'), START.clone().add(K.V(0, -0.2, 1.15)));

      let chosen = 0, showForgone = true;
      const ro = K.readout();
      function update() {
        const others = opts.map((_, i) => i).filter(i => i !== chosen);
        const best = others.reduce((a, i) => OPTS[i].v > OPTS[a].v ? i : a, others[0]);
        opts.forEach((p, i) => {
          const o = p.o, val = `<b>${o.v >= 0 ? '+' : ''}${money(o.v)}</b>${o.t}<br>`;
          if (i === chosen) p.tag.set(val + muted(o.s)).show(true);
          else if (!showForgone) p.tag.show(false);
          else p.tag.set(val + (i === best ? '<span style="color:var(--warm);font-weight:600">your real cost</span>' : muted('forgone'))).show(true);
          p.best = i === best;
        });
        const c = OPTS[chosen], b = OPTS[best], gap = c.v - b.v;
        if (!showForgone) {
          ro.innerHTML = `You see only what you picked: <strong>${c.v >= 0 ? '+' : ''}${money(c.v)}</strong>. Nothing looks lost, and that\u2019s how opportunity costs hide. Turn the forgone paths back on.`;
        } else if (gap >= 0) {
          ro.innerHTML = `You picked <strong>${c.n}</strong>: ${c.v >= 0 ? '+' : ''}${money(c.v)}. The best road you gave up was ${b.n} at ${money(b.v)}, so this choice beats its opportunity cost by <strong>${money(gap)}</strong>. Illustrative figures.`;
        } else {
          ro.innerHTML = `You picked <strong>${c.n}</strong>: ${c.v >= 0 ? '+' : ''}${money(c.v)}. But the best road you gave up was <strong>${b.n}</strong> at ${money(b.v)}. That\u2019s the real price: you end up <strong>${money(-gap)} behind</strong> your best option. It counts only the best alternative, not the sum of all of them. Illustrative figures.`;
        }
      }
      K.chips('Choose a path', OPTS.map((o, i) => ({ v: i, label: o.n })), chosen, v => { chosen = v; update(); });
      K.toggle('Show what I gave up', showForgone, on => { showForgone = on; update(); });
      update();
      const tokenTarget = K.V(0, 0, 0);
      let first = true;
      ctx.onFrame((dt, t) => {
        const f = K.f(dt, 5);
        opts.forEach((p, i) => {
          const isC = i === chosen;
          const tOp = isC ? 1 : showForgone ? (p.best ? 0.45 : 0.2) : 0.04;
          p.tm.opacity += (tOp - p.tm.opacity) * f;
          p.pm.opacity += ((isC ? 0.95 : showForgone ? 0.3 : 0.12) - p.pm.opacity) * f;
          p.pm.color.lerp(ctx.colors[isC ? 'accent' : 'neutral'], f); p.pm.userData.key = isC ? 'accent' : 'neutral';
          p.em.opacity = p.pm.opacity * 0.6;
          p.tm.depthWrite = p.tm.opacity > 0.9;
        });
        tokenTarget.copy(ends[chosen]).setY(0.42 + (OPTS[chosen].v >= 0 ? opts[chosen].h : 0));
        if (first) { token.position.copy(tokenTarget); first = false; }
        token.position.lerp(tokenTarget, K.f(dt, 3.5));
      });
      ctx.fit(12, 8, K.V(0, 1.3, 0.3), K.V(0, 0.75, 1));
    },
  });

  /* ======================================================================
   * Day 5: Circle of competence
   * Questions sit on a plain at a distance from your real experience. You
   * set how far you claim to know; inside the claim you act, outside you
   * defer. Claims past your real edge turn into confident mistakes.
   * ==================================================================== */
  MM.register({
    id: 'circle-of-competence',
    day: 5, week: 1,
    title: 'Circle of competence',
    tagline: 'Know what you really know, and act differently inside that circle than outside it.',
    prompt: 'You\u2019re a nurse with ten years on a ward. Drag the circle to set how far you claim to know, then reveal your real edge.',
    body: `
<section>
  <h2>What it says</h2>
  <p>Everyone has areas where their judgment is genuinely good, built from years of practice and feedback. Around them is a wide space where they only feel like they know. The model says to draw that boundary honestly. Act with confidence inside it, slow down at the edge, and outside it either learn properly or hand the call to someone whose circle it is.</p>
  <p>Warren Buffett popularised it in his 1996 shareholder letter, arguing that the size of your circle matters far less than knowing exactly where it ends. Long before that, IBM's Thomas Watson said much the same: he was smart in spots, and he stayed around those spots.</p>
</section>
<section>
  <h2>A worked example</h2>
  <p>A nurse with ten years on a ward can spot early sepsis and dose common drugs better than most doctors fresh out of school. That's well inside the circle. Reading a tricky ECG sits near the edge. A dietary plan for diabetes is just outside it. Picking stocks or fixing a roof are far outside. The danger isn't the far questions, which are obviously "not my area". It's the ones just past the edge, which feel familiar enough to answer with confidence.</p>
  <p>In the scene, claiming too much turns those near questions red: confident mistakes. Claiming too little is safer but wasteful, because you defer on things you actually know.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>The edge is hard to see from the inside. The less you know about a field, the less you can tell how much you're missing, so self-assessment is least reliable exactly where it matters most. Get outside feedback: a track record, a test, someone who will say "that's wrong". And the circle only grows if you sometimes step out of it on purpose, somewhere mistakes are cheap. Used as an excuse never to learn, it shrinks you.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Write three questions you'd bet a week's pay on answering correctly, three you'd feel fairly sure about, and three you'd pass on. For the middle three, what single piece of evidence would show you're wrong? Those are your edge.</p>
  </div>
</section>`,
    mount(ctx) {
      const K = kit(ctx), T = K.T, S = ctx.scene;
      const REAL = 3.2;
      const Q = [
        ['Spot early sepsis', 1.0, 200], ['Dose a common drug', 1.7, 320], ['Calm a scared patient', 2.3, 75],
        ['Read a tricky ECG', 2.9, 150], ['Diet plan for diabetes', 3.7, 20], ['Run the hospital budget', 4.7, 250],
        ['Pick a stock', 5.6, 118], ['Fix a leaking roof', 6.3, 300],
      ].map(([n, d, a]) => ({ n, d, a: a * Math.PI / 180, tagged: true }));
      const r = rng(11);
      for (let i = 0; i < 24; i++) Q.push({ d: 0.5 + r() * 6.3, a: r() * Math.PI * 2, tagged: false });

      const board = new T.Mesh(new T.CircleGeometry(7.3, 80), K.std('line'));
      board.rotation.x = -Math.PI / 2; S.add(board);
      const discMat = K.basic('accent', { transparent: true, opacity: 0.18, depthWrite: false });
      const disc = new T.Mesh(new T.CircleGeometry(1, 96), discMat);
      disc.rotation.x = -Math.PI / 2; disc.position.y = 0.015; S.add(disc);
      const rimMat = K.basic('accent', { transparent: true, opacity: 0.95 });
      let rim = null;
      function setRim(rad) {
        if (rim) { S.remove(rim); rim.geometry.dispose(); }
        rim = new T.Mesh(new T.RingGeometry(Math.max(0.01, rad - 0.05), rad + 0.05, 128), rimMat);
        rim.rotation.x = -Math.PI / 2; rim.position.y = 0.025; S.add(rim);
      }
      // the real edge: a dashed ring built from short arcs, hidden until revealed
      const realLine = new T.Group(), arcMat = K.basic('warm');
      for (let i = 0; i < 36; i++) {
        const arc = new T.Mesh(new T.RingGeometry(REAL - 0.07, REAL + 0.07, 6, 1, i / 36 * Math.PI * 2, Math.PI * 2 / 36 * 0.6), arcMat);
        arc.rotation.x = -Math.PI / 2; realLine.add(arc);
      }
      realLine.position.y = 0.035; realLine.visible = false; S.add(realLine);
      const realTag = K.tag(pill('your real edge', 'warm'), K.V(0, 0.1, -REAL)).show(false);
      const claimTag = K.tag(pill('you claim', 'accent'), K.V(0, 0.1, 2));

      Q.forEach(q => {
        const h = q.tagged ? 0.85 : 0.3 + r() * 0.35;
        q.m = new T.Mesh(new T.CylinderGeometry(q.tagged ? 0.17 : 0.12, q.tagged ? 0.17 : 0.12, h, 16), K.std('neutral'));
        q.m.position.set(Math.cos(q.a) * q.d, h / 2, Math.sin(q.a) * q.d); S.add(q.m);
        if (q.tagged) q.tag = K.tag(q.n, q.m.position.clone().setY(h + 0.35));
      });

      let claim = 4.5, shown = 4.5, reveal = false;
      const ro = K.readout();
      function classify(rad) {
        let right = 0, wrong = 0, pass = 0, knew = 0;
        Q.forEach(q => {
          if (q.d <= rad) { if (q.d <= REAL) right++; else wrong++; }
          else { pass++; if (q.d <= REAL) knew++; }
        });
        return { right, wrong, pass, knew };
      }
      function text() {
        const c = classify(claim);
        let s = `Inside your claimed circle: <strong>${c.right} right</strong>, <strong>${c.wrong} confident mistake${c.wrong === 1 ? '' : 's'}</strong>. Outside it you said \u201cnot my area\u201d <strong>${c.pass}</strong> times${c.knew ? `, including <strong>${c.knew}</strong> you actually knew` : ''}. `;
        if (Math.abs(claim - REAL) < 0.35) s += 'You\u2019re close to your real edge. The size of the circle matters less than knowing where it ends.';
        else if (claim > REAL) s += 'You\u2019re claiming past your edge. The red answers cost the most: you acted sure and were wrong.';
        else s += 'Safe but small: you\u2019re passing up questions you could have answered.';
        if (!reveal) s += ' Reveal your real edge to see where the line actually is.';
        ro.innerHTML = s;
      }
      K.slider({ label: 'How far you claim to know', min: 0.5, max: 6.8, step: 0.1, value: claim, fmt: x => x < REAL - 0.35 ? 'modest' : x <= REAL + 0.35 ? 'about right' : x < 5 ? 'stretching' : 'expert in everything', on: x => { claim = x; text(); } }).update();
      K.toggle('Reveal your real edge', reveal, on => { reveal = on; realLine.visible = on; realTag.show(on); text(); });
      setRim(shown);
      disc.scale.setScalar(shown);
      let lastRim = shown;

      ctx.onFrame((dt, t) => {
        shown += (claim - shown) * K.f(dt, 8);
        disc.scale.setScalar(shown);
        if (Math.abs(shown - lastRim) > 0.01) { setRim(shown); lastRim = shown; }
        claimTag.pos.set(0, 0.1, shown + 0.3);
        if (!ctx.reduce) discMat.opacity = 0.16 + 0.05 * Math.sin(t * 2);
        Q.forEach(q => {
          const key = q.d <= shown ? (q.d <= REAL ? 'good' : 'bad') : 'neutral';
          if (q.m.material.userData.key !== key) K.setKey(q.m.material, key);
        });
      });
      ctx.fit(15, 9, K.V(0, 0, 0.3), K.V(0, 1.35, 1));
    },
  });

  /* ======================================================================
   * Day 6: The map is not the territory
   * A detailed terrain with a flat map hovering above it. The map's
   * resolution decides which features survive the averaging; one feature
   * (a washed-out bridge) is never on the map at any resolution.
   * ==================================================================== */
  MM.register({
    id: 'map-territory',
    day: 6, week: 1,
    title: 'The map is not the territory',
    tagline: 'Every model, plan or number is a simplification of reality. Useful, but never the thing itself.',
    prompt: 'Drag the map\u2019s resolution and see which features of the ground survive. Then look at the map alone, the way a map-reader does.',
    body: `
<section>
  <h2>What it says</h2>
  <p>A map is useful because it leaves things out. It shrinks the world, smooths it and freezes it at the moment it was made. That's fine as long as you remember it happened. Trouble starts when people forget they're looking at a summary and treat the map's silence as proof that nothing is there.</p>
  <p>The phrase comes from Alfred Korzybski, a Polish-American scholar, in 1931. Jorge Luis Borges took it to its absurd end in a one-paragraph story about an empire whose cartographers drew a map as large as the empire itself. It was perfectly accurate and completely useless, and it was left to rot in the desert. Statistician George Box put the same point another way: all models are wrong, some are useful.</p>
</section>
<section>
  <h2>A worked example</h2>
  <p>The scene's ground has a big hill, a lake, a ridge, a narrow ravine and a sinkhole. A coarse map averages them away. Only the hill survives a 4 \u00d7 4 grid. Finer maps catch more, but they get harder to read, and some things are smaller than any map you'd bother to make. One problem shows up at no resolution at all: the bridge on the map's road washed out last week. The map isn't too coarse there. It's out of date.</p>
  <p>Everyday versions: a satnav routing you onto a closed road; a sales dashboard showing green while customers quietly leave; a CV versus the actual person; your bank balance versus the bill that hasn't cleared yet.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>The lesson isn't "throw away maps". You can't act without simplifying, and a map as detailed as the ground is no map at all. The useful habits are to know what your map leaves out, know how old it is, and go and look at the ground when the stakes are high or the map and your eyes disagree.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Pick one number you check regularly: your weight, a step count, a team metric. Write three things that matter which that number can't see, and one way it could look fine while the reality gets worse.</p>
  </div>
</section>`,
    mount(ctx) {
      const K = kit(ctx), T = K.T, S = ctx.scene, C = ctx.colors;
      const MAPY = 5.3, HALF = 5;
      function segD2(x, z, ax, az, bx, bz) {
        const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
        const px = ax + t * dx - x, pz = az + t * dz - z; return px * px + pz * pz;
      }
      const g2 = (x, z, cx, cz, sd) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * sd * sd));
      function H(x, z) {
        let h = 0.12 * Math.sin(x * 1.3 + 0.5) * Math.cos(z * 1.1);
        h += 1.7 * g2(x, z, -2.3, -1.6, 1.2);                                  // hill
        h -= 0.9 * g2(x, z, 2.8, -2.3, 0.75);                                  // lake
        h += 0.75 * Math.exp(-segD2(x, z, -4.4, 3.0, -0.8, 3.8) / (2 * 0.28 * 0.28)); // ridge
        if (z > -1.2) h -= Math.min(1, (z + 1.2) / 0.7) * 1.0 * Math.exp(-((x - 1.4) ** 2) / (2 * 0.1 * 0.1)); // ravine
        h -= 0.8 * g2(x, z, -0.3, 0.4, 0.11);                                 // sinkhole
        return h;
      }
      const tmpC = new T.Color();
      function ramp(h, out) {
        if (h < -0.25) return out.copy(C.c2);
        if (h < 0.6) return out.copy(C.c4).lerp(C.neutral, (h + 0.25) / 0.85);
        return out.copy(C.neutral).lerp(C.warm, Math.min(1, (h - 0.6) / 1.0));
      }

      // territory
      const tg = new T.PlaneGeometry(HALF * 2, HALF * 2, 160, 160);
      tg.rotateX(-Math.PI / 2);
      const tp = tg.attributes.position;
      const tcol = new Float32Array(tp.count * 3);
      for (let i = 0; i < tp.count; i++) tp.setY(i, H(tp.getX(i), tp.getZ(i)));
      tg.computeVertexNormals();
      tg.setAttribute('color', new T.BufferAttribute(tcol, 3));
      function paintTerrain() {
        for (let i = 0; i < tp.count; i++) { ramp(tp.getY(i), tmpC); tcol[i * 3] = tmpC.r; tcol[i * 3 + 1] = tmpC.g; tcol[i * 3 + 2] = tmpC.b; }
        tg.attributes.color.needsUpdate = true;
      }
      paintTerrain();
      const terrain = new T.Mesh(tg, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 }));
      S.add(terrain);

      // road on the ground, broken by the ravine at the bridge
      const ground = new T.Group(); S.add(ground);
      const roadMat = K.lineMat('fg');
      const roadPts = (a, b) => { const p = []; for (let x = a; x <= b + 1e-6; x += 0.1) p.push(K.V(x, H(x, 2) + 0.05, 2)); return p; };
      ground.add(new T.Line(new T.BufferGeometry().setFromPoints(roadPts(-5, 1.1)), roadMat));
      ground.add(new T.Line(new T.BufferGeometry().setFromPoints(roadPts(1.7, 5)), roadMat));
      const stubGeo = new T.BoxGeometry(0.2, 0.05, 0.34), stubMat = K.std('fg');
      [1.18, 1.62].forEach(x => { const m = new T.Mesh(stubGeo, stubMat); m.position.set(x, H(x, 2) + 0.03, 2); ground.add(m); });
      ground.add(terrain); // so "map only" hides both

      // the map
      const mapGroup = new T.Group();
      mapGroup.position.set(0, MAPY, -5); mapGroup.rotation.x = 0.38; mapGroup.scale.setScalar(0.72);
      S.add(mapGroup); mapGroup.updateMatrixWorld(true);
      // dashed guides from each ground corner to the matching map corner
      const guideMat = K.dashMat('muted', { dashSize: 0.15, gapSize: 0.15 });
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => {
        const top = mapGroup.localToWorld(K.V(a * HALF, 0, b * HALF));
        const l = new T.Line(new T.BufferGeometry().setFromPoints([K.V(a * HALF, H(a * HALF, b * HALF), b * HALF), top]), guideMat);
        l.computeLineDistances(); S.add(l);
      });
      const mapMat = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide });
      let mapMesh = null, N = 4;
      function buildMap(n) {
        if (mapMesh) { mapGroup.remove(mapMesh); mapMesh.geometry.dispose(); }
        const cell = HALF * 2 / n, inset = Math.min(0.03, cell * 0.04);
        const pos = new Float32Array(n * n * 18), col = new Float32Array(n * n * 18);
        let k = 0;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const x0 = -HALF + i * cell, z0 = -HALF + j * cell;
          let sum = 0, cnt = 0;
          for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) { sum += H(x0 + (a + 0.5) * cell / 6, z0 + (b + 0.5) * cell / 6); cnt++; }
          ramp(sum / cnt, tmpC);
          const xa = x0 + inset, xb = x0 + cell - inset, za = z0 + inset, zb = z0 + cell - inset;
          [[xa, za], [xa, zb], [xb, za], [xb, za], [xa, zb], [xb, zb]].forEach(([x, z]) => {
            pos[k] = x; pos[k + 1] = 0; pos[k + 2] = z;
            col[k] = tmpC.r; col[k + 1] = tmpC.g; col[k + 2] = tmpC.b; k += 3;
          });
        }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(pos, 3));
        g.setAttribute('color', new T.BufferAttribute(col, 3));
        mapMesh = new T.Mesh(g, mapMat); mapGroup.add(mapMesh);
      }
      const frame = new T.LineLoop(new T.BufferGeometry().setFromPoints([K.V(-HALF, 0.01, -HALF), K.V(HALF, 0.01, -HALF), K.V(HALF, 0.01, HALF), K.V(-HALF, 0.01, HALF)]), K.lineMat('fg'));
      mapGroup.add(frame);
      const mapRoad = new T.Mesh(new T.BoxGeometry(HALF * 2, 0.02, 0.16), K.basic('fg'));
      mapRoad.position.set(0, 0.03, 2);
      mapGroup.add(mapRoad);

      const FEAT = [
        { n: 'Hill', p: [-2.3, -1.6], size: 3 },
        { n: 'Lake', p: [2.8, -2.3], size: 1.8 },
        { n: 'Ridge', p: [-2.6, 3.4], size: 0.9 },
        { n: 'Ravine', p: [1.4, 4.2], size: 0.4 },
        { n: 'Sinkhole', p: [-0.3, 0.4], size: 0.25 },
        { n: 'Bridge out', p: [1.4, 2], size: 0, never: true },
      ];
      FEAT.forEach(f => { f.tag = K.tag('', K.V(f.p[0], Math.max(H(f.p[0], f.p[1]), 0) + 0.45, f.p[1])); });
      const mapTag = K.tag('', mapGroup.localToWorld(K.V(0, 0, HALF)).add(K.V(0, -0.55, 0)));
      const RES = [2, 4, 8, 16, 32];
      let mapOnly = false;
      const ro = K.readout();
      const onMap = f => !f.never && (HALF * 2 / N) <= f.size * 1.1;
      function update() {
        buildMap(N);
        mapTag.set(`<b>The map</b>${N} \u00d7 ${N} cells`);
        FEAT.forEach(f => {
          const ok = onMap(f);
          f.tag.set(pill(`${f.n}: ${f.never ? 'never on map' : ok ? 'on map' : 'missing'}`, ok ? 'good' : 'bad')).show(!mapOnly);
        });
        ground.visible = !mapOnly;
        const shown = FEAT.filter(onMap).map(f => f.n.toLowerCase());
        const missed = FEAT.filter(f => !f.never && !onMap(f)).map(f => f.n.toLowerCase());
        const list = a => a.length ? a.join(', ') : 'nothing';
        if (mapOnly) {
          ro.innerHTML = `This is all a map-reader sees: <strong>${N * N} coloured squares</strong> and a clear road straight across. No ravine, no broken bridge. Nothing on the map is false, but plenty is missing.`;
        } else {
          ro.innerHTML = `<strong>${N} \u00d7 ${N}</strong> map (${(N * N).toLocaleString('en-US')} cells) shows: ${list(shown)}. Misses: ${list(missed)}. Never shown at any resolution: <strong>the bridge that washed out last week</strong>. The map is older than the ground.` +
            (N >= 32 ? ' At this detail the map is nearly as hard to read as the ground itself.' : '');
        }
      }
      K.slider({ label: 'Map resolution', min: 0, max: 4, step: 1, value: 1, fmt: x => `${RES[x]} \u00d7 ${RES[x]} cells`, on: x => { N = RES[x]; update(); } }).update();
      K.toggle('Look at the map only', mapOnly, on => { mapOnly = on; update(); });
      ctx.onTheme(() => { paintTerrain(); buildMap(N); });

      ctx.fit(12.4, 12.4, K.V(0, 2.8, -1.2), K.V(0, 0.55, 1));
    },
  });
})();
