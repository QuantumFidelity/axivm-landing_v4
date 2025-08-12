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

// Add shadow + bevel clones for each trace
(() => {
  const svg = document.querySelector('.mb-svg'); if(!svg) return;
  const traces = Array.from(svg.querySelectorAll('.trace'));
  traces.forEach(p => {
    // Shadow clone (under)
    const shadow = p.cloneNode();
    shadow.removeAttribute('id');
    shadow.setAttribute('stroke', 'black');
    shadow.setAttribute('stroke-opacity', '0.22');
    shadow.setAttribute('stroke-width', String((parseFloat(p.getAttribute('stroke-width')||'3')) + 1.5));
    shadow.setAttribute('filter', 'url(#trace-ao)');
    p.parentNode.insertBefore(shadow, p);

    // Bevel highlight (over)
    const bevel = p.cloneNode();
    bevel.removeAttribute('id');
    bevel.setAttribute('stroke', 'url(#trace-bevel)');
    bevel.setAttribute('stroke-width', '1');
    bevel.setAttribute('opacity', '0.25');
    p.parentNode.insertBefore(bevel, p.nextSibling);
  });
})();

// Reduced motion?
const AX_RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Magnetic button hover */
(() => {
  if (AX_RM) return;
  const btn = document.querySelector('.btn.primary.magnet');
  if(!btn) return;
  const strength = 10; // px
  let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;

  function onMove(e){
    const r = btn.getBoundingClientRect();
    cx = ((e.clientX - r.left) / r.width - 0.5) * strength;
    cy = ((e.clientY - r.top) / r.height - 0.5) * strength;
    if(!raf) raf = requestAnimationFrame(apply);
  }
  function onLeave(){
    cx = cy = 0;
    if(!raf) raf = requestAnimationFrame(apply);
  }
  function apply(){
    raf = null;
    tx += (cx - tx) * 0.18;
    ty += (cy - ty) * 0.18;
    btn.style.transform = `translate(${tx}px, ${ty}px)`;
  }
  btn.addEventListener('mousemove', onMove, {passive:true});
  btn.addEventListener('mouseleave', onLeave);
})();

