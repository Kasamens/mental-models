# Mental Models

**A 3-week plan, one mental model a day, each taught through a small interactive 3D world.**
Live: **[kasamens.github.io/mental-models](https://kasamens.github.io/mental-models/)**

Reading about a mental model is easy; using one is harder. Each day here gives you a scene to poke at. For example, you take a $600/kWh battery pack apart into its raw materials, then rebuild it to see what it should really cost (first principles).

## The plan

| Week | Theme | Models |
|---|---|---|
| 1 | The core six | First principles, inversion, second-order thinking, opportunity cost, circle of competence, the map is not the territory |
| 2 | Better decisions | Probabilistic thinking, Occam's razor, Hanlon's razor, sunk cost fallacy, margin of safety, incentives |
| 3 | How things grow and connect | Compounding, feedback loops, leverage, bottlenecks, regret minimization, the latticework |

Each week ends with a **review day**: a quiz where you identify which model fits a situation.

## How it's built

- **Plain HTML, CSS and JavaScript:** no framework and no build step, hosted on GitHub Pages.
- **Three.js**, loaded from a CDN. If the library fails to load, the page shows a clear message instead of a blank stage.
- **Scene registry:** each day is one `MM.register({ id, day, week, title, tagline, prompt, body, mount(ctx) })` call in `scenes/week*.js`. The shared engine in `app.js` handles routing, rendering, camera framing, overlay labels, controls and theme-aware materials. It also cleans everything up when you switch days.
- **Light, dark and auto themes**, and the site respects `prefers-reduced-motion`.

```
index.html        shell and navigation
app.js            scene registry + shared Three.js engine
scenes/           week1.js, week2.js, week3.js, reviews.js
```

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Built with

Designed and built with [Claude Code](https://claude.com/claude-code), using AI-assisted development for the engine and scenes, with the content and interactions reviewed by hand.
