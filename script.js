/**
 * AXIVM — Premium AI Agent Network Background
 * MVP version with scroll-triggered transformation and performance optimizations
 */

(function () {
  const svg = document.querySelector('.mb-svg');
  if (!svg) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Add decorative pads and CPU pins (cheap texture)
  const pads = svg.getElementById('pads');
  if (pads) {
    const W = 800, H = 560;
    for (let i = 0; i < 80; i++) {
      const x = (i * 87) % W;
      const y = (i * 53) % H;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', '1.5');
      c.setAttribute('fill', '#1f2937');
      pads.appendChild(c);
    }
  }

  // CPU pins
  const cpu = svg.querySelector('[data-id="cpu"]');
  if (cpu) {
    const top = cpu.querySelector('.chip-pins-top');
    const bottom = cpu.querySelector('.chip-pins-bottom');
    for (let i = 0; i < 10; i++) {
      const x = -55 + i * 11;
      [top, bottom].forEach((g, idx) => {
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', x);
        r.setAttribute('y', idx === 0 ? -36 : 28);
        r.setAttribute('width', 2);
        r.setAttribute('height', 8);
        r.setAttribute('fill', '#7f1d1d');
        r.setAttribute('opacity', '0.5');
        g.appendChild(r);
      });
    }
  }

  // Map nodes for geometry
  const nodeMap = {};
  svg.querySelectorAll('.chip').forEach(chip => {
    const id = chip.getAttribute('data-id');
    // parse translate(x,y) from transform
    const t = chip.getAttribute('transform') || '';
    const match = t.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
    const x = match ? parseFloat(match[1]) : 0;
    const y = match ? parseFloat(match[2]) : 0;
    nodeMap[id] = { x, y, el: chip };
  });

  // Draw edge geometry (polyline w/ midpoint offset for isometric flavor)
  const traces = Array.from(svg.querySelectorAll('.trace'));
  traces.forEach((path, i) => {
    const from = path.getAttribute('data-from');
    const to = path.getAttribute('data-to');
    const color = path.getAttribute('data-color');
    const a = nodeMap[from], b = nodeMap[to];
    if (!a || !b) return;

    const midX = (a.x + b.x) / 2;
    const midY = ((a.y + b.y) / 2) - 24; // slight "up" for iso bend
    const d = `M ${a.x} ${a.y} L ${midX} ${midY} L ${b.x} ${b.y}`;
    path.setAttribute('d', d);
    if (color) path.style.stroke = color;

    // prepare dash animation
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.classList.add('hidden');
  });

  // Scroll-driven reveal: light up traces in sequence based on hero scroll progress
  const bgWrap = document.querySelector('.bg-wrap');
  const total = traces.length;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function revealByScroll() {
    const rect = bgWrap.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // progress: when hero enters to when spacer ends
    const progress = clamp(1 - (rect.bottom - vh * 0.3) / (rect.height + vh * 0.3), 0, 1);
    const count = Math.floor(progress * total);

    for (let i = 0; i < total; i++) {
      const p = traces[i];
      const L = p.getTotalLength();
      if (i < count) {
        if (prefersReduced) {
          p.style.strokeDashoffset = 0;
          p.classList.remove('hidden');
        } else {
          // animate with easing
          p.style.transition = 'stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)';
          requestAnimationFrame(() => {
            p.style.strokeDashoffset = 0;
            p.classList.remove('hidden');
          });
        }
      } else {
        // reset if user scrolls up
        p.style.transition = 'stroke-dashoffset 300ms ease-out';
        p.style.strokeDashoffset = L;
        p.classList.add('hidden');
      }
    }
  }

  // Hover re-trace: replay edges connected to hovered chip
  function replayEdgesFor(id) {
    traces.forEach(p => {
      const f = p.getAttribute('data-from');
      const t = p.getAttribute('data-to');
      if (f === id || t === id) {
        const L = p.getTotalLength();
        if (prefersReduced) return; // don't animate
        p.style.transition = 'none';
        p.style.strokeDashoffset = L;
        // next frame
        requestAnimationFrame(() => {
          p.style.transition = 'stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)';
          p.style.strokeDashoffset = 0;
        });
      }
    });
  }

  svg.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('mouseenter', () => {
      const id = chip.getAttribute('data-id');
      replayEdgesFor(id);
    });
  });

  // Kick things off
  revealByScroll();
  window.addEventListener('scroll', revealByScroll, { passive: true });
  window.addEventListener('resize', () => {
    // Recompute geometry on resize (viewBox is static but CSS size changes)
    traces.forEach(p => {
      const from = p.getAttribute('data-from');
      const to = p.getAttribute('data-to');
      const a = nodeMap[from], b = nodeMap[to];
      if (!a || !b) return;
      const midX = (a.x + b.x) / 2;
      const midY = ((a.y + b.y) / 2) - 24;
      const d = `M ${a.x} ${a.y} L ${midX} ${midY} L ${b.x} ${b.y}`;
      p.setAttribute('d', d);
      const L = p.getTotalLength();
      p.style.strokeDasharray = L;
      // Keep current reveal state
      const isHidden = p.classList.contains('hidden');
      p.style.strokeDashoffset = isHidden ? L : 0;
    });
  });

})();

// Smooth scroll for in-page anchors (no hash jump)
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function smoothTo(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = href.trim();
      if (target.length > 1) {
        e.preventDefault();
        smoothTo(target);
        history.pushState(null, '', target);
      }
    });
  });

  // Explicit hook for the hero CTA
  const seeHow = document.getElementById('see-how');
  if (seeHow) seeHow.addEventListener('click', () => smoothTo('#how'));
})();
