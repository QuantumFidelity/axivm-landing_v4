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

// Respect user motion preference
const AX_PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* === Parallax tilt for isometric SVG === */
(() => {
  const svg = document.querySelector('.mb-svg.iso');
  if (!svg || AX_PREFERS_REDUCED) return;

  let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;

  function onMove(e){
    const r = svg.getBoundingClientRect();
    cx = (e.clientX - r.left) / r.width - 0.5;
    cy = (e.clientY - r.top) / r.height - 0.5;
    if (!raf) raf = requestAnimationFrame(apply);
  }
  function apply(){
    raf = null;
    tx += (cx - tx) * 0.08;
    ty += (cy - ty) * 0.08;
    svg.style.transform =
      `perspective(1400px) rotateX(${55 + (-ty*4)}deg) rotateZ(${-45 + (tx*4)}deg) scale(1.18)`;
  }
  window.addEventListener('mousemove', onMove, { passive:true });
})();

/* === Packet dots traveling along a few traces === */
(() => {
  const svg = document.querySelector('.mb-svg');
  if (!svg || AX_PREFERS_REDUCED) return;

  const traces = Array.from(svg.querySelectorAll('.trace')).slice(0, 6); // limit for perf
  const NS = 'http://www.w3.org/2000/svg';

  traces.forEach((path) => {
    const len = path.getTotalLength();
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', '2.2');
    dot.setAttribute('fill', getComputedStyle(path).stroke || '#19ffd1');
    dot.setAttribute('opacity', '0.95');
    svg.appendChild(dot);

    let t = Math.random()*len, speed = 45 + Math.random()*55; // px/sec
    let prev = null;
    function step(ts){
      if (prev == null) prev = ts;
      const dt = (ts - prev) / 1000;
      prev = ts;
      t += speed * dt;
      if (t > len) t = 0;
      const p = path.getPointAtLength(t);
      dot.setAttribute('cx', p.x);
      dot.setAttribute('cy', p.y);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
})();

/* === Sticky CTA show/hide after scroll === */
(() => {
  const el = document.getElementById('stickyPilot');
  if (!el) return;
  function onScroll(){
    if (window.scrollY > 600) el.classList.add('show');
    else el.classList.remove('show');
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

/* === CPU Glass Cover + Component Decals === */
(function(){
  const svg = document.querySelector('.mb-svg');
  if(!svg) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- CPU GLASS COVER (over the chip, under icons) ---------- */
  const cpuGroup = svg.querySelector('[data-id="cpu"]');
  const cpuRect  = cpuGroup ? cpuGroup.querySelector('rect') : null; // main chip body
  if(cpuGroup && cpuRect){
    // CPU center from its group translate
    const m = (cpuGroup.getAttribute('transform')||'').match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
    const cx = m ? parseFloat(m[1]) : 0;
    const cy = m ? parseFloat(m[2]) : 0;

    // Glass slightly larger than chip (original chip ~88x56)
    const w = 96, h = 64, r = 14;

    // Create layer and insert above traces, below decals/icons
    let decals = svg.querySelector('#decals');
    if(!decals){ decals = document.createElementNS(NS,'g'); decals.setAttribute('id','decals'); svg.appendChild(decals); }
    const glassLayer = document.createElementNS(NS,'g');
    glassLayer.setAttribute('id','cpuGlass');
    glassLayer.setAttribute('transform', `translate(${cx},${cy})`);

    const sh = document.createElementNS(NS,'rect'); // occlusion shadow
    sh.setAttribute('x', -w/2); sh.setAttribute('y', -h/2+4);
    sh.setAttribute('width', w); sh.setAttribute('height', h);
    sh.setAttribute('rx', r); sh.setAttribute('class','comp-shadow');
    sh.setAttribute('opacity','.35');
    glassLayer.appendChild(sh);

    const glass = document.createElementNS(NS,'rect');
    glass.setAttribute('x', -w/2); glass.setAttribute('y', -h/2);
    glass.setAttribute('width', w); glass.setAttribute('height', h);
    glass.setAttribute('rx', r); glass.setAttribute('class','cpu-glass');
    glassLayer.appendChild(glass);

    const bezel = document.createElementNS(NS,'rect');
    bezel.setAttribute('x', -w/2+6); bezel.setAttribute('y', -h/2+6);
    bezel.setAttribute('width', w-12); bezel.setAttribute('height', h-12);
    bezel.setAttribute('rx', r-6); bezel.setAttribute('class','cpu-glass-bezel');
    glassLayer.appendChild(bezel);

    const glare = document.createElementNS(NS,'rect'); // moving glare
    glare.setAttribute('x', -w); glare.setAttribute('y', -h/2);
    glare.setAttribute('width', w*0.9); glare.setAttribute('height', h);
    glare.setAttribute('transform', 'rotate(-18)');
    glare.setAttribute('class','cpu-glare');
    glassLayer.appendChild(glare);

    // Insert before decals so decals (and icons) sit above glass
    svg.insertBefore(glassLayer, decals);

    if(!reduce){
      let t0=null;
      function tick(ts){
        if(t0==null) t0=ts;
        const tsec = (ts - t0)/1000;
        const x = -w + ((tsec*20) % (w*2.2)); // ~20px/s loop
        glare.setAttribute('x', x);
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  /* ---------- COMPONENT DECALS (realism) ---------- */
  const decals = svg.querySelector('#decals');
  if(!decals) return;

  // Helpers
  function make(tag, attrs){ const el = document.createElementNS(NS, tag); for(const k in attrs) el.setAttribute(k, attrs[k]); return el; }

  // Vias (sprinkle some if '#pads' exists to blend with texture)
  const pads = svg.getElementById('pads');
  if(pads){
    for(let i=0;i<30;i++){
      const x = 80 + i*22 + (i%3)*6;
      const y = 80 + (i%10)*28;
      const c = make('circle',{cx:x, cy:y, r:2.2, class:'via'});
      pads.appendChild(c);
    }
  }

  // Mounting holes (corners)
  [['46','46'], ['754','46'], ['46','514'], ['754','514']]
    .forEach(([x,y]) => decals.appendChild(make('circle',{ cx:x, cy:y, r:8, class:'mount-hole' })));

  // Fiducials (alignment markers)
  decals.appendChild(make('circle',{ cx:120, cy:80,  r:2.2, class:'fiducial' }));
  decals.appendChild(make('circle',{ cx:700, cy:480, r:2.2, class:'fiducial' }));

  // Test pads
  [ [260,150], [300,170], [520,150], [560,170], [260,440], [540,430] ]
    .forEach(([x,y]) => decals.appendChild(make('circle',{ cx:x, cy:y, r:1.8, class:'testpad' })));

  // SMD components (resistors/caps) aligned to traces
  function placeSMDResistor(x,y,angle,label){
    const g = make('g', { transform:`translate(${x},${y}) rotate(${angle})` });
    g.appendChild(make('ellipse', { class:'comp-shadow', cx:'0', cy:'4', rx:'9', ry:'3', opacity:'.35' }));
    g.appendChild(make('rect',{ class:'smd-pad',  x:-14, y:-4, width:6, height:8, rx:1.5 }));
    g.appendChild(make('rect',{ class:'smd-pad',  x:8,  y:-4, width:6, height:8, rx:1.5 }));
    g.appendChild(make('rect',{ class:'smd-body', x:-8,  y:-6, width:16, height:12, rx:2 }));
    [-4.5,-1.5,1.5,4.5].forEach(sx => g.appendChild(make('rect',{ x:sx, y:-6, width:1.6, height:12, fill:'#2b3136', opacity:.65 })));
    if(label){ const t=make('text',{ class:'silk', x:'0', y:'-10', 'text-anchor':'middle' }); t.textContent=label; g.appendChild(t); }
    decals.appendChild(g);
  }
  function placeSMDCapacitor(x,y,angle,label){
    const g = make('g', { transform:`translate(${x},${y}) rotate(${angle})` });
    g.appendChild(make('ellipse', { class:'comp-shadow', cx:'0', cy:'4', rx:'8', ry:'3', opacity:'.35' }));
    g.appendChild(make('rect',{ class:'smd-pad', x:-12, y:-4, width:5, height:8, rx:1 }));
    g.appendChild(make('rect',{ class:'smd-pad', x:7,  y:-4, width:5, height:8, rx:1 }));
    g.appendChild(make('rect',{ class:'smd-body', x:-7, y:-6, width:14, height:12, rx:2 }));
    g.appendChild(make('rect',{ x:-1, y:-6, width:2, height:12, fill:'#2b3136', opacity:.7 })); // center mark
    if(label){ const t=make('text',{ class:'silk', x:'0', y:'-10', 'text-anchor':'middle' }); t.textContent=label; g.appendChild(t); }
    decals.appendChild(g);
  }

  const traces = Array.from(svg.querySelectorAll('.trace')).slice(0, 6); // limit for cleanliness
  let rIndex=1, cIndex=1;
  traces.forEach((path, i) => {
    const len = path.getTotalLength();
    [0.28, 0.56].forEach((f, j) => {
      const d = f*len;
      const p1 = path.getPointAtLength(Math.max(0, d-0.1));
      const p2 = path.getPointAtLength(Math.min(len, d+0.1));
      const angle = Math.atan2(p2.y-p1.y, p2.x-p1.x) * 180/Math.PI;

      // normal offset so parts don't sit on top of the trace
      const nx = -(p2.y-p1.y), ny = (p2.x-p1.x);
      const nlen = Math.hypot(nx,ny) || 1;
      const off = 10 + (j*2);
      const x = p1.x + (nx/nlen)*off;
      const y = p1.y + (ny/nlen)*off;

      if((i+j)%2===0){ placeSMDResistor(x,y, angle, `R${rIndex++}`); }
      else            { placeSMDCapacitor(x,y, angle, `C${cIndex++}`); }
    });
  });
})();
