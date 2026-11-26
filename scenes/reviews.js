/* Review days (7, 14, 21): "which model is this?" quizzes.
 * Each question is a short real-world scenario. The candidate models stand as pillars on the stage;
 * pick one (click a pillar or a button) and the right one rises while a wrong pick sinks.
 * Days 7 and 14 offer that week's six models every time; day 21 mixes all three weeks with four close calls per question.
 */
(function () {
  if (!window.MM) return;

  const M = {
    'first-principles': ['First principles', 1], 'inversion': ['Inversion', 2], 'second-order-thinking': ['Second-order thinking', 3],
    'opportunity-cost': ['Opportunity cost', 4], 'circle-of-competence': ['Circle of competence', 5], 'map-territory': ['The map is not the territory', 6],
    'probabilistic-thinking': ['Probabilistic thinking', 8], 'occams-razor': ['Occam’s razor', 9], 'hanlons-razor': ['Hanlon’s razor', 10],
    'sunk-cost-fallacy': ['Sunk cost fallacy', 11], 'margin-of-safety': ['Margin of safety', 12], 'incentives': ['Incentives', 13],
    'compounding': ['Compounding', 15], 'feedback-loops': ['Feedback loops', 16], 'leverage': ['Leverage', 17],
    'bottlenecks': ['Bottlenecks', 18], 'regret-minimization': ['Regret minimization', 19], 'latticework': ['The latticework', 20],
  };
  const title = id => M[id][0];
  const link = id => `<a href="#${id}">Day ${M[id][1]}: ${title(id)}</a>`;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- the quiz scene, shared by all three days ----------
  // questions: [{ q, a: answer id, why, opts?: [ids] }]; fixedOpts: the same choices for every question (weekly reviews)
  function quiz(questions, fixedOpts) {
    return function mount(ctx) {
      const { THREE } = ctx, K = ctx.kit(), S = ctx.scene;
      // 3 columns on a wide stage, 2 on a narrow (phone) one so labels don't collide
      const narrow = ctx.host.clientWidth / Math.max(ctx.host.clientHeight, 1) < 1.4;
      const maxN = fixedOpts ? fixedOpts.length : 4, cols = maxN <= 4 || narrow ? 2 : 3, rows = Math.ceil(maxN / cols);
      const DX = 2.7, DZ = 2.3, BASE = 1.1;
      const IDLE = 0.6, UP = 2.3, DOWN = 0.18, DIM = 0.42;

      const floorW = cols * DX + 0.6, floorD = rows * DZ + 0.6;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(floorW, 0.08, floorD), K.std('line'));
      floor.position.y = -0.04; S.add(floor);

      const geo = new THREE.BoxGeometry(BASE, 1, BASE);
      const pillars = [];
      for (let i = 0; i < maxN; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        const m = new THREE.Mesh(geo, K.std('accent'));
        m.position.set((c - (cols - 1) / 2) * DX, 0, (r - (rows - 1) / 2) * DZ);
        m.userData.i = i; S.add(m);
        const t = K.tag('', K.V(m.position.x, 0, m.position.z));
        pillars.push({ m, t, h: 0.01, th: IDLE, id: null });
      }

      // progress: one small cube per question, floating behind the pillars
      const N = questions.length, PS = 0.42;
      const dots = questions.map((_, i) => {
        const d = new THREE.Mesh(new THREE.BoxGeometry(PS * 0.8, PS * 0.8, PS * 0.8), K.std('neutral'));
        d.position.set((i - (N - 1) / 2) * PS * 1.25, 3.4, -floorD / 2 + 0.2);
        S.add(d); return d;
      });
      const cur = new THREE.Mesh(new THREE.BoxGeometry(PS * 0.8, 0.06, PS * 0.8), K.std('fg'));
      S.add(cur);
      // a fairly steep view, so a risen front pillar doesn't hide the row behind it
      ctx.fit(Math.max(floorW, N * PS * 1.25) + 0.6, floorD * 0.75 + 3.6, K.V(0, 1.4, 0), K.V(0, 1.05, 1));

      // controls: scenario, choice buttons, feedback, next
      const qEl = K.el('p', 'review-q'); qEl.setAttribute('aria-live', 'polite');
      const choices = K.el('div', 'review-choices'); choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Which model?');
      const fb = K.el('p', 'readout'); fb.setAttribute('aria-live', 'polite');
      const next = K.el('button', 'btn'); next.type = 'button';
      [qEl, choices, fb, next].forEach(e => ctx.controls.appendChild(e));

      let order, qi, picked, results, opts, btns;
      function start() {
        order = shuffle(questions); qi = 0; results = [];
        dots.forEach(d => K.setKey(d.material, 'neutral'));
        ask();
      }
      function ask() {
        const Q = order[qi]; picked = null;
        opts = fixedOpts || shuffle(Q.opts.concat(Q.a));
        qEl.innerHTML = `<span class="eyebrow">Question ${qi + 1} of ${N}</span>${Q.q}`;
        choices.innerHTML = '';
        btns = opts.map((id, i) => {
          const b = K.el('button', 'chip'); b.type = 'button'; b.textContent = title(id);
          b.addEventListener('click', () => answer(i)); choices.appendChild(b); return b;
        });
        pillars.forEach((p, i) => {
          const id = opts[i];
          p.id = id || null; p.m.visible = !!id; p.t.show(!!id); p.th = IDLE;
          if (id) { p.t.set(title(id)); K.setKey(p.m.material, 'accent'); }
        });
        fb.textContent = 'Pick the model that best explains it.';
        next.hidden = true;
        cur.position.set(dots[qi].position.x, dots[qi].position.y - PS * 0.62, dots[qi].position.z);
        cur.visible = true;
      }
      function answer(i) {
        if (picked != null || qi >= N) return;
        picked = i;
        const Q = order[qi], ok = opts[i] === Q.a;
        results.push({ Q, ok });
        K.setKey(dots[qi].material, ok ? 'good' : 'bad');
        pillars.forEach((p, j) => {
          if (!p.id) return;
          if (p.id === Q.a) { p.th = UP; K.setKey(p.m.material, 'good'); }
          else if (j === i) { p.th = DOWN; K.setKey(p.m.material, 'bad'); }
          else { p.th = DIM; K.setKey(p.m.material, 'neutral'); }
        });
        btns.forEach((b, j) => { b.disabled = true; b.setAttribute('aria-pressed', String(j === i)); });
        fb.innerHTML = (ok ? '<strong>Right.</strong> ' : `<strong>Not quite.</strong> It’s ${title(Q.a)}. `) + `${Q.why} Revisit ${link(Q.a)}.`;
        next.textContent = qi + 1 < N ? 'Next question' : 'See your score';
        next.hidden = false; next.focus({ preventScroll: true });
      }
      function finish() {
        qi = N; cur.visible = false;
        const score = results.filter(r => r.ok).length;
        const missed = [...new Set(results.filter(r => !r.ok).map(r => r.Q.a))];
        qEl.innerHTML = `<span class="eyebrow">Done</span>You got <strong>${score} of ${N}</strong>.`;
        choices.innerHTML = '';
        pillars.forEach(p => { if (p.id) { p.th = missed.includes(p.id) ? DOWN : IDLE; K.setKey(p.m.material, missed.includes(p.id) ? 'bad' : 'accent'); } });
        fb.innerHTML = missed.length
          ? `Worth another look: ${missed.map(link).join(', ')}.`
          : 'A clean sweep. Try it again later: the scenarios come back in a new order.';
        next.textContent = 'Try again'; next.hidden = false;
      }
      next.addEventListener('click', () => {
        if (qi >= N) return start();
        qi++; qi < N ? ask() : finish();
      });

      // click a pillar to answer
      const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), cv = ctx.renderer.domElement;
      const hit = e => {
        const r = cv.getBoundingClientRect();
        ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ptr, ctx.camera);
        const h = ray.intersectObjects(pillars.filter(p => p.id).map(p => p.m))[0];
        return h ? h.object.userData.i : null;
      };
      const onClick = e => { const i = hit(e); if (i != null) answer(i); };
      const onMove = e => { cv.style.cursor = picked == null && qi < N && hit(e) != null ? 'pointer' : ''; };
      cv.addEventListener('click', onClick); cv.addEventListener('pointermove', onMove);

      ctx.onFrame((dt, t) => {
        const k = K.f(dt, 7);
        pillars.forEach(p => {
          p.h += (p.th - p.h) * k;
          p.m.scale.y = Math.max(p.h, 0.01); p.m.position.y = p.h / 2;
          p.t.pos.y = p.h + 0.5;
        });
        if (!ctx.reduce && cur.visible) cur.position.y = dots[Math.min(qi, N - 1)].position.y - PS * 0.62 - Math.abs(Math.sin(t * 3)) * 0.06;
      });

      start();
      return { dispose() { cv.removeEventListener('click', onClick); cv.removeEventListener('pointermove', onMove); cv.style.cursor = ''; } };
    };
  }

  const tryIt = `<div class="try"><h3>Try it</h3><p>Look back at a decision you made this week. Which of these models would have changed it, and how?</p></div>`;
  const oneLiners = ids => `<div class="points">${ids.map(([id, s]) => `<div><h3>${link(id)}</h3><p>${s}</p></div>`).join('')}</div>`;

  // ============================================================
  // Day 7 · Week 1 review
  // ============================================================
  const W1 = ['first-principles', 'inversion', 'second-order-thinking', 'opportunity-cost', 'circle-of-competence', 'map-territory'];
  MM.register({
    id: 'week-1-review', day: 7, week: 1,
    title: 'Week 1 review',
    tagline: 'Six models in, the hard part is recognising which one a situation calls for. Practise on six short scenarios.',
    prompt: 'Read the scenario, then pick the model that explains it: click a pillar or a button. The right one rises; a wrong pick sinks.',
    body: `
<section>
  <h2>Why review</h2>
  <p>Knowing what a model says is the easy part. The useful skill is spotting it in the wild, where nothing comes labelled. Each scenario here is an everyday situation with one model at its centre. Some could arguably fit two; pick the one that does the most work, then read why.</p>
</section>
<section>
  <h2>The six, in one line each</h2>
  ${oneLiners([
    ['first-principles', 'Break the problem into what is actually true, then rebuild.'],
    ['inversion', 'Ask what would guarantee failure, then avoid it.'],
    ['second-order-thinking', 'Ask “and then what?” past the first effect.'],
    ['opportunity-cost', 'Every yes costs the best thing you said no to.'],
    ['circle-of-competence', 'Know where your knowledge ends, and act differently past it.'],
    ['map-territory', 'Models, numbers and plans are simplifications of reality, not reality.'],
  ])}
  ${tryIt}
</section>`,
    mount: quiz([
      { a: 'first-principles', q: 'A battery pack is quoted at a price nobody questions. You list the raw materials it contains, price them on the commodity market, and find they cost a fraction of the quote.', why: 'You stopped reasoning from what packs usually cost and rebuilt the price from its basic parts.' },
      { a: 'inversion', q: 'Before a product launch, the team spends an hour listing every way the launch could go badly wrong, then removes each cause one by one.', why: 'Instead of asking how to succeed, they asked how to fail and avoided that.' },
      { a: 'second-order-thinking', q: 'A new motorway lane cuts journey times, so more people choose to drive. Within a few years the traffic is as slow as before.', why: 'The first effect (faster journeys) caused a second one (more drivers) that undid it.' },
      { a: 'opportunity-cost', q: 'You’re offered £300 for a Saturday of freelance work, and turn it down because that Saturday spent finishing your course is worth more to you.', why: 'The real price of the gig was the best alternative use of the same day.' },
      { a: 'circle-of-competence', q: 'A surgeon who has done well investing in medical companies loses heavily on cryptocurrency, sure the same instincts would carry over.', why: 'The edge was real inside medicine and absent outside it.' },
      { a: 'map-territory', q: 'The dashboard shows 95% customer satisfaction, but mostly happy customers fill in the survey. Complaints keep rising.', why: 'The number is a map of the customers who answered, not of all customers.' },
    ], W1),
  });

  // ============================================================
  // Day 14 · Week 2 review
  // ============================================================
  const W2 = ['probabilistic-thinking', 'occams-razor', 'hanlons-razor', 'sunk-cost-fallacy', 'margin-of-safety', 'incentives'];
  MM.register({
    id: 'week-2-review', day: 14, week: 2,
    title: 'Week 2 review',
    tagline: 'Week 2 was about deciding well under uncertainty. Six scenarios: name the model at the heart of each.',
    prompt: 'Read the scenario, then pick the model that explains it: click a pillar or a button. The right one rises; a wrong pick sinks.',
    body: `
<section>
  <h2>Why review</h2>
  <p>This week’s models are easy to agree with and easy to forget in the moment: when you’re annoyed, invested, or sure. Recognising them in a scenario is practice for catching them in yourself.</p>
</section>
<section>
  <h2>The six, in one line each</h2>
  ${oneLiners([
    ['probabilistic-thinking', 'Think in odds and payoffs, not yes or no.'],
    ['occams-razor', 'Prefer the explanation that needs the fewest assumptions.'],
    ['hanlons-razor', 'Don’t assume malice when mistakes or neglect explain it.'],
    ['sunk-cost-fallacy', 'What you’ve already spent shouldn’t decide what you spend next.'],
    ['margin-of-safety', 'Build in a buffer for the errors you can’t foresee.'],
    ['incentives', 'People respond to what they’re rewarded for, not what you intended.'],
  ])}
  ${tryIt}
</section>`,
    mount: quiz([
      { a: 'probabilistic-thinking', q: 'The forecast says a 30% chance of rain. You take an umbrella anyway, because getting soaked before an interview costs far more than carrying it.', why: 'You weighed the odds against what each outcome would cost you.' },
      { a: 'occams-razor', q: 'Your laptop won’t turn on. Before suspecting a motherboard fault, you check whether the charger is plugged in.', why: 'The simplest explanation that fits the facts is the one to test first.' },
      { a: 'hanlons-razor', q: 'A colleague leaves you off an important email thread. Rather than assume a snub, you guess they picked recipients in a hurry.', why: 'Carelessness explains it without assuming bad intent.' },
      { a: 'sunk-cost-fallacy', q: 'An hour into a dull film, you keep watching because you already paid for the ticket.', why: 'The ticket money is gone whether you stay or leave; only the next hour is still yours to spend.' },
      { a: 'margin-of-safety', q: 'An engineer designs a footbridge expected to carry 10 tonnes so that it can hold 30.', why: 'The extra capacity covers mistakes in the estimate and loads nobody predicted.' },
      { a: 'incentives', q: 'Sales staff paid per contract signed start closing lots of small deals that customers cancel a month later.', why: 'They did exactly what the bonus rewarded, which wasn’t what the company wanted.' },
    ], W2),
  });

  // ============================================================
  // Day 21 · Final review
  // ============================================================
  MM.register({
    id: 'final-review', day: 21, week: 3,
    title: 'Final review',
    tagline: 'Three weeks, eighteen models. Ten scenarios from across all of them, each with four plausible answers.',
    prompt: 'Each scenario offers four models that could seem to fit. Pick the one doing the most work: click a pillar or a button.',
    body: `
<section>
  <h2>Why these are harder</h2>
  <p>The weekly reviews offered six models from one week. Here every scenario comes with three close calls, often from a different week: Occam’s razor next to Hanlon’s razor, feedback loops next to compounding, sunk cost next to opportunity cost. Telling neighbours apart is what makes a model usable.</p>
</section>
<section>
  <h2>Where a quiz breaks down</h2>
  <p>Real situations rarely have one right model. A quiz rewards recognition; real decisions need several models at once, which is the point of ${link('latticework')}. Use your score to find the models worth revisiting, not as a grade.</p>
  <div class="try"><h3>Try it</h3><p>Pick the model you got wrong, or the one you’d forgotten. Spend five minutes on its day again, then find one place it applies in your own week.</p></div>
</section>`,
    mount: quiz([
      { a: 'sunk-cost-fallacy', opts: ['opportunity-cost', 'margin-of-safety', 'compounding'], q: 'After £40k on a renovation that isn’t working, you ask: “If I hadn’t spent anything yet, would I put £20k into this today?”', why: 'The question deliberately sets aside the money already spent, which is the sunk-cost trap.' },
      { a: 'occams-razor', opts: ['hanlons-razor', 'first-principles', 'bottlenecks'], q: 'Crashes spike after an update. Theory A: a rare timing clash between one new library and three old ones. Theory B: a typo in the new config file. You check B first.', why: 'B needs far fewer assumptions to explain the same evidence. Nobody’s intent is in question, so it isn’t Hanlon’s razor.' },
      { a: 'bottlenecks', opts: ['leverage', 'second-order-thinking', 'incentives'], q: 'Doubling the number of developers made releases slower, because every change still needs sign-off from the one architect.', why: 'Output is capped by the slowest step, so adding capacity anywhere else only lengthens the queue.' },
      { a: 'feedback-loops', opts: ['compounding', 'margin-of-safety', 'second-order-thinking'], q: 'As the room warms, the thermostat cuts the heating. As it cools, the heating comes back on.', why: 'This is a balancing loop: the output feeds back to steady the system. Compounding only ever grows.' },
      { a: 'margin-of-safety', opts: ['opportunity-cost', 'regret-minimization', 'inversion'], q: 'Before going freelance, you save a year of living costs in case clients pay late or work dries up.', why: 'The buffer is there to absorb what you can’t predict.' },
      { a: 'incentives', opts: ['hanlons-razor', 'feedback-loops', 'circle-of-competence'], q: 'A new manager rewards bugs fixed per week. Soon engineers are filing and fixing lots of trivial bugs.', why: 'The reward changed the behaviour, and not in the way it was meant to.' },
      { a: 'probabilistic-thinking', opts: ['first-principles', 'occams-razor', 'sunk-cost-fallacy'], q: 'A friend says a stock is “definitely” going up. You put it at maybe 60%, note you could lose half your stake, and decide how much to bet from there.', why: 'You swapped “definitely” for odds and sized the bet by the payoff.' },
      { a: 'map-territory', opts: ['circle-of-competence', 'incentives', 'leverage'], q: 'The org chart says Priya approves budgets. In practice, everyone asks Sam first.', why: 'The chart is a map of how things are meant to work; the territory is what people actually do.' },
      { a: 'inversion', opts: ['first-principles', 'regret-minimization', 'second-order-thinking'], q: 'Instead of asking how to keep customers happy, you list what would guarantee they leave, and fix those first.', why: 'Working backwards from failure surfaces risks that a list of goals misses.' },
      { a: 'circle-of-competence', opts: ['hanlons-razor', 'incentives', 'map-territory'], q: 'A respected economist gives confident advice on vaccine safety, and you weigh it the way you’d weigh a stranger’s.', why: 'Expertise is real inside its circle and doesn’t transfer outside it.' },
    ]),
  });
})();
