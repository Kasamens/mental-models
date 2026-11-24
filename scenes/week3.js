/* Week 3 \u00b7 How things grow and connect (days 15\u201320).
 * Scenes: compounding, feedback-loops, leverage, bottlenecks, regret-minimization, latticework.
 * Every number in these scenes is illustrative, chosen to show the shape of the mechanism, not measured data.
 */
(function () {
  if (!window.MM) return;

  // ---------- shared helpers ----------
  // Materials remember which colour token they use, so a theme change can recolour them in place.
  function painter(ctx) {
    const mats = [];
    function apply(m) {
      const u = m.userData;
      if (u.mix) m.color.copy(ctx.colors[u.mix[0]]).lerp(ctx.colors[u.mix[1]], u.mix[2]);
      else m.color.copy(ctx.colors[u.key]);
    }
    function make(Ctor, key, opts) {
      const m = new Ctor(opts || {});
      if (Array.isArray(key)) m.userData.mix = key; else m.userData.key = key;
      apply(m); mats.push(m); return m;
    }
    const p = {
      std: (key, opts) => make(ctx.THREE.MeshStandardMaterial, key, Object.assign({ roughness: 0.62, metalness: 0.05 }, opts)),
      line: (key, opts) => make(ctx.THREE.LineBasicMaterial, key, opts),
      set(m, key) { m.userData.mix = null; m.userData.key = key; apply(m); },
      mix(m, a, b, t) { m.userData.mix = [a, b, t]; apply(m); },
    };
    ctx.onTheme(() => mats.forEach(apply));
    return p;
  }
  const uid = (() => { let n = 0; return p => `w3-${p}-${++n}`; })();
  function slider(ctx, o) {
    const id = uid('f'), w = document.createElement('div');
    w.className = 'field';
    w.innerHTML = `<label for="${id}">${o.label}</label><input id="${id}" type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.value}"><span class="val"></span>`;
    const input = w.querySelector('input'), val = w.querySelector('.val');
    const upd = () => { val.textContent = o.fmt(+input.value); };
    input.addEventListener('input', () => { upd(); o.onInput(+input.value); });
    upd(); ctx.controls.appendChild(w);
    return { input, set(v) { input.value = v; upd(); } };
  }
  function chips(ctx, label, options, value, onPick) {
    const g = document.createElement('div');
    g.setAttribute('role', 'group'); g.setAttribute('aria-label', label);
    g.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center';
    const btns = options.map(([v, text]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = text;
      b.setAttribute('aria-pressed', String(v === value));
      b.addEventListener('click', () => { btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); onPick(v); });
      g.appendChild(b); return b;
    });
    ctx.controls.appendChild(g);
    return g;
  }
  function button(ctx, text, onClick, ghost) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = ghost ? 'btn ghost' : 'btn'; b.textContent = text;
    b.addEventListener('click', onClick); ctx.controls.appendChild(b); return b;
  }
  function readout(ctx) {
    const r = document.createElement('p'); r.className = 'readout'; r.setAttribute('aria-live', 'polite');
    ctx.controls.appendChild(r); return r;
  }
  function row(ctx) { // keeps a set of buttons together on one wrapping line
    const d = document.createElement('div'); d.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center';
    ctx.controls.appendChild(d); return { add(el) { d.appendChild(el); return el; } };
  }
  const box = (THREE, w, h, d) => new THREE.BoxGeometry(w, h, d);
  const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'm' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : Math.round(n).toLocaleString('en-GB');
  const damp = (ctx, k, dt) => ctx.reduce ? 1 : 1 - Math.exp(-k * dt);

  // ============================================================
  // Day 15 \u00b7 Compounding
  // ============================================================
  MM.register({
    id: 'compounding', day: 15, week: 3,
    title: 'Compounding',
    tagline: 'When growth is added to the base, next year\'s growth is bigger: the curve looks flat for years, then bends upward.',
    prompt: 'Both towers start with 100 and grow at the same rate. The left one takes its gains out each year; the right one leaves them in. Move the sliders, then replay the years.',
    body: `
<section>
  <h2>What it says</h2>
  <p>Compounding happens when this period's output becomes part of next period's input. Interest earned on interest is the textbook case, but the same shape shows up in skills, reputations, relationships, codebases and audiences. Each step adds a percentage of what is already there rather than a fixed amount, so the absolute additions keep getting bigger.</p>
  <div class="math">simple:    value = start \u00d7 (1 + rate \u00d7 years)
compound:  value = start \u00d7 (1 + rate) ^ years
rule of 72: doubling time \u2248 72 \u00f7 rate%</div>
  <p>The idea is old. The Rule of 72 appears in Luca Pacioli's 1494 <em>Summa de arithmetica</em>, and the quote calling compound interest "the eighth wonder of the world" is often credited to Einstein, though there is no good evidence he said it. For mental-model reading, Charlie Munger's talks are where most people meet it: "the first rule of compounding is never to interrupt it unnecessarily."</p>
</section>
<section>
  <h2>An everyday example</h2>
  <div class="points">
    <div><h3>Money</h3><p>100 a month invested at 7% for 40 years ends up at roughly five times what was put in. Most of that arrives in the last decade.</p></div>
    <div><h3>Skill</h3><p>Every hour of practice makes the next hour more productive, because you understand more of what you are reading and building. Early progress feels slow.</p></div>
    <div><h3>Trust</h3><p>Every kept promise makes the next request easier to grant. One broken promise can reset the base.</p></div>
  </div>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>Nothing compounds forever. Growth runs into limits such as market size, attention, physics or competitors, and the exponential curve flattens into an S. Compounding also works on bad things: debt, technical shortcuts and small habits of neglect grow the same way. The slider can't show the hardest part, which is that the payoff sits at the far end, so the years when it looks like nothing is happening are exactly when people quit or interrupt the process.</p>
  <div class="try"><h3>Try it</h3><p>Set the rate to 7% and the years to 10, then 20, then 40. Each time, read how many of the final years produced half the growth. Then name one thing in your life that grows by a percentage of itself, and one thing that grows by a fixed amount. Which would you rather be investing in?</p></div>
</section>`,
    mount(ctx) {
      const { THREE } = ctx, S = ctx.scene, p = painter(ctx);
      const P = 100, MAXY = 40, TOWER_H = 6, W = 1.7, X = 1.55;
      let rate = 0.08, years = 25, shown = years;

      const ground = new THREE.Mesh(box(THREE, 8, 0.12, 3.4), p.std('line'));
      ground.position.y = -0.06; S.add(ground);

      function tower(x, keyA, keyB) {
        const base = new THREE.Mesh(box(THREE, 1, 1, 1), p.std('neutral'));
        base.position.x = x; S.add(base);
        const mA = p.std(keyA), mB = p.std([keyB, 'bg', 0.35]);
        const slabs = [];
        for (let i = 0; i < MAXY; i++) {
          const m = new THREE.Mesh(box(THREE, 1, 1, 1), i % 2 ? mB : mA);
          m.position.x = x; m.scale.set(W, 0.001, W); m.visible = false; S.add(m); slabs.push(m);
        }
        return { base, slabs };
      }
      const lin = tower(-X, 'c2', 'c2'), cmp = tower(X, 'warm', 'warm');
      const tagLin = ctx.tag(''), tagCmp = ctx.tag(''), tagBase = ctx.tag('start<b>100</b>');
      const out = readout(ctx);

      const linVal = k => P * (1 + rate * k), cmpVal = k => P * Math.pow(1 + rate, k);

      function layout() {
        const scale = TOWER_H / cmpVal(years);
        [[lin, linVal], [cmp, cmpVal]].forEach(([t, val]) => {
          const bh = P * scale;
          t.base.scale.set(W, bh, W); t.base.position.y = bh / 2;
          let y = bh;
          t.slabs.forEach((s, i) => {
            const k = i + 1;
            const frac = Math.max(0, Math.min(1, shown - i));
            const h = (val(k) - val(k - 1)) * scale * frac;
            s.visible = k <= years && h > 0.0005;
            s.scale.y = Math.max(0.0005, h);
            s.position.y = y + h / 2; y += h;
          });
          t.top = y;
        });
        const sh = Math.min(shown, years);
        tagLin.innerHTML = `simple<b>${fmtN(linVal(sh))}</b>`;
        tagCmp.innerHTML = `compound<b>${fmtN(cmpVal(sh))}</b>`;
      }

      function explain() {
        const L = linVal(years), C = cmpVal(years), gain = C - P;
        let k = 0; while (k < years && cmpVal(k) - P < gain / 2) k++;
        const last = years - k + 1;
        out.innerHTML = `After <strong>${years}</strong> years at <strong>${(rate * 100).toFixed(0)}%</strong>: gains taken out gives <strong>${fmtN(L)}</strong>; gains left in gives <strong>${fmtN(C)}</strong>, which is <strong>${(C / L).toFixed(1)}\u00d7</strong> as much. Half of the compound tower's growth came in the last <strong>${last}</strong> of ${years} years. It doubles roughly every <strong>${(72 / (rate * 100)).toFixed(1)}</strong> years (rule of 72). Start of 100 and rates are illustrative.`;
      }

      slider(ctx, { label: 'Growth rate per year', min: 1, max: 20, step: 1, value: 8, fmt: v => v + '%', onInput: v => { rate = v / 100; shown = years; layout(); explain(); } });
      slider(ctx, { label: 'Years', min: 1, max: MAXY, step: 1, value: years, fmt: v => v + ' years', onInput: v => { years = v; shown = v; layout(); explain(); } });
      const r = row(ctx);
      r.add(button(ctx, 'Replay the years', () => { shown = ctx.reduce ? years : 0; layout(); }));

      layout(); explain();
      ctx.fit(7.6, 7.6, new THREE.Vector3(0, 3.3, 0));
      const v = new THREE.Vector3();
      ctx.onFrame(dt => {
        if (shown < years) { shown = Math.min(years, shown + dt * Math.max(4, years / 3)); layout(); }
        ctx.place(tagLin, v.set(-X, lin.top + 0.75, 0));
        ctx.place(tagCmp, v.set(X, cmp.top + 0.75, 0));
        ctx.place(tagBase, v.set(0, 0.35, 1.2));
      });
    },
  });

  // ============================================================
  // Day 16 \u00b7 Feedback loops
  // ============================================================
  MM.register({
    id: 'feedback-loops', day: 16, week: 3,
    title: 'Feedback loops',
    tagline: 'A system\'s output feeds back into its input: balancing loops pull it toward a target, reinforcing loops push it further away.',
    prompt: 'A room heater reads the temperature and reacts. Flip the loop between balancing and reinforcing, add delay, then knock the room off target and watch the trace.',
    body: `
<section>
  <h2>What it says</h2>
  <p>A feedback loop exists when a system's result changes the thing that produced it. There are two kinds. A <strong>balancing</strong> (negative) loop measures the gap from a target and acts to close it: a thermostat, hunger, a manager who adds people when a project falls behind. A <strong>reinforcing</strong> (positive) loop amplifies whatever change happens: a microphone picking up its own speaker, a bank run, word of mouth, a snowball rolling downhill.</p>
  <p>The vocabulary comes from cybernetics, in Norbert Wiener's 1948 <em>Cybernetics</em>, and from Jay Forrester's system dynamics work at MIT. It reached a general audience through Donella Meadows' <em>Thinking in Systems</em> (2008), which is still the clearest introduction.</p>
</section>
<section>
  <h2>Delay is the troublemaker</h2>
  <p>A balancing loop with a fast, accurate signal settles calmly. Add delay, so the system acts on old information, and it overshoots: it keeps heating after the room is warm, then keeps cooling after it's cold. Make the response stronger at the same time and the swings grow instead of fading. Meadows uses a car dealer ordering stock with a lag as the example. Turn up the delay slider and you get the same thing as a shower that is scalding, then freezing.</p>
  <div class="points">
    <div><h3>Balancing, no delay</h3><p>Gap closes smoothly. Most of the stability you see in the world, from body temperature to prices, works like this.</p></div>
    <div><h3>Balancing, long delay</h3><p>Overshoot and oscillation. Boom-and-bust hiring, inventory cycles, over-steering a car.</p></div>
    <div><h3>Reinforcing</h3><p>Small gaps grow until something external stops them: the speaker's limit, the size of the market, the run on the bank ending in collapse.</p></div>
  </div>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>Real systems have many loops at once, and which one dominates can switch: a viral product grows (reinforcing) until it saturates its market (balancing). Labelling a loop is easy; working out its delay and strength is the hard, empirical part. Be wary of loop diagrams drawn from intuition alone.</p>
  <div class="try"><h3>Try it</h3><p>Pick one situation you're in that keeps swinging back and forth (sleep schedule, budget, team workload). Write down what is measured, who acts on it, and how long the gap is between the change and the reaction. Is the fix a faster signal or a gentler response?</p></div>
</section>`,
    mount(ctx) {
      const { THREE } = ctx, S = ctx.scene, p = painter(ctx);
      const T = 20, N = 240, STEP = 1 / 30, LO = 0, HI = 40;
      const CX = -3.2, TX0 = -1.2, TX1 = 5.4, TY = 2, AMP = 1.7;
      let mode = 'bal', delay = 1.0, gain = 1.0, x = T, acc = 0;
      let hist = new Array(N).fill(T);

      const ballMat = p.std('good');
      const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), ballMat);
      ball.position.set(CX, TY, 0); S.add(ball);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.05, 8, 80), p.std('muted'));
      ring.position.copy(ball.position); S.add(ring);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 16), p.std('accent'));
      S.add(arrow);

      // strip chart
      const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(TX1 - TX0, AMP * 2 + 0.6)), p.line('line'));
      frame.position.set((TX0 + TX1) / 2, TY, 0); S.add(frame);
      const tgt = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(TX0, TY, 0), new THREE.Vector3(TX1, TY, 0)]), p.line('good'));
      S.add(tgt);
      const pos = new Float32Array(N * 3);
      const traceGeo = new THREE.BufferGeometry(); traceGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const trace = new THREE.Line(traceGeo, p.line('warm'));
      S.add(trace);

      const tagNow = ctx.tag(''), tagTgt = ctx.tag('target<b>20\u00b0</b>'), tagSign = ctx.tag(''), tagChart = ctx.tag('last 8 seconds');
      const out = readout(ctx);

      function step() {
        const d = Math.max(0, Math.min(N - 1, Math.round(delay / STEP)));
        const xd = hist[N - 1 - d];
        const err = xd - T;
        x += (mode === 'bal' ? -gain * err : 0.8 * gain * err) * STEP;
        x = Math.max(LO, Math.min(HI, x));
        hist.push(x); hist.shift();
      }
      function prefill(kick) { hist = new Array(N).fill(T); x = T + kick; for (let i = 0; i < N; i++) step(); }

      function draw() {
        for (let i = 0; i < N; i++) {
          const yy = TY + Math.max(-AMP, Math.min(AMP, (hist[i] - T) / 12 * AMP));
          pos[i * 3] = TX0 + (TX1 - TX0) * i / (N - 1); pos[i * 3 + 1] = yy; pos[i * 3 + 2] = 0.01;
        }
        traceGeo.attributes.position.needsUpdate = true;
        const dev = Math.abs(x - T);
        ball.scale.setScalar(0.65 + Math.min(1, dev / 20) * 0.55);
        const t = Math.min(1, dev / 12);
        p.mix(ballMat, 'good', x >= T ? 'bad' : 'c2', t);
        tagNow.innerHTML = `room now<b>${x.toFixed(1)}\u00b0</b>`;
      }

      function classify() {
        const recent = hist.slice(N - 150), dev = recent.map(v => v - T);
        const a = Math.max(...dev.slice(0, 75).map(Math.abs)), b = Math.max(...dev.slice(75).map(Math.abs));
        let crossings = 0; for (let i = 1; i < dev.length; i++) if (Math.sign(dev[i]) !== Math.sign(dev[i - 1]) && Math.abs(dev[i]) > 0.05) crossings++;
        const now = Math.abs(x - T);
        if (mode === 'bal') {
          if (now < 0.25 && b < 0.4) return 'Settled on target. The heater measured the gap and closed it.';
          if (b > a * 1.15 && b > 1) return 'The swings are <strong>growing</strong>. The heater is acting on readings ' + delay.toFixed(1) + ' s old, so every correction lands too late and too hard. Shorten the delay or weaken the response.';
          if (crossings >= 2) return 'It <strong>overshoots and rings</strong>. The delay means the heater keeps going after the room passes the target.';
          return 'Closing in on the target: a balancing loop shrinks the gap.';
        }
        if (x <= LO + 0.01 || x >= HI - 0.01) return 'It <strong>ran away</strong> and hit the limit of the system (' + (x >= HI ? HI : LO) + '\u00b0). Reinforcing loops stop only when something outside them does.';
        if (now < 0.25) return 'Balanced on a knife-edge. Exactly at target nothing changes, but any nudge will grow. Press "Knock it".';
        return 'The gap is <strong>feeding itself</strong>: the warmer it gets, the harder it heats.';
      }
      let lastMsg = '';
      function explain() {
        const sign = mode === 'bal' ? '\u2212' : '+';
        tagSign.innerHTML = `<b>${sign}</b>${mode === 'bal' ? 'balancing' : 'reinforcing'}`;
        const msg = `${mode === 'bal' ? 'Balancing' : 'Reinforcing'} loop, delay <strong>${delay.toFixed(1)} s</strong>, strength <strong>${gain.toFixed(1)}</strong>. ${classify()} Temperatures and strengths are illustrative.`;
        if (msg !== lastMsg) { out.innerHTML = msg; lastMsg = msg; }
      }

      chips(ctx, 'Loop type', [['bal', 'Balancing (thermostat)'], ['rein', 'Reinforcing (mic squeal)']], mode, v => { mode = v; prefill(v === 'bal' ? 8 : 1.5); draw(); explain(); });
      slider(ctx, { label: 'Delay before the heater reacts', min: 0, max: 3, step: 0.1, value: delay, fmt: v => v.toFixed(1) + ' s', onInput: v => { delay = v; } });
      slider(ctx, { label: 'Strength of response', min: 0.3, max: 3, step: 0.1, value: gain, fmt: v => v.toFixed(1) + '\u00d7', onInput: v => { gain = v; } });
      const r = row(ctx);
      r.add(button(ctx, 'Knock it +6\u00b0', () => { x = Math.min(HI, x + 6); }));
      r.add(button(ctx, 'Reset', () => { prefill(mode === 'bal' ? 8 : 1.5); draw(); explain(); }, true));

      prefill(8); draw(); explain();
      ctx.fit(10.4, 5.2, new THREE.Vector3(0.9, TY, 0), new THREE.Vector3(0, 0.15, 1));
      const v = new THREE.Vector3();
      let spin = 0, tick = 0;
      ctx.onFrame(dt => {
        acc += dt;
        while (acc >= STEP) { step(); acc -= STEP; }
        draw();
        tick += dt; if (tick > 0.25) { tick = 0; explain(); }
        if (!ctx.reduce) spin += dt * (mode === 'bal' ? -1 : 1) * 2.4 / (1 + delay);
        const a = spin + Math.PI / 2;
        arrow.position.set(CX + Math.cos(a) * 1.75, TY + Math.sin(a) * 1.75, 0);
        arrow.rotation.z = a + (mode === 'bal' ? Math.PI : 0);
        ctx.place(tagNow, v.set(CX, TY - 2.3, 0));
        ctx.place(tagSign, v.set(CX, TY + 2.25, 0));
        ctx.place(tagTgt, v.set(TX1 + 0.55, TY, 0));
        ctx.place(tagChart, v.set((TX0 + TX1) / 2, TY + AMP + 0.6, 0));
      });
    },
  });

  // ============================================================
  // Day 17 \u00b7 Leverage
  // ============================================================
  const LEVERS = {
    muscle: { name: 'Muscle', load: 'a 200 kg rock', unit: 'kg of push', arm: 'a long plank', note: 'Archimedes\' version: the long arm trades distance for force. Your end travels much further than the rock rises.' },
    code: { name: 'Code', load: '200 users\' worth of work', unit: 'hours of building', arm: 'software that runs again for free', note: 'Code is a lever because each extra run costs almost nothing. The "distance" you pay is the up-front build and the upkeep.' },
    capital: { name: 'Capital', load: 'a 200-unit project', unit: 'units of your own money', arm: 'borrowed money', note: 'Debt multiplies results both ways. The same arm that lifts the load amplifies a loss if the fulcrum slips.' },
    media: { name: 'Media', load: 'an audience of 200', unit: 'hours writing or recording', arm: 'publishing', note: 'One piece of writing or video can be read by many people for no extra effort. The long arm is distribution, which you have to build first.' },
  };
  MM.register({
    id: 'leverage', day: 17, week: 3,
    title: 'Leverage',
    tagline: 'A lever multiplies the effect of your input, so it matters more where you push than how hard you push.',
    prompt: 'Slide the fulcrum and set how hard you push. Find the point where a small effort lifts the big load, then switch the lever type to see the same physics in work and money.',
    body: `
<section>
  <h2>What it says</h2>
  <p>A lever converts a small force over a long distance into a large force over a short one. Archimedes worked out the law of the lever (effort \u00d7 effort-arm = load \u00d7 load-arm) and is said to have boasted, "Give me a place to stand and I will move the Earth." As a mental model, leverage asks: <em>what multiplies my input?</em> Effort applied without leverage produces results in proportion to the effort. Effort applied through a lever produces results in proportion to the effort times the length of the arm.</p>
  <div class="math">lifts when:  effort \u00d7 effort-arm  \u2265  load \u00d7 load-arm
advantage =  effort-arm \u00f7 load-arm</div>
  <p>Naval Ravikant's 2018 essay-thread "How to Get Rich (without getting lucky)" popularised the modern split: labour and capital, which need someone else's permission, and code and media, which need nobody's permission and cost nothing to copy.</p>
</section>
<section>
  <h2>An everyday example</h2>
  <p>You answer the same customer question by email 30 times a week. Writing a help article takes 3 hours once; after that, each answer costs a link. The article is the long arm. Put the fulcrum near the load (understand the problem well enough to write it once) and the effort side gets cheap. The same applies to a checklist, a script, a template or a recorded explanation.</p>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>Leverage amplifies mistakes as easily as good work: a bug in widely used code, a bad post that spreads, borrowed money on a bad bet. It also always charges something on the other side, whether that's distance in physics, build time in code or risk in finance. In the scene you'll see that the longer the effort arm, the further your end has to travel. People who talk about leverage while ignoring that cost are usually selling something.</p>
  <div class="try"><h3>Try it</h3><p>List three tasks you repeat every week. For each, name the lever that could multiply it (code, a document, delegation, money, an audience) and the up-front "distance" you'd pay to build it. Do the one with the best ratio first.</p></div>
</section>`,
    mount(ctx) {
      const { THREE } = ctx, S = ctx.scene, p = painter(ctx);
      const HALF = 5, H = 1.25, LOAD = 200;
      let f = -1.5, effort = 40, kind = 'muscle', theta = 0;

      const ground = new THREE.Mesh(box(THREE, 13, 0.12, 3), p.std('line'));
      ground.position.y = -0.06; S.add(ground);
      const fulcrum = new THREE.Mesh(new THREE.ConeGeometry(0.55, H, 3), p.std('neutral'));
      fulcrum.rotation.y = Math.PI / 6; S.add(fulcrum);
      const pivot = new THREE.Group(); S.add(pivot);
      const beam = new THREE.Mesh(box(THREE, HALF * 2, 0.16, 0.8), p.std('accent'));
      pivot.add(beam);
      const loadM = new THREE.Mesh(box(THREE, 1.5, 1.5, 1.5), p.std('bad'));
      pivot.add(loadM);
      const effM = new THREE.Mesh(box(THREE, 1, 1, 1), p.std('warm'));
      pivot.add(effM);
      const tagLoad = ctx.tag(''), tagEff = ctx.tag(''), tagF = ctx.tag(''), tagArmL = ctx.tag(''), tagArmE = ctx.tag('');
      const out = readout(ctx);

      const arms = () => ({ dL: f + HALF, dE: HALF - f });
      function target() {
        const { dL, dE } = arms();
        return effort * dE >= LOAD * dL ? -Math.asin(Math.min(0.95, (H - 0.05) / dE)) : Math.asin(Math.min(0.95, (H - 0.05) / dL));
      }
      function layout() {
        fulcrum.position.set(f, H / 2, 0);
        pivot.position.set(f, H + 0.08, 0);
        beam.position.x = -f;
        const s = 0.35 + Math.cbrt(effort / 100) * 0.75;
        loadM.position.set(-HALF - f + 0.75, 0.83, 0);
        effM.scale.setScalar(s); effM.position.set(HALF - f - s / 2, 0.08 + s / 2, 0);
        pivot.rotation.z = theta;
      }
      function explain() {
        const L = LEVERS[kind], { dL, dE } = arms(), adv = dE / dL, need = LOAD * dL / dE, lifts = effort >= need;
        tagLoad.innerHTML = `${L.load}<b>${LOAD}</b>`;
        tagEff.innerHTML = `you<b>${effort}</b>`;
        tagF.innerHTML = `fulcrum<b>\u00d7${adv.toFixed(1)}</b>`;
        tagArmL.textContent = `load arm ${dL.toFixed(1)}`; tagArmE.textContent = `effort arm ${dE.toFixed(1)}`;
        out.innerHTML = `Lever: <strong>${L.name}</strong>, ${L.arm}. Advantage <strong>\u00d7${adv.toFixed(1)}</strong>, so lifting ${L.load} takes at least <strong>${Math.ceil(need)}</strong> ${L.unit}. You're putting in <strong>${effort}</strong>: ${lifts ? '<strong>it lifts</strong>' : '<strong>not enough</strong>, so move the fulcrum toward the load or push harder'}. Your end moves <strong>${adv.toFixed(1)}\u00d7</strong> as far as the load rises. ${L.note} Weights are illustrative.`;
      }

      chips(ctx, 'Kind of lever', Object.entries(LEVERS).map(([k, v]) => [k, v.name]), kind, v => { kind = v; explain(); });
      slider(ctx, { label: 'Fulcrum position', min: -4, max: 3, step: 0.1, value: f, fmt: v => v <= -2.5 ? 'close to the load' : v >= 1 ? 'close to you' : 'middle', onInput: v => { f = v; layout(); explain(); } });
      slider(ctx, { label: 'Your effort', min: 5, max: 200, step: 5, value: effort, fmt: v => v + ' (load is 200)', onInput: v => { effort = v; layout(); explain(); } });

      theta = target(); layout(); explain();
      ctx.fit(12.4, 6, new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(0, 0.3, 1));
      const v = new THREE.Vector3();
      ctx.onFrame(dt => {
        theta += (target() - theta) * damp(ctx, 5, dt);
        pivot.rotation.z = theta;
        pivot.updateMatrixWorld();
        ctx.place(tagLoad, loadM.getWorldPosition(v).add(new THREE.Vector3(0, 1.35, 0)));
        ctx.place(tagEff, effM.getWorldPosition(v).add(new THREE.Vector3(0, effM.scale.y * 0.5 + 0.6, 0)));
        ctx.place(tagF, v.set(f, -0.45, 1.1));
        ctx.place(tagArmL, v.set((f - HALF) / 2, H + 0.75 + Math.sin(-theta) * (HALF + f) / 2, 0.6));
        ctx.place(tagArmE, v.set((f + HALF) / 2, H - 0.5 + Math.sin(theta) * (HALF - f) / 2, 0.6));
      });
    },
  });

  // ============================================================
  // Day 18 \u00b7 Bottlenecks
  // ============================================================
  MM.register({
    id: 'bottlenecks', day: 18, week: 3,
    title: 'Bottlenecks',
    tagline: 'A system can produce no faster than its slowest step, so improving anything else just moves the pile.',
    prompt: 'Four stations pass work along a line. Speed up any station and watch the exit rate and where the pile builds up. Only one upgrade at a time changes the output.',
    body: `
<section>
  <h2>What it says</h2>
  <p>In any chain of dependent steps, throughput is set by the slowest one, which is called the constraint or bottleneck. Work piles up in front of it, and the steps after it sit waiting. Speeding up a step that isn't the bottleneck makes no difference to output; it just grows the pile in front of the constraint.</p>
  <p>This is the core of Eliyahu Goldratt's <em>Theory of Constraints</em>, introduced in his 1984 business novel <em>The Goal</em>, where a plant manager learns it from a scout troop hike: the whole troop moves at the pace of the slowest walker, Herbie. Goldratt's five focusing steps: <strong>identify</strong> the constraint, <strong>exploit</strong> it (never let it sit idle), <strong>subordinate</strong> everything else to it, <strong>elevate</strong> it (add capacity), then <strong>repeat</strong>, because the bottleneck moves.</p>
</section>
<section>
  <h2>An everyday example</h2>
  <div class="points">
    <div><h3>Software team</h3><p>Developers ship pull requests faster than one reviewer can read them. Hiring more developers lengthens the review queue. Adding reviewers, or making changes smaller, raises output.</p></div>
    <div><h3>Your week</h3><p>If the scarce thing is two hours of focused attention, saving 20 minutes on email does nothing for the project. Protecting the focus block does.</p></div>
    <div><h3>A kitchen</h3><p>Ten cooks, one oven. Prep speed doesn't matter; whatever keeps the oven full all evening does.</p></div>
  </div>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>Real systems are noisy: rates vary, and a step that is usually fine can become the constraint for a day. Sometimes the constraint isn't a station at all but a policy, such as a batch size or an approval rule. And a pile isn't always in front of the true bottleneck if work is being pushed in faster than it's pulled. Look for where work waits, then check the rates.</p>
  <div class="try"><h3>Try it</h3><p>Speed up Weld three times and watch the exit rate. Then speed up Paint until the bottleneck moves. Now map one process you're part of as 3\u20135 steps, guess the rate of each, and look for the pile. Where does work wait longest?</p></div>
</section>`,
    mount(ctx) {
      const { THREE } = ctx, S = ctx.scene, p = painter(ctx);
      const NAMES = ['Cut', 'Weld', 'Paint', 'Pack'], BASE = [1.2, 1.0, 0.5, 0.9], XS = [-3.9, -1.3, 1.3, 3.9];
      const CAP = 60, ISZ = 0.28, POOL = CAP + 4;
      let rates = BASE.slice(), queues, busy, timers, items, doneTimes, simT, msg = '';

      const ground = new THREE.Mesh(box(THREE, 11.8, 0.1, 2.6), p.std('line'));
      ground.position.y = -0.05; S.add(ground);
      const belt = new THREE.Mesh(box(THREE, 11.2, 0.06, 0.7), p.std(['neutral', 'bg', 0.3]));
      belt.position.y = 0.03; S.add(belt);
      const stMats = [], stations = XS.map(x => {
        const m = p.std('accent'); stMats.push(m);
        const s = new THREE.Mesh(box(THREE, 1.15, 0.8, 1.15), m);
        s.position.set(x, 0.4, 0); S.add(s); return s;
      });
      const supply = new THREE.Mesh(box(THREE, 0.9, 0.5, 0.9), p.std('neutral'));
      supply.position.set(-5.4, 0.25, 0); S.add(supply);
      const shipped = new THREE.Mesh(box(THREE, 0.9, 0.5, 0.9), p.std('good'));
      shipped.position.set(5.4, 0.25, 0); S.add(shipped);
      const itemGeo = box(THREE, ISZ, ISZ, ISZ), itemMat = p.std('warm');
      const pool = []; for (let i = 0; i < POOL; i++) { const m = new THREE.Mesh(itemGeo, itemMat); m.visible = false; S.add(m); pool.push(m); }

      const stTags = NAMES.map(() => ctx.tag('')), qTags = NAMES.map(() => ctx.tag(''));
      const tagShip = ctx.tag(''), tagSup = ctx.tag('raw<br>material');
      const out = readout(ctx);

      function reset() {
        queues = NAMES.map(() => []); busy = NAMES.map(() => null); timers = NAMES.map(() => 0);
        items = 0; doneTimes = []; simT = 0;
        pool.forEach(m => { m.visible = false; m.userData.free = true; });
      }
      const grab = () => { const m = pool.find(o => o.userData.free); if (m) { m.userData.free = false; m.visible = true; m.position.copy(supply.position).setY(0.6); } return m; };
      const release = m => { m.userData.free = true; m.visible = false; };
      // queue piles up in 3\u00d73 layers just upstream of each station
      const queueSlot = (i, k) => new THREE.Vector3(XS[i] - 0.85 - (k % 3) * (ISZ + 0.04), 0.06 + ISZ / 2 + Math.floor(k / 9) * (ISZ + 0.03), (Math.floor(k / 3) % 3 - 1) * (ISZ + 0.04));
      function targets() {
        queues.forEach((q, i) => q.forEach((m, k) => { m.userData.tgt = queueSlot(i, k); }));
        busy.forEach((m, i) => { if (m) m.userData.tgt = new THREE.Vector3(XS[i], 0.8 + ISZ / 2, 0); });
      }
      function simStep(h) {
        simT += h;
        for (let i = NAMES.length - 1; i >= 0; i--) {
          if (busy[i]) {
            timers[i] -= h;
            if (timers[i] <= 0) {
              const m = busy[i]; busy[i] = null;
              if (i === NAMES.length - 1) { release(m); items--; doneTimes.push(simT); }
              else queues[i + 1].push(m);
            }
          }
          if (!busy[i]) {
            let m = null;
            if (i === 0) { if (items < CAP) { m = grab(); if (m) items++; } }
            else if (queues[i].length) m = queues[i].shift();
            if (m) { busy[i] = m; timers[i] = 1 / rates[i]; }
          }
        }
        while (doneTimes.length && doneTimes[0] < simT - 20) doneTimes.shift();
      }
      const slowest = () => rates.indexOf(Math.min(...rates));

      function explain() {
        const b = slowest(), win = Math.min(20, simT), measured = win > 2 ? doneTimes.length / win : 0;
        rates.forEach((r, i) => {
          p.set(stMats[i], i === b ? 'bad' : 'accent');
          stTags[i].innerHTML = `${NAMES[i]}<b>${r.toFixed(1)}/s</b>`;
          qTags[i].textContent = i > 0 && queues[i].length ? `${queues[i].length} waiting` : '';
        });
        tagShip.innerHTML = `shipped<b>${measured.toFixed(2)}/s</b>`;
        out.innerHTML = `${msg}Exit rate (last ${Math.round(win)} s): <strong>${measured.toFixed(2)}/s</strong>. The slowest station is <strong>${NAMES[b]}</strong> at <strong>${rates[b].toFixed(1)}/s</strong>, which caps the line. Rates are illustrative.`;
      }
      function upgrade(i) {
        const before = slowest(), old = rates[i];
        rates[i] = Math.round((rates[i] + 0.3) * 10) / 10;
        const after = slowest();
        if (i !== before) msg = `You sped up <strong>${NAMES[i]}</strong> (${old.toFixed(1)} \u2192 ${rates[i].toFixed(1)}/s). It wasn't the bottleneck, so the exit rate won't move; the pile in front of ${NAMES[before]} just grows. `;
        else if (after !== i) msg = `You sped up the bottleneck <strong>${NAMES[i]}</strong>. Output rises, and the constraint <strong>moved to ${NAMES[after]}</strong>. `;
        else msg = `You sped up the bottleneck <strong>${NAMES[i]}</strong> (${old.toFixed(1)} \u2192 ${rates[i].toFixed(1)}/s). Output rises to match. `;
        explain();
      }

      const r = row(ctx);
      NAMES.forEach((n, i) => r.add(button(ctx, `Speed up ${n}`, () => upgrade(i), true)));
      r.add(button(ctx, 'Reset line', () => { rates = BASE.slice(); msg = ''; reset(); warm(); explain(); }));

      function warm() { for (let i = 0; i < 600; i++) simStep(0.05); targets(); pool.forEach(m => { if (!m.userData.free && m.userData.tgt) m.position.copy(m.userData.tgt); }); }
      reset(); warm(); explain();
      ctx.fit(12, 3.6, new THREE.Vector3(0, 0.9, 0), new THREE.Vector3(0, 0.6, 1));
      const v = new THREE.Vector3();
      let tick = 0;
      ctx.onFrame(dt => {
        simStep(dt); targets();
        const k = damp(ctx, 12, dt);
        pool.forEach(m => { if (!m.userData.free && m.userData.tgt) m.position.lerp(m.userData.tgt, k); });
        tick += dt; if (tick > 0.3) { tick = 0; explain(); }
        XS.forEach((x, i) => {
          ctx.place(stTags[i], v.set(x, 1.55, 0));
          const h = Math.ceil(queues[i].length / 9) * (ISZ + 0.03);
          ctx.place(qTags[i], v.set(x - 1.2, 0.45 + h, 0.7));
        });
        ctx.place(tagShip, v.set(5.4, 1.1, 0));
        ctx.place(tagSup, v.set(-5.4, 1.1, 0));
      });
    },
  });

  // ============================================================
  // Day 19 \u00b7 Regret minimization
  // ============================================================
  MM.register({
    id: 'regret-minimization', day: 19, week: 3,
    title: 'Regret minimization',
    tagline: 'Picture yourself at 80 looking back, and choose the path you\'ll regret least, which is usually the one where you tried.',
    prompt: 'The scale weighs two regrets: trying and the outcome, versus never trying. Slide time forward from the day of the decision to age 80 and watch which side gets heavier.',
    body: `
<section>
  <h2>What it says</h2>
  <p>When a decision is big, uncertain and personal, project yourself to the end of your life and ask which choice you'd regret less. Jeff Bezos described using this "regret minimization framework" in 1994, when deciding whether to leave a well-paid job at D. E. Shaw to start an online bookshop: "I knew that when I was 80 I was not going to regret having tried this... I knew the one thing I might regret is not ever having tried."</p>
  <p>It works because it changes the timescale. In the moment, the vivid fear is of failing and looking foolish. From 80, short-term embarrassment fades and the unanswered "what if?" stays.</p>
</section>
<section>
  <h2>Why the scale tips over time</h2>
  <p>Psychologists Thomas Gilovich and Victoria Medvec (1995, <em>The experience of regret: what, when, and why</em>) found that in the short term people regret their actions more, but looking back over a lifetime they regret their inactions more, by roughly two to one in their surveys. Regret for things done tends to fade: we explain them, learn from them and move on. Regret for things not done grows, because the imagined alternative stays perfect. The curves in the scene are illustrative and show only that shape; the exact weights are invented.</p>
  <div class="math">regret(tried, failed)  : high at first, fades
regret(never tried)    : small at first, grows
choose the path with the lower weight at age 80</div>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>It's a tool for choices where the downside is survivable and the main cost is fear. It's poor at weighing irreversible harm, such as risking your health, someone else's money or a family's security, because the 80-year-old version of you also lives with those consequences. It also ignores the person who would have been affected if you didn't do it. Use it alongside inversion and margin of safety, not instead of them.</p>
  <div class="try"><h3>Try it</h3><p>Name one thing you've been putting off because you might fail. Write two sentences from yourself at 80: one if you tried and it didn't work, one if you never tried. Which one hurts more to read? Then check the downside: is failure survivable?</p></div>
</section>`,
    mount(ctx) {
      const { THREE } = ctx, S = ctx.scene, p = painter(ctx);
      const ARM = 2.8, BY = 3.4, MAXS = 12;
      let yrs = 50, outcome = 'fail', shownYrs = 50, playing = false, theta = 0;

      const ground = new THREE.Mesh(box(THREE, 10, 0.1, 3.6), p.std('line'));
      ground.position.y = -0.05; S.add(ground);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, BY, 16), p.std('neutral'));
      post.position.y = BY / 2; S.add(post);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.14, 24), p.std('neutral'));
      foot.position.y = 0.07; S.add(foot);
      const beam = new THREE.Mesh(box(THREE, ARM * 2 + 0.3, 0.12, 0.2), p.std('fg'));
      beam.position.y = BY; S.add(beam);
      const stringMat = p.line('muted');
      function pan(key) {
        const g = new THREE.Group();
        const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.8, 0.12, 28), p.std('neutral'));
        g.add(dish);
        const sg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.9, 0.06, 0), new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0.9, 0.06, 0)]);
        g.add(new THREE.Line(sg, stringMat));
        const stoneMat = p.std(key), stones = [];
        const geo = new THREE.SphereGeometry(0.22, 18, 12);
        for (let i = 0; i < MAXS; i++) {
          const s = new THREE.Mesh(geo, stoneMat);
          const layer = i < 6 ? 0 : i < 10 ? 1 : 2, idx = i < 6 ? i : i < 10 ? i - 6 : i - 10;
          const n = [6, 4, 2][layer], rad = [0.5, 0.3, 0.12][layer], a = idx / n * Math.PI * 2 + layer;
          s.position.set(Math.cos(a) * rad, 0.26 + layer * 0.3, Math.sin(a) * rad);
          s.visible = false; g.add(s); stones.push(s);
        }
        S.add(g); return { g, stones, mat: stoneMat };
      }
      const L = pan('bad'), R = pan('accent');
      // timeline
      const TL0 = -3.6, TL1 = 3.6, TZ = 1.5;
      const tl = new THREE.Mesh(box(THREE, TL1 - TL0, 0.06, 0.12), p.std('muted'));
      tl.position.set(0, 0.08, TZ); S.add(tl);
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 14), p.std('warm'));
      S.add(marker);

      const tagL = ctx.tag(''), tagR = ctx.tag(''), tag0 = ctx.tag('the decision<br>age 30'), tag80 = ctx.tag('looking back<br>age 80'), tagM = ctx.tag('');
      const out = readout(ctx);

      const wTried = y => outcome === 'fail' ? 1.5 + 8 * Math.exp(-y / 6) : 0.5 + 1.5 * Math.exp(-y / 4);
      const wNever = y => outcome === 'fail' ? 1 + 6.5 * (1 - Math.exp(-y / 12)) : 0.8 + 7 * (1 - Math.exp(-y / 12));
      // "It worked" isn't known when you choose; the never-tried side is the same feeling either way, slightly stronger if you later see someone else do it.

      function layout(y) {
        const a = wTried(y), b = wNever(y);
        const tgt = Math.max(-0.32, Math.min(0.32, (a - b) * 0.06));
        theta = tgt;
        [[L, a], [R, b]].forEach(([P, w]) => { const n = Math.round(w); P.stones.forEach((s, i) => { s.visible = i < n; }); });
        tagL.innerHTML = `tried, ${outcome === 'fail' ? 'failed' : 'it worked'}<b>${a.toFixed(1)}</b>`;
        tagR.innerHTML = `never tried<b>${b.toFixed(1)}</b>`;
        tagM.innerHTML = `<b>${Math.round(y)} yrs</b>`;
        return { a, b };
      }
      function pose() {
        beam.rotation.z = theta;
        const c = Math.cos(theta), s = Math.sin(theta);
        L.g.position.set(-ARM * c, BY - ARM * s - 1.5, 0);
        R.g.position.set(ARM * c, BY + ARM * s - 1.5, 0);
        marker.position.set(TL0 + (TL1 - TL0) * shownYrs / 50, 0.22, TZ);
      }
      function explain() {
        const y = Math.round(shownYrs), a = wTried(y), b = wNever(y);
        let verdict;
        if (Math.abs(a - b) < 0.6) verdict = 'The two regrets weigh about the same. This is roughly where the regret for having acted has faded to meet the regret for not acting.';
        else if (a > b) verdict = 'Right now <strong>trying and failing hurts more</strong>. This is the view that keeps people from trying: embarrassment is loud early on.';
        else verdict = outcome === 'fail' ? '<strong>Never trying weighs more</strong>, even though the attempt failed. The failure became a story; the "what if?" never resolved.' : '<strong>Never trying weighs far more</strong>. The upside you skipped is the heaviest regret on the scale.';
        out.innerHTML = `<strong>${y}</strong> years after the decision (age <strong>${30 + y}</strong>): trying weighs <strong>${a.toFixed(1)}</strong>, never trying weighs <strong>${b.toFixed(1)}</strong>. ${verdict} Weights are illustrative; the shape follows Gilovich & Medvec (1995).`;
      }

      chips(ctx, 'If you try', [['fail', 'Tried and failed'], ['win', 'Tried and it worked']], outcome, v => { outcome = v; layout(shownYrs); explain(); });
      const sl = slider(ctx, { label: 'Years since the decision', min: 0, max: 50, step: 1, value: yrs, fmt: v => `${v} years \u00b7 age ${30 + v}`, onInput: v => { yrs = v; shownYrs = v; playing = false; layout(v); explain(); } });
      const rr = row(ctx);
      rr.add(button(ctx, 'Live it out (age 30 \u2192 80)', () => { if (ctx.reduce) { shownYrs = 50; } else { shownYrs = 0; playing = true; } sl.set(Math.round(shownYrs)); layout(shownYrs); explain(); }));

      layout(yrs); explain();
      let beamT = theta; theta = beamT; pose();
      ctx.fit(9.4, 5.4, new THREE.Vector3(0, 2.1, 0.4), new THREE.Vector3(0, 0.3, 1));
      const v = new THREE.Vector3();
      let tick = 0;
      ctx.onFrame(dt => {
        if (playing) {
          shownYrs = Math.min(50, shownYrs + dt * 8);
          if (shownYrs >= 50) playing = false;
          tick += dt; if (tick > 0.15 || !playing) { tick = 0; sl.set(Math.round(shownYrs)); explain(); }
        }
        layout(shownYrs);
        const want = theta;
        beamT += (want - beamT) * damp(ctx, 4, dt); theta = beamT; pose();
        ctx.place(tagL, v.set(L.g.position.x, L.g.position.y - 0.6, 0.9));
        ctx.place(tagR, v.set(R.g.position.x, R.g.position.y - 0.6, 0.9));
        ctx.place(tag0, v.set(TL0, -0.35, TZ + 0.3));
        ctx.place(tag80, v.set(TL1, -0.35, TZ + 0.3));
        ctx.place(tagM, v.set(marker.position.x, 0.75, TZ));
      });
    },
  });

  // ============================================================
  // Day 20 \u00b7 The latticework
  // ============================================================
  // Each problem lists the model ideas it needs, matched against the hub's own titles (read from the nav at runtime).
  const PROBLEMS = [
    {
      id: 'job', label: 'Should I take the new job?',
      uses: [
        [/first.?principles/i, 'Strip the offer to what you actually want from work, not what the title signals.'],
        [/invers/i, 'Ask what would make this move a disaster, and check for those.'],
        [/second.?order/i, 'Then what? Commute, team, what the role leads to in 3 years.'],
        [/opportunity cost/i, 'What you give up by saying yes, including other offers you won\'t look for.'],
        [/circle of competence/i, 'Is the new role inside what you know, or a stretch you can learn?'],
        [/probab|bayes|expected value/i, 'Put rough odds on the good and bad outcomes instead of picturing just one.'],
        [/sunk cost/i, 'Years already spent at the current job aren\'t a reason to stay.'],
        [/regret/i, 'At 80, which would you rather have tried?'],
        [/compound/i, 'Which path compounds skills and relationships faster?'],
        [/margin of safety/i, 'Keep a cash buffer so the move survives a bad first year.'],
        [/reversib|door/i, 'Can you come back if it goes wrong? Reversible choices deserve less agonising.'],
      ],
    },
    {
      id: 'deadlines', label: 'Our team keeps missing deadlines',
      uses: [
        [/bottleneck|constraint/i, 'Find where work waits: reviews, approvals, one overloaded person.'],
        [/feedback/i, 'Late projects cause overtime, which causes mistakes, which causes more lateness.'],
        [/hanlon/i, 'Assume overload or unclear priorities before laziness.'],
        [/second.?order/i, 'Adding people to a late project can make it later, at least at first.'],
        [/map|territory/i, 'The plan on the board isn\'t the work as it actually happens.'],
        [/first.?principles/i, 'What does "done" actually require? Cut the rest.'],
        [/incentive/i, 'What is the team actually rewarded for: starting things or finishing them?'],
        [/invers/i, 'How would we guarantee missing the next deadline? Stop doing those things.'],
        [/occam/i, 'Prefer the simple explanation (too much work in progress) to a complicated one.'],
        [/margin of safety/i, 'Pad estimates for the unknowns instead of planning to the day.'],
        [/leverage/i, 'Automate or template the repeated parts so effort goes further.'],
      ],
    },
    {
      id: 'side', label: 'My side project isn\'t growing',
      uses: [
        [/compound/i, 'Is anything accumulating, such as an email list, content or users who refer others?'],
        [/feedback/i, 'Look for a reinforcing loop, where happy users bring more users, and feed it.'],
        [/leverage/i, 'Code and media scale; hours of one-to-one work don\'t.'],
        [/bottleneck|constraint/i, 'Is the limit discovery, sign-up, activation or your own time?'],
        [/first.?principles/i, 'What does a user actually need from it, stripped of what similar products do?'],
        [/sunk cost/i, 'Time already spent isn\'t a reason to keep the current version.'],
        [/opportunity cost/i, 'What else could those evenings build?'],
        [/probab|bayes|base rate/i, 'Most side projects stay small; what evidence says this one is different?'],
        [/circle of competence/i, 'Are you good at building it, at selling it, or both?'],
        [/margin of safety/i, 'Keep your main income until the project covers its costs with room to spare.'],
        [/occam/i, 'The likeliest reason is usually that not enough people see it.'],
      ],
    },
    {
      id: 'conflict', label: 'A colleague ignored my request',
      uses: [
        [/hanlon/i, 'Busy or unaware is more likely than hostile.'],
        [/occam/i, 'The simplest story is that it got buried in their inbox.'],
        [/probab|bayes/i, 'One ignored email is weak evidence. Update a little, not a lot.'],
        [/map|territory/i, 'Your picture of their week isn\'t their week.'],
        [/second.?order/i, 'A sharp reply now affects the next ten requests.'],
        [/invers/i, 'How would you make them ignore you next time? Avoid that.'],
        [/feedback/i, 'Coldness invites coldness: a reinforcing loop worth not starting.'],
        [/incentive/i, 'Is helping you part of what they\'re measured on?'],
        [/regret/i, 'Which response will you be glad you chose?'],
      ],
    },
  ];
  MM.register({
    id: 'latticework', day: 20, week: 3,
    title: 'The latticework',
    tagline: 'No single model is enough. Hang problems on a lattice of several, and the useful ones light up together.',
    prompt: 'Each node is one of the other models in this hub. Pick a real problem and see which models apply and how they link up. Read the reasons in the panel.',
    body: `
<section>
  <h2>What it says</h2>
  <p>Charlie Munger, in his 1994 talk at USC Business School ("A Lesson on Elementary, Worldly Wisdom"), argued that isolated facts don't stick and don't help: "You've got to have models in your head. And you've got to array your experience, both vicarious and direct, on this latticework of models." He added the warning that goes with it: "To a man with a hammer, everything looks like a nail." One model, applied to everything, distorts what you see.</p>
  <p>The latticework is the habit of reaching for several models at once and noticing where they agree, where they conflict, and what each one sees that the others miss.</p>
</section>
<section>
  <h2>How to use the lattice</h2>
  <div class="points">
    <div><h3>Collect</h3><p>Learn the big ideas from many fields, which is what the last 19 days were for. Depth in one field plus a few key ideas from many others beats depth alone.</p></div>
    <div><h3>Cross-check</h3><p>When three models point the same way, act with confidence. When two disagree, you've found the part of the problem worth thinking about.</p></div>
    <div><h3>Sequence</h3><p>Models often chain: inversion finds the risk, second-order thinking traces it, margin of safety sizes the buffer.</p></div>
  </div>
</section>
<section>
  <h2>Where it breaks down</h2>
  <p>A long list of models can become a ritual: running through a checklist without actually understanding the situation. Models are simplifications, so which ones fit is a judgement call, and in the scene the links come from a fixed list, not from any real reasoning about your case. Over time the goal is fluency, so the right two or three come to mind without the checklist.</p>
  <div class="try"><h3>Try it</h3><p>Write down one problem you're facing this week. Pick three models from this hub that apply. For each, write one sentence about what it tells you. Where do they agree, and where do they pull in different directions?</p></div>
</section>`,
    mount(ctx) {
      const { THREE } = ctx, S = ctx.scene, p = painter(ctx);
      const RAD = 3.3;
      // The other 17 models (days 7 and 14 are review days). Links come from the hub's nav by title, so they work whatever the final ids are.
      const titles = ['First principles', 'Inversion', 'Second-order thinking', 'Opportunity cost', 'Circle of competence', 'The map is not the territory',
        'Probabilistic thinking', 'Occam\'s razor', 'Hanlon\'s razor', 'Sunk cost fallacy', 'Margin of safety', 'Incentives',
        'Compounding', 'Feedback loops', 'Leverage', 'Bottlenecks', 'Regret minimization'];
      const norm = t => t.toLowerCase().replace(/[\u2018\u2019']/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
      const hrefs = {};
      document.querySelectorAll('#nav a').forEach(a => {
        const c = a.cloneNode(true); c.querySelectorAll('span').forEach(x => x.remove());
        hrefs[norm(c.textContent)] = { href: a.getAttribute('href'), ext: a.target === '_blank' };
      });
      const linkFor = t => {
        const h = hrefs[norm(t)];
        return h ? `<a href="${h.href}"${h.ext ? ' target="_blank" rel="noopener"' : ''}><strong>${t}</strong></a>` : `<strong>${t}</strong>`;
      };

      const n = titles.length, ga = Math.PI * (3 - Math.sqrt(5));
      const world = new THREE.Group(); S.add(world);
      const nodeGeo = new THREE.SphereGeometry(0.2, 20, 14);
      const nodes = titles.map((t, i) => {
        const y = 1 - (i + 0.5) / n * 2, r = Math.sqrt(1 - y * y), a = i * ga;
        const m = new THREE.Mesh(nodeGeo, p.std('neutral'));
        m.position.set(Math.cos(a) * r * RAD, y * RAD * 0.82, Math.sin(a) * r * RAD);
        world.add(m);
        const tg = ctx.tag(t); tg.style.transition = 'opacity .3s';
        return { t, m, tg, on: false, why: '' };
      });
      // faint lattice between near neighbours
      const segs = [];
      nodes.forEach((a, i) => {
        const d = nodes.map((b, j) => [j, a.m.position.distanceTo(b.m.position)]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 3);
        d.forEach(([j]) => { if (j > i) segs.push(a.m.position, nodes[j].m.position); });
      });
      const webMat = p.line('line', { transparent: true, opacity: 0.9 });
      world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), webMat));
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 18), p.std('warm'));
      world.add(hub);
      const hubTag = ctx.tag('');
      const linkMat = p.line('warm'), crossMat = p.line('c1', { transparent: true, opacity: 0.55 });
      let links = null, cross = null;
      const out = document.createElement('div'); out.className = 'readout'; out.setAttribute('aria-live', 'polite');

      function pick(id) {
        const P = PROBLEMS.find(x => x.id === id);
        nodes.forEach(nd => {
          const hit = P.uses.find(([re]) => re.test(nd.t));
          nd.on = !!hit; nd.why = hit ? hit[1] : '';
          p.set(nd.m.material, nd.on ? 'accent' : 'neutral');
          nd.m.scale.setScalar(nd.on ? 1.45 : 1);
          nd.tg.style.opacity = nd.on ? '1' : '0.45';
          nd.tg.style.fontWeight = nd.on ? '600' : '';
        });
        hubTag.innerHTML = `<b>${P.label}</b>`;
        const lit = nodes.filter(nd => nd.on);
        if (links) { world.remove(links); links.geometry.dispose(); }
        if (cross) { world.remove(cross); cross.geometry.dispose(); }
        const ls = []; lit.forEach(nd => ls.push(new THREE.Vector3(), nd.m.position));
        links = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ls), linkMat); world.add(links);
        const cs = []; for (let i = 0; i < lit.length; i++) cs.push(lit[i].m.position, lit[(i + 1) % lit.length].m.position);
        cross = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lit.length > 1 ? cs : []), crossMat); world.add(cross);
        out.innerHTML = lit.length
          ? `<strong>${lit.length}</strong> of ${n} models light up for \u201c${P.label}\u201d:<br>` + lit.map(nd => `${linkFor(nd.t)}: ${nd.why}`).join('<br>') + '<br>The links are a fixed, illustrative mapping; your own case may pull in others.'
          : `None of this hub's model titles matched \u201c${P.label}\u201d.`;
      }

      chips(ctx, 'Problem', PROBLEMS.map(x => [x.id, x.label]), PROBLEMS[0].id, pick);
      ctx.controls.appendChild(out);
      pick(PROBLEMS[0].id);

      ctx.fit(8.4, 7.6, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.25, 1));
      const v = new THREE.Vector3(), cam = new THREE.Vector3();
      let rot = 0.4;
      world.rotation.y = rot;
      ctx.onFrame(dt => {
        if (!ctx.reduce) { rot += dt * 0.12; world.rotation.y = rot; }
        world.updateMatrixWorld();
        cam.copy(ctx.camera.position);
        nodes.forEach(nd => {
          nd.m.getWorldPosition(v);
          const behind = v.z < -0.8 && !nd.on;
          nd.tg.style.display = behind ? 'none' : '';
          ctx.place(nd.tg, v.add(new THREE.Vector3(0, 0.42, 0)));
        });
        ctx.place(hubTag, v.set(0, -0.75, 0));
      });
    },
  });
})();