/* Trace glints: quick spark that rides a short segment of a random trace */
(() => {
  if (AX_RM) return;
  const svg = document.querySelector('.mb-svg'); if(!svg) return;
  const traces = Array.from(svg.querySelectorAll('.trace'));
  const NS = 'http://www.w3.org/2000/svg';

  function spawnGlint(){
    if (!traces.length) return;
    const path = traces[Math.floor(Math.random()*traces.length)];
    const len  = path.getTotalLength();
    const start = Math.random() * (len * 0.8);
    const dur = 450 + Math.random()*300;

    const g = document.createElementNS(NS,'g');
    g.setAttribute('opacity','0');
    const flare = document.createElementNS(NS,'circle');
    flare.setAttribute('r','2.8');
    flare.setAttribute('fill', getComputedStyle(path).stroke || '#19ffd1');
    const halo = document.createElementNS(NS,'circle');
    halo.setAttribute('r','6');
    halo.setAttribute('fill', 'white');
    halo.setAttribute('opacity','.25');
    g.appendChild(halo); g.appendChild(flare);
    svg.appendChild(g);

    let t0 = null;
    function step(ts){
      if(!t0) t0 = ts;
      const p = (ts - t0) / dur;
      if (p >= 1){ svg.removeChild(g); return; }
      const d = start + p * (len * 0.12);
      const pt = path.getPointAtLength(Math.min(len, d));
      g.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
      g.setAttribute('opacity', String(p < 0.1 ? p*10 : 1 - (p-0.1)));
      halo.setAttribute('r', String(6 + p*4));
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // one glint every ~700–1200ms
  setInterval(spawnGlint, 700 + Math.random()*500);
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

/* ===== Data Ribbons Canvas ===== */
(function(){
  const canvas = document.getElementById('ribbons');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    const {clientWidth:w, clientHeight:h} = canvas;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  // Enhanced ribbons: rich, wide, and dynamic
  const COLORS = ['#19ffd1','#ff2e63','#00c2ff','#8a7dff','#ff6b35','#00d98b'];
  const ribbons = COLORS.map((c,i) => ({
    hue: c,
    amp: 25 + i*8,
    speed: 0.8 + i*0.15,
    width: 6.0 + (i%3)*2.5,
    offset: Math.random()*2000,
    phase: Math.random() * Math.PI * 2,
    amplitude: 0.8 + Math.random() * 0.4,
  }));

  function pathAt(t, idx){
    // Enhanced path generation for top-of-hero positioning
    const W = canvas.clientWidth, H = canvas.clientHeight;
    
    // Position ribbons at the top of the hero area
    const ribbonHeight = H * 0.4; // Top 40% of screen
    const y0 = ribbonHeight * 0.3 + Math.sin(t * 0.3 + ribbons[idx].phase) * ribbons[idx].amplitude * 20;
    const y3 = ribbonHeight * 0.7 + Math.sin(t * 0.4 + ribbons[idx].phase + 1) * ribbons[idx].amplitude * 15;
    
    // Wider horizontal spread
    const x0 = -0.2*W + Math.sin(t * 0.2 + idx) * 30;
    const x3 =  1.2*W + Math.sin(t * 0.25 + idx + 2) * 25;
    
    // Dynamic control points with more organic movement
    const p = (u, seed) => Math.sin(u*0.8 + seed)*1.5 + Math.sin(u*0.23 + seed*1.7)*0.8 + Math.sin(u*0.12 + seed*0.5)*0.4;
    const n1 = p(t, 1.3+idx), n2 = p(t, 2.7+idx);
    
    const x1 = W*0.2 + n1*40, y1 = ribbonHeight * 0.4 + n1*35;
    const x2 = W*0.8 + n2*35, y2 = ribbonHeight * 0.6 + n2*30;
    
    return { x0,y0,x1,y1,x2,y2,x3,y3 };
  }

  let raf=null, lastTs=0;
  
  // Particle system
  const particles = [];
  for(let i = 0; i < 15; i++) {
    particles.push({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight * 0.4,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 4 + 1.5,
      color: ['#19ffd1','#ff2e63','#00c2ff','#8a7dff','#ff6b35','#00d98b'][Math.floor(Math.random() * 6)],
      opacity: Math.random() * 0.4 + 0.15,
      phase: Math.random() * Math.PI * 2,
      pulse: Math.random() * 0.1 + 0.05
    });
  }
  
  function updateParticles(dt) {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.phase += p.pulse;
      
      // Bounce off edges with some randomness
      if(p.x < 0 || p.x > canvas.clientWidth) {
        p.vx *= -1;
        p.vx += (Math.random() - 0.5) * 0.2;
      }
      if(p.y < 0 || p.y > canvas.clientHeight * 0.4) {
        p.vy *= -1;
        p.vy += (Math.random() - 0.5) * 0.2;
      }
      
      // Keep in bounds
      p.x = Math.max(0, Math.min(canvas.clientWidth, p.x));
      p.y = Math.max(0, Math.min(canvas.clientHeight * 0.4, p.y));
    });
  }
  
  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      const pulseOpacity = p.opacity + Math.sin(p.phase) * 0.15;
      ctx.globalAlpha = pulseOpacity;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
  
  function tick(ts){
    if(prefersReduced){ // static gradient fallback
      ctx.clearRect(0,0,canvas.clientWidth, canvas.clientHeight);
      const g = ctx.createLinearGradient(0,0,canvas.clientWidth,0);
      g.addColorStop(0, 'rgba(25,255,209,.25)');
      g.addColorStop(0.5, 'rgba(255,46,99,.25)');
      g.addColorStop(1, 'rgba(0,217,139,.25)');
      ctx.fillStyle = g; ctx.fillRect(0,0,canvas.clientWidth, canvas.clientHeight * 0.4);
      return;
    }
    if(!lastTs) lastTs = ts;
    const dt = Math.min(33, ts - lastTs)/1000; lastTs = ts;

    ctx.clearRect(0,0,canvas.clientWidth, canvas.clientHeight);
    ctx.globalCompositeOperation = 'lighter';

    ribbons.forEach((r, idx) => {
      r.offset += dt * r.speed;
      const {x0,y0,x1,y1,x2,y2,x3,y3} = pathAt(r.offset, idx);

      // Enhanced rendering with multiple layers for richness
      for(let k=0;k<5;k++){
        ctx.beginPath();
        ctx.moveTo(x0, y0 + Math.sin(r.offset*2 + k)*2.5);
        ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
        ctx.strokeStyle = r.hue;
        ctx.lineWidth = r.width - k*1.2;
        ctx.globalAlpha = 0.15 - k*0.025;
        ctx.stroke();
      }
      
      // Add subtle glow effect
      ctx.shadowColor = r.hue;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      ctx.strokeStyle = r.hue;
      ctx.lineWidth = r.width * 0.3;
      ctx.globalAlpha = 0.08;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Update and draw particles
    updateParticles(dt);
    drawParticles();

    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(tick);
  }
  if(!prefersReduced){
    const vis = () => document.hidden ? cancelAnimationFrame(raf) : (raf=requestAnimationFrame(tick));
    document.addEventListener('visibilitychange', vis);
    raf = requestAnimationFrame(tick);
  }else{
    tick(0);
  }
})();


