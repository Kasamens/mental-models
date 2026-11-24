/* Week 2 \u00b7 Better decisions: days 8, 9, 11, 12, 13.
 * Day 10 (Hanlon's razor) is an external page linked from the hub; it is not built here.
 * Every number in these scenes is illustrative, chosen to show the mechanism, not measured data.
 */
(function () {
  if (!window.MM || !window.THREE) return;

  // ---------- shared helpers ----------
  let uid = 0;
  function ui(ctx) {
    const c = ctx.controls;
    return {
      button(label, fn, ghost) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn' + (ghost ? ' ghost' : ''); b.textContent = label;
        b.addEventListener('click', fn); c.appendChild(b); return b;
      },
      chips(label, opts, init, fn, multi) {
        const g = document.createElement('div');
        g.setAttribute('role', 'group'); g.setAttribute('aria-label', label);
        g.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center';
        const l = document.createElement('span');
        l.textContent = label; l.style.cssText = 'font-size:0.85rem;font-weight:600;margin-right:4px';
        g.appendChild(l);
        const state = multi ? new Set(init || []) : null;
        const btns = opts.map(o => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'chip'; b.textContent = o.label;
          b.setAttribute('aria-pressed', String(multi ? state.has(o.value) : o.value === init));
          b.addEventListener('click', () => {
            if (multi) {
              if (state.has(o.value)) state.delete(o.value); else state.add(o.value);
              b.setAttribute('aria-pressed', String(state.has(o.value)));
              fn(state);
            } else {
              btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
              fn(o.value);
            }
          });
          g.appendChild(b); return b;
        });
        c.appendChild(g); return g;
      },
      slider(label, o, fn) {
        const id = 'w2s' + (++uid);
        const f = document.createElement('div'); f.className = 'field';
        f.innerHTML = `<label for="${id}">${label}</label><input type="range" id="${id}" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.value}"><span class="val"></span>`;
        const inp = f.querySelector('input'), val = f.querySelector('.val');
        const show = () => { val.textContent = o.fmt ? o.fmt(+inp.value) : inp.value; };
        inp.addEventListener('input', () => { show(); fn(+inp.value); });
        show(); c.appendChild(f); return inp;
      },
      readout(live) {
        const p = document.createElement('p'); p.className = 'readout';
        if (live) p.setAttribute('aria-live', 'polite');
        c.appendChild(p); return p;
      },
    };
  }

  // Materials that follow the theme: mat('accent') etc. Colours always come from ctx.colors.
  function palette(ctx) {
    const T = ctx.THREE, list = [];
    function mat(key, extra) {
      const m = new T.MeshStandardMaterial(Object.assign({ roughness: 0.62, metalness: 0.05 }, extra || {}));
      m.color.copy(ctx.colors[key]); list.push([m, key]); return m;
    }
    mat.line = (key, extra) => {
      const m = new T.LineBasicMaterial(extra || {}); m.color.copy(ctx.colors[key]); list.push([m, key]); return m;
    };
    ctx.onTheme(() => list.forEach(([m, k]) => m.color.copy(ctx.colors[k])));
    return mat;
  }

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  function normCdf(z) { // Abramowitz\u2013Stegun
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }
  const pct = x => (x * 100).toFixed(x > 0 && x < 0.01 ? 2 : x < 0.1 ? 1 : 0) + '%';
  const num = n => n.toLocaleString('en-GB');
  const ease = (dt, k) => 1 - Math.exp(-k * dt);

  // =====================================================================
  // Day 8 \u00b7 Probabilistic thinking: a Galton board
  // =====================================================================
  MM.register({
    id: 'probabilistic-thinking', day: 8, week: 2,
    title: 'Probabilistic thinking',
    tagline: 'Think in odds and ranges, not single predictions: any one outcome is noise, but the pattern over many is something you can plan on.',
    prompt: 'Drop one ball and try to call where it lands. Then drop a thousand. The slider changes the odds of bouncing right at each peg.',
    body: `
<section>
  <h2>What it says</h2>
  <p>Most things you care about are not yes-or-no certainties. They are spreads of possible outcomes, some more likely than others. Probabilistic thinking means swapping "will it happen?" for "how likely is it, and what is the range?", then making choices that hold up across that range.</p>
  <p>The board above is the whole idea in miniature. Each ball makes twelve left-or-right bounces. Nobody can tell you where the next ball goes. But drop a thousand and they build almost exactly the shape the warm ticks predict. Individual outcomes are unpredictable; the distribution is not.</p>
  <div class="points">
    <div><h3>Ranges, not points</h3><p>"Probably 25 minutes, 1 day in 10 it's 45" is more useful than "25 minutes".</p></div>
    <div><h3>Judge the bet, not the result</h3><p>A good decision can land badly. One ball in an unlikely bin doesn't mean the odds were wrong.</p></div>
    <div><h3>Update as you go</h3><p>New evidence should nudge your numbers, not flip them from 0% to 100%.</p></div>
  </div>
</section>
<section>
  <h2>Where it comes from</h2>
  <p>Modern probability started in 1654, when Blaise Pascal and Pierre de Fermat traded letters about how to split the stakes of an unfinished gambling game. Thomas Bayes and Pierre-Simon Laplace later turned it into a method for updating beliefs on evidence. Francis Galton built the bean machine you see here in the 1870s to show how many small random pushes add up to a predictable bell curve. Annie Duke's <em>Thinking in Bets</em> (2018) popularised the everyday version: treat decisions as bets and stop "resulting", judging a choice only by how it turned out.</p>
</section>
<section>
  <h2>An everyday example</h2>
  <p>A forecast says 30% chance of rain and it stays dry. The forecaster wasn't wrong; on days they say 30%, it should rain about 3 times in 10. You can only check a probability over many cases, exactly like the board. The same goes for your own plans: if a job interview "probably" goes well, decide what you'd do in the 3-in-10 case where it doesn't, before it happens.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>The board is honest: every bounce is independent and the odds never change. Real life is less polite. Odds drift, events move together (in 2008, mortgages that were "unlikely" to fail together did exactly that), and rare extremes can be far bigger than a bell curve suggests. Precise-looking numbers can also give false confidence; "about 70%" is often all you really know. And when one bad outcome would ruin you, the average across many tries doesn't help, because you only get one.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Set the slider to 70% and press "Drop 1" five times, guessing the bin each time. Then drop 1,000 and watch the mismatch figure shrink. Off the screen: write down one thing you're "sure" happens this week, put a percentage on it, and check at the end of the week.</p>
  </div>
</section>`,
    mount(ctx) {
      const T = ctx.THREE, S = ctx.scene, mat = palette(ctx), U = ui(ctx), R = rng(8);
      const ROWS = 12, BINS = ROWS + 1, SP = 0.5, DY = 0.3, TOP = 6.1, BAR_H = 2.4;
      const bx = k => (k - ROWS / 2) * SP, rowY = r => TOP - r * DY;
      let p = 0.5, pmf = [], counts = new Array(BINS).fill(0), total = 0, queue = 0, active = [], last = -1, maxFrac = 1;

      // backboard
      const board = new T.Mesh(new T.PlaneGeometry(BINS * SP + 0.6, TOP + 1.2), mat('line', { transparent: true, opacity: 0.35 }));
      board.position.set(0, (TOP + 0.6) / 2 - 0.1, -0.2); S.add(board);
      // pegs
      const pegGeo = new T.CylinderGeometry(0.055, 0.055, 0.28, 10); pegGeo.rotateX(Math.PI / 2);
      const pegs = new T.InstancedMesh(pegGeo, mat('neutral'), (ROWS * (ROWS + 1)) / 2);
      const m4 = new T.Matrix4(); let n = 0;
      for (let r = 0; r < ROWS; r++) for (let j = 0; j <= r; j++) { m4.makeTranslation((j - r / 2) * SP, rowY(r), 0); pegs.setMatrixAt(n++, m4); }
      S.add(pegs);
      // bin walls + floor
      const wallGeo = new T.BoxGeometry(0.035, BAR_H, 0.3), wallMat = mat('neutral');
      for (let k = -1; k < BINS; k++) { const w = new T.Mesh(wallGeo, wallMat); w.position.set(bx(k) + SP / 2, BAR_H / 2, 0); S.add(w); }
      const floor = new T.Mesh(new T.BoxGeometry(BINS * SP + 0.1, 0.06, 0.34), wallMat); floor.position.y = -0.03; S.add(floor);
      // bars (observed) + ticks (expected)
      const barGeo = new T.BoxGeometry(SP * 0.76, 1, 0.2); barGeo.translate(0, 0.5, 0);
      const tickGeo = new T.BoxGeometry(SP * 0.94, 0.055, 0.32);
      const barMat = mat('c1'), tickMat = mat('warm');
      const bars = [], ticks = [];
      for (let k = 0; k < BINS; k++) {
        const b = new T.Mesh(barGeo, barMat); b.position.x = bx(k); b.scale.y = 0.001; S.add(b); bars.push(b);
        const t = new T.Mesh(tickGeo, tickMat); t.position.x = bx(k); S.add(t); ticks.push(t);
      }
      // balls
      const CAP = 600;
      const balls = new T.InstancedMesh(new T.SphereGeometry(0.085, 12, 8), mat('accent'), CAP);
      balls.count = 0; balls.instanceMatrix.setUsage(T.DynamicDrawUsage); S.add(balls);

      const tL = ctx.tag('0 of 12<br>bounced right'), tR = ctx.tag('12 of 12<br>bounced right');
      const tExp = ctx.tag('expected shape'), tTop = ctx.tag('drop');
      const vL = new T.Vector3(bx(0), -0.45, 0), vR = new T.Vector3(bx(ROWS), -0.45, 0), vE = new T.Vector3(), vT = new T.Vector3(0, TOP + 0.85, 0);

      function computePmf() {
        pmf = []; let c = 1;
        for (let k = 0; k <= ROWS; k++) { pmf.push(c * Math.pow(p, k) * Math.pow(1 - p, ROWS - k)); c = c * (ROWS - k) / (k + 1); }
      }
      const barTop = k => bars[k].scale.y;
      function layout() {
        const fr = counts.map(c => total ? c / total : 0);
        maxFrac = Math.max(...pmf, ...fr);
        let peak = 0;
        for (let k = 0; k < BINS; k++) {
          bars[k].scale.y = Math.max(fr[k] / maxFrac * BAR_H, 0.001);
          ticks[k].position.y = pmf[k] / maxFrac * BAR_H;
          if (pmf[k] > pmf[peak]) peak = k;
        }
        vE.set(bx(peak), ticks[peak].position.y + 0.32, 0.2);
      }
      const ro = U.readout(true);
      function readout() {
        if (!total) {
          ro.innerHTML = `No balls yet. Each ball makes 12 left/right bounces. The warm ticks mark where balls should pile up in the long run, but nobody can tell you where the <em>next</em> one goes.`;
          return;
        }
        let mean = 0, tv = 0;
        for (let k = 0; k < BINS; k++) { mean += k * counts[k]; tv += Math.abs(counts[k] / total - pmf[k]); }
        mean /= total; tv /= 2;
        ro.innerHTML = `<strong>${num(total)}</strong> ball${total > 1 ? 's' : ''}${queue || active.length ? ' so far' : ''}. ` +
          (last >= 0 ? `Last one landed in bin ${last}: only <strong>${pct(pmf[last])}</strong> of balls should land there. ` : '') +
          `Average: <strong>${mean.toFixed(2)}</strong> right-bounces (expected ${(ROWS * p).toFixed(1)}). ` +
          `Mismatch with the expected shape: <strong>${pct(tv)}</strong>, and it shrinks as the count grows.`;
      }
      function makeBall() {
        const pts = [[0, TOP + 0.55]]; let k = 0;
        for (let r = 0; r < ROWS; r++) { pts.push([(k - r / 2) * SP, rowY(r) + 0.13]); if (R() < p) k++; }
        pts.push([bx(k), rowY(ROWS) + 0.05]);
        return { pts, k, u: 0 };
      }
      function land(k) { counts[k]++; total++; last = k; }
      function reset() { counts.fill(0); total = 0; queue = 0; active = []; last = -1; balls.count = 0; computePmf(); layout(); readout(); }

      U.button('Drop 1', () => { queue += 1; });
      U.button('Drop 100', () => { queue += 100; }, true);
      U.button('Drop 1,000', () => { queue += 1000; }, true);
      U.button('Clear', reset, true);
      U.slider('Chance of bouncing right at each peg', { min: 10, max: 90, step: 5, value: 50, fmt: v => v + '%  (resets the board)' }, v => { p = v / 100; reset(); });

      let dirty = false, roTimer = 0;
      ctx.onFrame((dt) => {
        if (queue) {
          if (ctx.reduce) {
            while (queue) { queue--; land(makeBall().k); } dirty = true;
          } else {
            const bulk = queue > 20 || active.length > 20;
            const want = bulk ? Math.ceil(260 * dt) : (active.length ? 0 : 1);
            for (let i = 0; i < want && queue && active.length < CAP; i++) { const b = makeBall(); b.speed = bulk ? 30 : 10; active.push(b); queue--; }
          }
        }
        const segs = ROWS + 2;
        for (let i = active.length - 1; i >= 0; i--) {
          const b = active[i]; b.u += b.speed * dt;
          if (b.u >= segs) { land(b.k); active.splice(i, 1); dirty = true; }
        }
        balls.count = active.length;
        active.forEach((b, i) => {
          const s = Math.min(Math.floor(b.u), segs - 1), f = b.u - s;
          const a = b.pts[s], c = s + 1 < b.pts.length ? b.pts[s + 1] : [bx(b.k), barTop(b.k) + 0.09];
          const hop = s >= 1 && s <= ROWS ? Math.sin(Math.PI * f) * 0.1 : 0;
          m4.makeTranslation(a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f + hop, 0.12);
          balls.setMatrixAt(i, m4);
        });
        balls.instanceMatrix.needsUpdate = true;
        if (dirty) { layout(); dirty = false; roTimer -= dt; if (roTimer <= 0 || (!queue && !active.length)) { readout(); roTimer = 0.2; } }
        ctx.place(tL, vL); ctx.place(tR, vR); ctx.place(tExp, vE); ctx.place(tTop, vT);
      });

      computePmf(); layout(); readout();
      ctx.fit(BINS * SP + 1.6, TOP + 2.2, new T.Vector3(0, TOP / 2 + 0.3, 0), new T.Vector3(0, 0.12, 1));
    },
  });

  // =====================================================================
  // Day 9 \u00b7 Occam's razor: explanations as towers of assumptions
  // =====================================================================
  MM.register({
    id: 'occams-razor', day: 9, week: 2,
    title: "Occam's razor",
    tagline: 'When several explanations fit the facts, prefer the one that needs the fewest assumptions, because every extra assumption is another way to be wrong.',
    prompt: 'Your lawn is wet this morning. Each block is an assumption one explanation needs. Test the towers, then add evidence and see which story still stands.',
    body: `
<section>
  <h2>What it says</h2>
  <p>Faced with competing explanations that all account for what you see, start with the one that makes the fewest assumptions. It isn't that simple stories are always true. It's that each extra assumption has to hold <em>as well</em>, and chances multiply. Four assumptions that are each 80% likely only all hold about 41% of the time.</p>
  <div class="math">P(explanation holds) = P(a\u2081) \u00d7 P(a\u2082) \u00d7 \u2026 \u00d7 P(a\u2099)
1 assumption at 80%  \u2192 80%
2 assumptions at 80% \u2192 64%
4 assumptions at 80% \u2192 41%</div>
  <p>That is what the towers show: every block is a part that can fail, and a tower with more blocks collapses more often.</p>
</section>
<section>
  <h2>Where it comes from</h2>
  <p>It's named after William of Ockham, a 14th-century English friar and logician who argued against piling up unnecessary entities in explanations. The famous wording, "entities must not be multiplied beyond necessity", was written down by later scholars. Isaac Newton's first rule of reasoning says much the same: admit no more causes than are true and enough to explain what you see.</p>
</section>
<section>
  <h2>An everyday example</h2>
  <p>Your laptop has become slow. Explanation one: you have 40 browser tabs open. Explanation two: a hacker has installed hidden mining software that only runs when you're watching. The second could be true, but it needs a hacker, a reason to target you, software that evades your antivirus, and some odd timing. Close the tabs first. It's cheap to check and needs one assumption.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>The razor picks the simplest explanation <em>that fits all the evidence</em>, not the simplest one overall. Switch on both evidence chips above: "it rained" would now need rain that somehow missed the street and your car, while the four-block prank story fits everything. The world is sometimes genuinely complicated (biology, economics, most of history), and "simpler" is slippery: count the assumptions, not the words. Treat the razor as a guide to what to test first, not as proof.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Press "Test 1,000 times" with no evidence, then with "Street is dry", then with both chips. Notice the winner changes. Next time something goes wrong at home or work, write three explanations, count each one's assumptions, and check the cheapest one first.</p>
  </div>
</section>`,
    mount(ctx) {
      const T = ctx.THREE, S = ctx.scene, mat = palette(ctx), U = ui(ctx), R = rng(9);
      const X = [-3.1, 0, 3.1], BH = 0.66, PLINTH = 0.25;
      const colMat = [mat('c1'), mat('c2'), mat('c3')], oddMat = mat('warm'), badMat = mat('bad');
      const blockGeo = new T.BoxGeometry(1.3, 0.6, 1.1), plinthGeo = new T.BoxGeometry(2.1, PLINTH, 1.6), plinthMat = mat('neutral');
      X.forEach(x => { const pl = new T.Mesh(plinthGeo, plinthMat); pl.position.set(x, PLINTH / 2, 0); S.add(pl); });
      const ground = new T.Mesh(new T.PlaneGeometry(11, 4), mat('line')); ground.rotation.x = -Math.PI / 2; S.add(ground);

      let p = 0.8, ev = new Set(), cols = [], results = null;
      const NAMES = ['It rained', 'Sprinkler', 'A prank'];
      function assumptions() {
        const rain = [['Rain overnight', p, 'Rain']];
        const spr = [['Timer was set', p, 'Timer set'], ['Timer fired', p, 'It fired']];
        const prank = [['Someone had a motive', p, 'Motive'], ['Came at night', p, 'At night'], ['Brought a hose', p, 'Hose'], ['Left no trace', p, 'No trace']];
        if (ev.has('dry')) rain.push(['Rain missed the street', 0.03, 'Missed street']);
        if (ev.has('car')) { spr.push(['Spray reached the car', 0.05, 'Hit car']); prank.push(['Hosed the car too', p, 'Hosed car']); }
        return [rain, spr, prank];
      }
      function build() {
        cols.forEach(c => { c.blocks.forEach(b => { S.remove(b.mesh); b.tag.remove(); }); c.tag.remove(); });
        results = null;
        cols = assumptions().map((list, ci) => {
          const narrow = ctx.host.clientWidth < 600;
          const blocks = list.map(([name, prob, short], i) => {
            const odd = prob < 0.2;
            const mesh = new T.Mesh(blockGeo, odd ? oddMat : colMat[ci]);
            const y = PLINTH + BH * i + 0.3;
            mesh.position.set(X[ci], y, 0); S.add(mesh);
            const tag = ctx.tag(narrow ? (prob < 0.2 ? `${short} ${pct(prob)}` : short) : `${name} \u00b7 ${pct(prob)}`);
            return { mesh, tag, prob, odd, base: y, ty: y, tz: 0, tr: 0, failed: false, ci, v: new T.Vector3() };
          });
          const prod = list.reduce((a, [, q]) => a * q, 1);
          return { blocks, prod, tag: ctx.tag(''), v: new T.Vector3(), status: '' };
        });
        labels(); readout();
      }
      function labels() {
        cols.forEach((c, ci) => {
          const n = c.blocks.length;
          let line = `${n} assumption${n > 1 ? 's' : ''}`;
          if (results) line = `held ${num(results[ci])} / 1,000`;
          else if (c.status) line = c.status;
          c.tag.innerHTML = `<b>${pct(c.prod)}</b>${NAMES[ci]} \u00b7 ${line}`;
        });
      }
      function restore() {
        cols.forEach(c => c.blocks.forEach(b => { b.ty = b.base; b.tz = 0; b.tr = 0; b.failed = false; b.mesh.material = b.odd ? oddMat : colMat[b.ci]; }));
      }
      function testOnce() {
        restore(); results = null;
        cols.forEach(c => {
          let fallen = 0;
          c.blocks.forEach(b => {
            if (R() > b.prob) { b.failed = true; fallen++; b.mesh.material = badMat; b.ty = 0.3; b.tz = 1.35; b.tr = 0.5; }
            else b.ty = b.base - fallen * BH;
          });
          c.status = fallen ? `collapsed (${fallen} failed)` : 'held this time';
        });
        labels(); readout(true);
      }
      function testMany() {
        restore(); cols.forEach(c => { c.status = ''; });
        results = cols.map(c => { let held = 0; for (let t = 0; t < 1000; t++) if (c.blocks.every(b => R() <= b.prob)) held++; return held; });
        labels(); readout();
      }
      const ro = U.readout(true);
      function readout(once) {
        const ranked = cols.map((c, i) => ({ i, v: results ? results[i] / 1000 : c.prod })).sort((a, b) => b.v - a.v);
        const best = ranked[0].i, bestN = cols[best].blocks.length;
        let s = '';
        if (results) s = `Over 1,000 tests: ${cols.map((c, i) => `${NAMES[i]} held <strong>${num(results[i])}</strong>`).join(', ')}. `;
        else if (once) s = `One test is luck: run it a few times, or test 1,000 times. `;
        else s = `Chance every assumption holds: ${cols.map((c, i) => `${NAMES[i]} <strong>${pct(c.prod)}</strong>`).join(', ')}. `;
        s += `Best supported right now: <strong>${NAMES[best]}</strong> (${bestN} block${bestN > 1 ? 's' : ''}).`;
        if (ev.size && best !== 0) s += ` The one-block story no longer fits all the evidence: it needs a near-impossible extra block (warm), so a longer story wins.`;
        else if (!ev.size) s += ` Same per-block odds everywhere, so the shortest tower wins.`;
        s += ' <em>Illustrative odds.</em>';
        ro.innerHTML = s;
      }

      U.button('Test once', testOnce);
      U.button('Test 1,000 times', testMany, true);
      U.chips('Evidence:', [{ label: 'Street is dry', value: 'dry' }, { label: 'Car roof is wet too', value: 'car' }], [], s => { ev = s; build(); }, true);
      U.slider('How likely is each ordinary assumption?', { min: 50, max: 98, step: 1, value: 80, fmt: v => v + '%' }, v => { p = v / 100; build(); });

      ctx.onFrame((dt) => {
        const k = ctx.reduce ? 1 : ease(dt, 9);
        cols.forEach(c => {
          let top = PLINTH;
          c.blocks.forEach(b => {
            const m = b.mesh;
            m.position.y += (b.ty - m.position.y) * k;
            m.position.z += (b.tz - m.position.z) * k;
            m.rotation.z += (b.tr - m.rotation.z) * k;
            b.v.set(m.position.x, m.position.y, m.position.z + 0.6);
            ctx.place(b.tag, b.v);
            if (!b.failed) top = Math.max(top, b.ty + 0.3);
          });
          c.v.set(X[cols.indexOf(c)], Math.max(top, PLINTH + BH * c.blocks.length) + 0.75, 0);
          ctx.place(c.tag, c.v);
        });
      });

      build();
      ctx.fit(10, 6.6, new T.Vector3(0, 2.6, 0), new T.Vector3(0, 0.32, 1));
    },
  });

  // =====================================================================
  // Day 11 \u00b7 Sunk cost fallacy: a tower on a sinking foundation
  // =====================================================================
  MM.register({
    id: 'sunk-cost-fallacy', day: 11, week: 2,
    title: 'Sunk cost fallacy',
    tagline: "Money and time already spent are gone whatever you do next, so they shouldn't decide what you do next. Only future costs and future value count.",
    prompt: "You're renovating a house to sell. Grey floors are money already spent; the outlined block is what's still left to pay. Keep building, or walk away?",
    body: `
<section>
  <h2>What it says</h2>
  <p>A sunk cost is anything you've already paid and can't get back: money, time, effort. The fallacy is letting it push you to keep going ("I've put so much in already"). A clean decision compares only what lies ahead: what will it cost from here, and what will it be worth? The past appears on both sides of that comparison, so it cancels out.</p>
  <div class="math">Finish:  \u2212 cost still to pay + value when done
Stop:    0
Already spent: in both lines, so it changes nothing</div>
  <p>In the scene, every "Keep building" turns some future cost into sunk cost (grey), and the foundation keeps sinking, which raises the remaining bill and lowers the final value. The grey pile grows, and walking away feels worse each time. The lit numbers are the only ones that should matter.</p>
</section>
<section>
  <h2>Where it comes from</h2>
  <p>Economists have long said sunk costs should be ignored. Hal Arkes and Catherine Blumer showed in 1985 how hard that is: theatre-goers who paid full price for a season ticket went to more plays than those randomly given a discount, even though the money was spent either way. It's also called the Concorde fallacy, after the British and French governments kept funding the supersonic jet long after it was clear it would never pay its way.</p>
</section>
<section>
  <h2>An everyday example</h2>
  <p>You're an hour into a film you're not enjoying. The ticket is paid for whatever you do. The only question is whether the next hour is better spent watching or leaving. The same logic applies to a course you've stopped believing in, a relationship you stay in "because of the years", or a car you keep repairing because of the last three repairs.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>Don't overcorrect. Press "Keep building" once or twice: at first, finishing still pays, and quitting then would be a mistake of its own. The rule isn't "quit when it's hard"; it's "decide on what's ahead". And sometimes past effort really does change the future: you've learned things, a half-built thing has resale value, or keeping your word has value of its own. Those count, because they're future benefits. The past spend itself still doesn't.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Click "Keep building" until the verdict changes, then try walking away one step earlier and one step later. Then pick something you're persisting with and ask: "If someone handed me this today, exactly as it is, for free, would I take on what it still costs?"</p>
  </div>
</section>`,
    mount(ctx) {
      const T = ctx.THREE, S = ctx.scene, mat = palette(ctx), U = ui(ctx);
      // illustrative script, in \u00a3k: remaining cost rises with overruns, value falls as the foundation sinks
      const REM = [20, 22, 27, 35, 45, 60, 75, 95];
      const VAL = [80, 75, 70, 65, 60, 55, 50, 45];
      const START = 40, FH = 0.3, TX = -1.3, CX = 2.5;
      let step = 0, stopped = false, hideSunk = false;

      const marsh = new T.Mesh(new T.PlaneGeometry(10, 5), mat('c4', { transparent: true, opacity: 0.55, depthWrite: false }));
      marsh.rotation.x = -Math.PI / 2; marsh.renderOrder = 2; S.add(marsh);
      const pad = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.06, 32), mat('neutral')); pad.position.set(CX, 0.03, 0); S.add(pad);

      const tower = new T.Group(); tower.position.x = TX; S.add(tower);
      const floorGeo = new T.BoxGeometry(1.6, FH * 0.88, 1.6), sunkMat = mat('neutral', { transparent: true, opacity: 1 });
      const floors = [];
      function addFloor(drop) {
        const f = new T.Mesh(floorGeo, sunkMat);
        const y = FH * floors.length + FH / 2;
        f.position.y = y + (drop && !ctx.reduce ? 1.2 : 0); f.userData.y = y;
        tower.add(f); floors.push(f);
      }
      for (let i = 0; i < START / 10; i++) addFloor(false);

      const ghostGeo = new T.BoxGeometry(1.6, 1, 1.6); ghostGeo.translate(0, 0.5, 0);
      const ghostMat = mat('accent', { transparent: true, opacity: 0.25, depthWrite: false });
      const ghost = new T.Mesh(ghostGeo, ghostMat);
      const edgeMat = mat.line('accent', { transparent: true, opacity: 1 });
      ghost.add(new T.LineSegments(new T.EdgesGeometry(ghostGeo), edgeMat)); tower.add(ghost);
      const gemMat = mat('warm', { transparent: true, opacity: 1, emissive: 0x000000 });
      const gem = new T.Mesh(new T.OctahedronGeometry(0.42), gemMat); tower.add(gem);

      const coinGeo = new T.CylinderGeometry(0.5, 0.5, 0.1, 28), coinMat = mat('good', { transparent: true, opacity: 0.55 });
      const coins = [];

      const tSunk = ctx.tag(''), tRem = ctx.tag(''), tVal = ctx.tag(''), tCoin = ctx.tag('');
      const vS = new T.Vector3(), vR = new T.Vector3(), vV = new T.Vector3(), vC = new T.Vector3();

      const cur = { sink: 0, ghostH: REM[0] / 10 * FH, gemS: 1, fade: 1 };
      const spent = () => START + step * 10;
      const target = () => ({ sink: step * 0.15, ghostH: REM[step] / 10 * FH, gemS: Math.sqrt(VAL[step] / 80), fade: stopped ? 0.08 : 1 });

      function setCoins() {
        const n = Math.round(REM[step] / 5);
        while (coins.length < n) { const c = new T.Mesh(coinGeo, coinMat); c.position.set(CX, 0.11 + coins.length * 0.11, 0); S.add(c); coins.push(c); }
        while (coins.length > n) S.remove(coins.pop());
      }
      const ro = U.readout(true);
      function readout() {
        const rem = REM[step], val = VAL[step], net = val - rem;
        tSunk.innerHTML = `<b>\u00a3${spent()}k</b>spent \u00b7 gone either way`;
        tRem.innerHTML = `<b>\u00a3${rem}k</b>still to pay`;
        tVal.innerHTML = `<b>\u00a3${val}k</b>worth when done`;
        tCoin.innerHTML = `<b>\u00a3${rem}k</b>${stopped ? 'kept' : 'kept if you stop'}`;
        const sign = n => (n >= 0 ? '+' : '\u2212') + '\u00a3' + Math.abs(n) + 'k';
        let s = `Finish: \u2212\u00a3${rem}k + \u00a3${val}k = <strong>${sign(net)}</strong>. Stop: <strong>\u00a30</strong>. The \u00a3${spent()}k already spent is in neither line. `;
        if (stopped) {
          s += net > 0
            ? `You walked away while finishing was still worth ${sign(net)}. Quitting too early is a mistake too: the test is the future numbers, not how fed up you are.`
            : `Good call: finishing would have lost you another \u00a3${-net}k. Only the sunk \u00a3${spent()}k was arguing for going on.`;
        } else if (net > 0) {
          s += step === 0 ? `On today's numbers, finishing still pays.` : `Finishing still pays, but by less each time: the foundation keeps sinking.`;
        } else {
          s += `<strong>On today's numbers, stopping is better.</strong> The bigger grey pile makes it feel wasteful, but that money is gone whichever you choose.`;
        }
        s += ' <em>Illustrative figures.</em>';
        ro.innerHTML = s;
        keep.disabled = stopped || step >= REM.length - 1; walk.disabled = stopped;
        if (step >= REM.length - 1 && !stopped) ro.innerHTML += ' The budget has run out: you can only walk away now.';
      }

      const keep = U.button('Keep building (+\u00a310k)', () => { if (stopped || step >= REM.length - 1) return; step++; addFloor(true); setCoins(); readout(); });
      const walk = U.button('Walk away', () => { stopped = true; readout(); }, true);
      U.button('Start over', () => {
        step = 0; stopped = false;
        while (floors.length > START / 10) tower.remove(floors.pop());
        setCoins(); readout();
      }, true);
      U.chips('Sunk part:', [{ label: 'Show', value: false }, { label: 'Fade out', value: true }], false, v => { hideSunk = v; });

      ctx.onFrame((dt) => {
        const k = ctx.reduce ? 1 : ease(dt, 6), tg = target();
        for (const key in cur) cur[key] += (tg[key] - cur[key]) * k;
        tower.position.y = -cur.sink;
        floors.forEach(f => { f.position.y += (f.userData.y - f.position.y) * (ctx.reduce ? 1 : ease(dt, 10)); });
        sunkMat.opacity += ((hideSunk ? 0.12 : 1) - sunkMat.opacity) * k;
        const base = FH * floors.length;
        ghost.position.y = base; ghost.scale.y = Math.max(cur.ghostH, 0.01);
        ghostMat.opacity = 0.25 * cur.fade; edgeMat.opacity = cur.fade;
        gem.position.y = base + cur.ghostH + 0.55; gem.scale.setScalar(cur.gemS);
        if (!ctx.reduce) gem.rotation.y += dt * 0.6;
        gemMat.opacity = cur.fade;
        coinMat.opacity += ((stopped ? 1 : 0.55) - coinMat.opacity) * k;
        const ty = tower.position.y;
        vS.set(TX - 1.55, ty + base / 2, 0); vR.set(TX + 1.5, ty + base + cur.ghostH / 2, 0);
        vV.set(TX, ty + base + cur.ghostH + 1.25, 0); vC.set(CX, 0.25 + coins.length * 0.11 + 0.35, 0);
        frame(ty + base + cur.ghostH + 1.6);
        ctx.place(tSunk, vS); ctx.place(tRem, vR); ctx.place(tVal, vV); ctx.place(tCoin, vC);
        tRem.style.opacity = tVal.style.opacity = String(Math.max(cur.fade, 0.35));
        tSunk.style.opacity = String(hideSunk ? 0.4 : 1);
      });

      // camera follows the tower height so the scene is large at the start and still fits when tall
      const fitT = new T.Vector3(), fitDir = new T.Vector3(0.12, 0.3, 1);
      function frame(top) {
        const lo = -1.2, hi = Math.max(3.6, top), h = hi - lo;
        fitT.set(0.4, (lo + hi) / 2, 0);
        ctx.fit(8.6, h, fitT, fitDir);
      }
      setCoins(); readout();
      frame(FH * floors.length + REM[0] / 10 * FH + 1.6);
    },
  });

  // =====================================================================
  // Day 12 \u00b7 Margin of safety: a bridge under uncertain load
  // =====================================================================
  MM.register({
    id: 'margin-of-safety', day: 12, week: 2,
    title: 'Margin of safety',
    tagline: "Build a buffer between what you expect and what would break you, because your estimates will sometimes be wrong in the bad direction.",
    prompt: 'Set the load you expect and how unsure you are, pick a safety factor, then run 1,000 heavy days across the bridge.',
    body: `
<section>
  <h2>What it says</h2>
  <p>You never know the future load exactly, and you rarely know your own strength exactly either. A margin of safety is the gap you deliberately leave between them. If you expect 20 tonnes, you don't build for 20; you build for 30 or 40, so that a bad day plus a bad estimate still doesn't bring the bridge down.</p>
  <p>The bar above the bridge shows it. The warm band is the range of loads you might realistically see; the marker is what the bridge can take. With a 1\u00d7 factor, the marker sits in the middle of the band and the bridge fails about half the time. Each step up pushes the marker further past the band's edge.</p>
</section>
<section>
  <h2>Where it comes from</h2>
  <p>Engineers have used safety factors for as long as they've built bridges, boilers and lifts; the more uncertain the load and the worse the failure, the bigger the factor. Benjamin Graham brought the idea to investing in <em>Security Analysis</em> (1934, with David Dodd) and <em>The Intelligent Investor</em>, where he called margin of safety the central concept: only buy when the price is well below your estimate of value, so you can be wrong and still be fine.</p>
</section>
<section>
  <h2>An everyday example</h2>
  <p>Your rent and bills come to \u00a31,800 a month. Planning to earn exactly \u00a31,800 is a 1\u00d7 bridge: any surprise bill breaks it. Keeping a few months of costs in savings, or leaving 40 minutes early for a flight instead of "just enough", is the same move. You trade a little efficiency for a lot of robustness.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>A margin isn't free. A 3\u00d7 bridge uses roughly three times the material; cash held as a buffer earns little. Too much margin is waste, so the right size depends on how uncertain things are and how bad failure would be. A margin also only protects against the kind of uncertainty you allowed for: a shock far outside your band (a flood, a pandemic) can overwhelm any factor. And people tend to spend margins: give drivers better brakes and some drive faster.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Set uncertainty to 40% and find the smallest safety factor that keeps failures under 1 in 100 days. Then halve the uncertainty and notice how much less margin you need: knowing more is itself a kind of safety. Off-screen: pick one plan this month and add a deliberate buffer of time or money.</p>
  </div>
</section>`,
    mount(ctx) {
      const T = ctx.THREE, S = ctx.scene, mat = palette(ctx), U = ui(ctx), R = rng(12);
      const L = 3.2, N = 26, SEG = 2 * L / N, GY = 2.5;
      let expected = 20, factor = 1.5, unc = 0.25, days = null, play = -1, playT = 0, brk = 0, shownLoad = 20, shownStr = 30;

      const water = new T.Mesh(new T.PlaneGeometry(12, 4), mat('c2', { transparent: true, opacity: 0.3, depthWrite: false }));
      water.rotation.x = -Math.PI / 2; water.position.y = -2.2; S.add(water);
      const pierGeo = new T.BoxGeometry(0.7, 2.2, 1.6), pierMat = mat('neutral');
      [-1, 1].forEach(s => { const pr = new T.Mesh(pierGeo, pierMat); pr.position.set(s * (L + 0.25), -1.21, 0); S.add(pr); });
      const deckGeo = new T.BoxGeometry(SEG * 1.02, 0.22, 1.4);
      const deckMat = new T.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 }); // colour set each frame from tokens
      const deck = [];
      for (let i = 0; i < N; i++) { const d = new T.Mesh(deckGeo, deckMat); d.position.x = -L + (i + 0.5) * SEG; S.add(d); deck.push(d); }
      const truck = new T.Group(), truckMat = mat('accent'), cabMat = mat('fg');
      const body = new T.Mesh(new T.BoxGeometry(1.1, 0.55, 0.8), truckMat); body.position.set(-0.15, 0.3, 0); truck.add(body);
      const cab = new T.Mesh(new T.BoxGeometry(0.42, 0.45, 0.76), cabMat); cab.position.set(0.63, 0.25, 0); truck.add(cab);
      S.add(truck);

      // gauge above the bridge
      const rail = new T.Mesh(new T.BoxGeometry(8, 0.04, 0.04), mat('neutral')); rail.position.y = GY; S.add(rail);
      const band = new T.Mesh(new T.BoxGeometry(1, 0.3, 0.05), mat('warm', { transparent: true, opacity: 0.45 })); band.position.y = GY; S.add(band);
      const expTick = new T.Mesh(new T.BoxGeometry(0.05, 0.42, 0.06), mat('fg')); expTick.position.y = GY; S.add(expTick);
      const capMat = new T.MeshStandardMaterial({ roughness: 0.5 });
      const capTick = new T.Mesh(new T.BoxGeometry(0.09, 0.7, 0.08), capMat); capTick.position.y = GY; S.add(capTick);
      const dayTick = new T.Mesh(new T.SphereGeometry(0.09, 12, 8), mat('accent')); dayTick.position.y = GY; dayTick.visible = false; S.add(dayTick);

      const tCap = ctx.tag(''), tBand = ctx.tag(''), tDay = ctx.tag('');
      const vCap = new T.Vector3(), vBand = new T.Vector3(), vDay = new T.Vector3(-3.1, 1.15, 0);
      let maxT = 60;
      const gx = t => -4 + 8 * Math.min(t / maxT, 1);
      const capacity = () => expected * factor;
      const failProb = () => normCdf(-Math.log(factor) / (unc * Math.sqrt(1.25)));

      function gauge() {
        const lo = expected * Math.exp(-1.645 * unc), hi = expected * Math.exp(1.645 * unc);
        maxT = Math.max(capacity(), hi) * 1.15;
        band.scale.x = gx(hi) - gx(lo); band.position.x = (gx(hi) + gx(lo)) / 2;
        expTick.position.x = gx(expected); capTick.position.x = gx(capacity());
        tBand.innerHTML = `<b>${expected} t</b>expected<br>band: 90% of days`;
        tCap.innerHTML = `<b>${Math.round(capacity())} t</b>capacity`;
        vBand.set(band.position.x, GY - 0.55, 0); vCap.set(capTick.position.x, GY + 0.8, 0);
      }
      function colorFor(ratio) {
        const c = ctx.colors, out = new T.Color();
        if (ratio < 0.7) return out.copy(c.good);
        if (ratio < 1) return out.copy(c.good).lerp(c.warm, (ratio - 0.7) / 0.3);
        return out.copy(c.bad);
      }
      const ro = U.readout(true);
      function readout() {
        const fp = failProb();
        let s = `Built for <strong>${Math.round(capacity())} t</strong> (${expected} t \u00d7 ${factor}). With \u00b1${Math.round(unc * 100)}% uncertainty in both load and strength, expect about <strong>${pct(fp)}</strong> of heavy days to overload it. `;
        if (days) s += `In this run of 1,000 days it failed on <strong>${num(days.fails)}</strong>. `;
        s += factor === 1 ? 'No margin: you fail whenever reality comes in above your estimate, about half the time.' :
          fp < 0.001 ? `Very safe, but it costs ~${factor}\u00d7 the material of a no-margin bridge.` : 'Bigger factor, or less uncertainty, pushes the marker past the band.';
        s += ' <em>Illustrative model.</em>';
        ro.innerHTML = s;
      }
      function update() { days = null; play = -1; dayTick.visible = false; tDay.innerHTML = ''; shownLoad = expected; shownStr = capacity(); gauge(); readout(); }

      function run() {
        const list = []; let fails = 0;
        for (let i = 0; i < 1000; i++) {
          const load = expected * Math.exp(unc * gauss(R)), str = capacity() * Math.exp(unc * 0.5 * gauss(R));
          const f = load > str; if (f) fails++; list.push({ load, str, f });
        }
        days = { list, fails }; readout();
        if (ctx.reduce) { const worst = list.reduce((a, d) => (d.load / d.str > a.load / a.str ? d : a)); shownLoad = worst.load; shownStr = worst.str; tDay.innerHTML = `heaviest day: ${worst.load.toFixed(0)} t`; return; }
        play = 0; playT = 0;
      }

      U.slider('Load you expect', { min: 5, max: 40, step: 1, value: 20, fmt: v => v + ' tonnes' }, v => { expected = v; update(); });
      U.slider('How unsure you are', { min: 5, max: 50, step: 5, value: 25, fmt: v => '\u00b1' + v + '%' }, v => { unc = v / 100; update(); });
      U.chips('Safety factor:', [1, 1.5, 2, 3].map(f => ({ label: f + '\u00d7', value: f })), 1.5, v => { factor = v; update(); });
      U.button('Run 1,000 days', run);

      const PLAY = 48;
      ctx.onFrame((dt) => {
        if (play >= 0 && days) {
          const d = days.list[play];
          shownLoad = d.load; shownStr = d.str;
          playT += dt;
          const dur = d.f ? 0.7 : 0.16;
          tDay.innerHTML = `day ${play + 1}: <b>${d.load.toFixed(0)} t</b>${d.f ? 'overloaded!' : ''}`;
          dayTick.visible = true; dayTick.position.x = gx(d.load);
          if (playT > dur) { playT = 0; play++; if (play >= PLAY) { play = -1; dayTick.visible = false; tDay.innerHTML = `\u2026and ${num(1000 - PLAY)} more days, counted below`; shownLoad = expected; shownStr = capacity(); } }
        }
        const failing = shownLoad > shownStr;
        brk += ((failing ? 1 : 0) - brk) * (ctx.reduce ? 1 : ease(dt, 12));
        const ratio = shownLoad / shownStr;
        const sag = 0.42 * Math.min(ratio, 1.2);
        deck.forEach(d => {
          const x = d.position.x;
          let y = -sag * (1 - (x / L) ** 2) - 0.11;
          y -= brk * (L - Math.abs(x)) * 0.5;
          d.position.y = y;
          d.rotation.z = brk * (x < 0 ? -0.46 : 0.46);
        });
        deckMat.color.copy(colorFor(ratio));
        capMat.color.copy(ctx.colors[failProb() > 0.05 ? 'bad' : failProb() > 0.005 ? 'warm' : 'good']);
        const sc = 0.55 + 0.75 * Math.sqrt(shownLoad / 40);
        truck.scale.setScalar(sc);
        truck.position.y = -sag - brk * L * 0.5;
        ctx.place(tCap, vCap); ctx.place(tBand, vBand); ctx.place(tDay, vDay);
      });

      update();
      ctx.fit(9, 6.4, new T.Vector3(0, 0.35, 0), new T.Vector3(0, 0.25, 1));
    },
  });

  // =====================================================================
  // Day 13 \u00b7 Incentives: agents chase whatever gets rewarded
  // =====================================================================
  MM.register({
    id: 'incentives', day: 13, week: 2,
    title: 'Incentives',
    tagline: "People do what they're rewarded for, not what you meant. Change the reward and you change the behaviour, often in ways you didn't intend.",
    prompt: 'A support team works through problems (crates; bigger and redder means more harm to customers). Switch what the team is paid for and watch what they go after.',
    body: `
<section>
  <h2>What it says</h2>
  <p>If you want to predict what people will do, look at what they're rewarded for: pay, praise, promotion, avoiding blame. They will mostly do that, and they will find the cheapest way to do it. The trap is that you can only reward what you can measure, and the measurement is never quite the thing you want.</p>
  <p>That's Goodhart's law: when a measure becomes a target, it stops being a good measure. In the scene, paying per ticket closed makes the ticket count soar while big, harmful problems sit untouched and grow, and rushed fixes get reopened. Paying for hours logged rewards slowness. Rewarding problems actually solved, weighted by impact, sends people to the big crates first: fewer tickets, far more real value.</p>
</section>
<section>
  <h2>Where it comes from</h2>
  <p>Charlie Munger, Warren Buffett's partner, put it bluntly: show me the incentive and I'll show you the outcome. The economist Charles Goodhart made his observation about monetary targets in 1975; the anthropologist Marilyn Strathern later gave it the well-known wording above. A real case: in 2016 Wells Fargo admitted staff, under aggressive sales targets, had opened millions of accounts customers never asked for.</p>
</section>
<section>
  <h2>An everyday example</h2>
  <p>Pay a child per chore and you may get ten rushed chores instead of one clean kitchen. Judge a call centre on call length and agents start hanging up on hard calls. Before you set any target, for yourself or others, ask: "What is the laziest way to hit this number, and would I be happy if that's what happened?"</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>People aren't just reward-chasing machines. Pride, curiosity and fairness matter too, and clumsy incentives can crowd them out: when Israeli day-care centres introduced a fine for late pick-ups (Gneezy and Rustichini, 2000), lateness went <em>up</em>, because parents now saw it as a paid service instead of a favour. And not every bad outcome is an incentive problem; sometimes people lack the skill, the information or the tools. Look at incentives first, but don't stop there.</p>
  <div class="try">
    <h3>Try it</h3>
    <p>Leave the reward on "Tickets closed" for 20 seconds and note both numbers, then switch to "Impact solved" and compare. Off-screen: pick one number you're judged by (at work, at the gym, on social media) and write down how you could hit it while making the real thing worse.</p>
  </div>
</section>`,
    mount(ctx) {
      const T = ctx.THREE, S = ctx.scene, mat = palette(ctx), U = ui(ctx), R = rng(13);
      const FW = 12, FD = 7, NA = 7, WIN = 20;
      const MODES = {
        tickets: { label: 'Tickets closed', unit: 'tickets', speed: 1.5, work: 0.45, fixChance: 0.55,
          note: 'Agents grab the smallest, nearest crates and rush them; about half get reopened. The number looks great while the big red problems grow.' },
        hours: { label: 'Hours logged', unit: 'hours', speed: 0.7, work: 2.2, fixChance: 1,
          note: 'Agents pick the furthest crate and take their time. Hours pile up; very little gets fixed.' },
        value: { label: 'Impact solved', unit: 'impact points', speed: 1.5, work: 1, fixChance: 1,
          note: 'Agents weigh impact against effort, so big problems go first. Fewer tickets, far more real value.' },
      };
      let mode = 'tickets', running = !ctx.reduce, simT = 0, sinceSwitch = 0, spawnT = 0;
      let buckets = [], bucket = { m: 0, r: 0, k: 0 }, bucketT = 0;

      const field = new T.Mesh(new T.PlaneGeometry(FW, FD), mat('line')); field.rotation.x = -Math.PI / 2; S.add(field);
      const sizeMat = [null, mat('c2'), mat('c1'), mat('warm'), mat('bad')];
      const crateGeo = new T.BoxGeometry(1, 1, 1);
      const items = [];
      function spawn() {
        const u = R(), size = u < 0.5 ? 1 : u < 0.75 ? 2 : u < 0.9 ? 3 : 4;
        const it = { size, x: (R() - 0.5) * (FW - 1.2), z: (R() - 0.5) * (FD - 1.2), age: 0, claimed: null, progress: 0 };
        it.mesh = new T.Mesh(crateGeo, sizeMat[size]); S.add(it.mesh); setSize(it);
        items.push(it);
      }
      function setSize(it) { const d = 0.22 + 0.15 * it.size; it.d = d; it.mesh.material = sizeMat[it.size]; it.mesh.scale.setScalar(d); it.mesh.position.set(it.x, d / 2, it.z); }
      function removeItem(it) { S.remove(it.mesh); items.splice(items.indexOf(it), 1); }

      const agentBody = new T.CylinderGeometry(0.14, 0.17, 0.42, 12), agentHead = new T.SphereGeometry(0.13, 12, 8), agentMat = mat('accent');
      const agents = [];
      for (let i = 0; i < NA; i++) {
        const g = new T.Group();
        const b = new T.Mesh(agentBody, agentMat); b.position.y = 0.21; g.add(b);
        const h = new T.Mesh(agentHead, agentMat); h.position.y = 0.56; g.add(h);
        g.position.set((i / (NA - 1) - 0.5) * (FW - 2), 0, FD / 2 - 0.4); S.add(g);
        agents.push({ g, target: null, working: false, bob: R() * 6 });
      }

      function choose(a) {
        const M = MODES[mode]; let best = null, bestS = -Infinity;
        items.forEach(it => {
          if (it.claimed) return;
          const dist = Math.hypot(it.x - a.g.position.x, it.z - a.g.position.z);
          const effort = dist / M.speed + M.work * it.size;
          const s = mode === 'tickets' ? 1 / effort : mode === 'hours' ? dist + it.size : (it.size * it.size) / effort;
          if (s > bestS) { bestS = s; best = it; }
        });
        if (best) { best.claimed = a; a.target = best; a.working = false; }
      }
      function release(a) { if (a.target) { a.target.claimed = null; a.target.progress = 0; } a.target = null; a.working = false; }

      function step(dt) {
        const M = MODES[mode];
        simT += dt; sinceSwitch += dt; spawnT += dt; bucketT += dt;
        if (spawnT > 0.5) { spawnT = 0; if (items.length >= 28) { const old = items.find(it => it.size <= 2 && !it.claimed); if (old) removeItem(old); } if (items.length < 28) spawn(); }
        items.forEach(it => {
          if (it.claimed) return;
          it.age += dt;
          if (it.size < 4 && it.size >= 3 && it.age > 15) { it.size++; it.age = 0; setSize(it); }
        });
        agents.forEach(a => {
          if (!a.target) choose(a);
          const it = a.target;
          if (mode === 'hours') bucket.m += dt; // every agent clocks hours, busy or not
          if (!it) return;
          const p = a.g.position, dx = it.x - p.x, dz = it.z - p.z, dist = Math.hypot(dx, dz), reach = it.d / 2 + 0.3;
          if (dist > reach) {
            const mv = Math.min(M.speed * dt, dist - reach);
            p.x += dx / dist * mv; p.z += dz / dist * mv; a.g.rotation.y = Math.atan2(dx, dz);
            a.working = false;
          } else {
            a.working = true;
            it.progress += dt / (M.work * it.size);
            if (it.progress >= 1) {
              const fixed = R() < M.fixChance;
              bucket.k += 1; if (mode === 'tickets') bucket.m += 1;
              if (mode === 'value') bucket.m += it.size * it.size;
              if (fixed) { bucket.r += it.size * it.size; removeItem(it); a.target = null; a.working = false; }
              else { it.progress = 0; it.claimed = null; a.target = null; a.working = false; it.reopened = 0.6; }
            }
          }
        });
        if (bucketT >= 1) { buckets.push(bucket); if (buckets.length > WIN) buckets.shift(); bucket = { m: 0, r: 0, k: 0 }; bucketT = 0; }
      }

      const tWorst = ctx.tag(''), vW = new T.Vector3();
      const ro = U.readout(false), note = U.readout(true);
      function readout() {
        const M = MODES[mode];
        const m = buckets.reduce((a, b) => a + b.m, bucket.m), r = buckets.reduce((a, b) => a + b.r, bucket.r); const tk = buckets.reduce((a, b) => a + b.k, bucket.k);
        const open = items.reduce((a, it) => a + it.size * it.size, 0), big = items.filter(it => it.size >= 3).length;
        const secs = Math.min(WIN, Math.round(sinceSwitch));
        ro.innerHTML = `Paid for: <strong>${M.label}</strong>. Last ${secs} s, on the metric: <strong>${Math.round(m)} ${M.unit}</strong>. Tickets closed: <strong>${tk}</strong>, real harm fixed: <strong>${Math.round(r)}</strong> impact points. Still open: <strong>${items.length}</strong> problems worth <strong>${open}</strong> (${big} big).${running ? '' : ' <em>Paused.</em>'}`;
      }
      function setNote() { note.innerHTML = MODES[mode].note + ' <em>Illustrative simulation: a minute of screen time stands in for weeks of work.</em>'; }

      U.chips('Pay the team for:', Object.keys(MODES).map(k => ({ label: MODES[k].label, value: k })), mode, v => {
        mode = v; agents.forEach(release); buckets = []; bucket = { m: 0, r: 0, k: 0 }; bucketT = 0; sinceSwitch = 0; setNote(); readout();
      });
      const playBtn = U.button(running ? 'Pause' : 'Play', () => { running = !running; playBtn.textContent = running ? 'Pause' : 'Play'; readout(); }, true);

      for (let i = 0; i < 12; i++) spawn();
      for (let i = 0; i < 200; i++) step(0.05); // pre-warm so the field is busy and the readout has numbers at rest

      let roT = 0;
      ctx.onFrame((dt, t) => {
        if (running) step(dt);
        agents.forEach(a => {
          const moving = running && a.target && !a.working;
          a.g.children[0].position.y = 0.21 + (moving && !ctx.reduce ? Math.abs(Math.sin(t * 9 + a.bob)) * 0.06 : 0);
          a.g.children[1].position.y = a.g.children[0].position.y + 0.35;
        });
        items.forEach(it => {
          let s = it.d * (1 - 0.45 * it.progress);
          if (it.reopened > 0) { it.reopened -= dt; if (!ctx.reduce) s *= 1 + 0.25 * Math.sin(it.reopened * 20); }
          it.mesh.scale.setScalar(s); it.mesh.position.y = s / 2;
        });
        let worst = null;
        items.forEach(it => { if (!worst || it.size > worst.size || (it.size === worst.size && it.age > worst.age)) worst = it; });
        if (worst && worst.size >= 3) {
          tWorst.innerHTML = `${worst.claimed ? 'being fixed' : 'ignored'}<b>${worst.size * worst.size}</b>`;
          vW.set(worst.x, worst.d + 0.45, worst.z); ctx.place(tWorst, vW); tWorst.style.display = '';
        } else tWorst.style.display = 'none';
        roT -= dt; if (roT <= 0) { readout(); roT = 0.5; }
      });

      setNote(); readout();
      ctx.fit(FW + 0.4, 6.2, new T.Vector3(0, 0, 0.2), new T.Vector3(0, 1.15, 1));
    },
  });
})();
