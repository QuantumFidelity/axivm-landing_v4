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

/* Sticky nav elevation + mobile toggle */
(() => {
  const nav = document.querySelector('.topnav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!nav) return;
  const onScroll = () => (window.scrollY > 6) ? nav.classList.add('scrolled') : nav.classList.remove('scrolled');
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  if (toggle && links){
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); });
  }
})();

/* Premium Glossy Data Ribbons v2 (parallax + scroll energy + streaks) */
(function(){
  const canvas = document.getElementById('ribbons');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){ const w=canvas.clientWidth,h=canvas.clientHeight; canvas.width=Math.floor(w*DPR); canvas.height=Math.floor(h*DPR); ctx.setTransform(DPR,0,0,DPR,0,0); }
  new ResizeObserver(resize).observe(canvas); resize();

  let px=0, py=0, tx=0, ty=0;
  window.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    px=((e.clientX-r.left)/r.width - .5)*20; py=((e.clientY-r.top)/r.height - .5)*14;
  }, {passive:true});

  let energy=0; const how=document.querySelector('#how');
  function updateEnergy(){
    if(!how) return;
    const h=how.getBoundingClientRect(), vh=innerHeight;
    energy = 1 - Math.min(1, Math.max(0, (h.top - vh*.2) / (vh*.8)));
  }
  addEventListener('scroll', updateEnergy, {passive:true}); updateEnergy();

  const RIBBONS = [
    { hue:'#19ffd1', baseW:22, baseS:0.25, phase:Math.random()*1000, streaks:[] },
    { hue:'#ff2e63', baseW:20, baseS:0.22, phase:Math.random()*1000, streaks:[] },
    { hue:'#00c2ff', baseW:18, baseS:0.28, phase:Math.random()*1000, streaks:[] },
  ];

  const shine = w => { const g=ctx.createLinearGradient(0,-w/2,0,w/2); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.18,'rgba(255,255,255,.25)'); g.addColorStop(.5,'rgba(255,255,255,.65)'); g.addColorStop(.82,'rgba(255,255,255,.25)'); g.addColorStop(1,'rgba(255,255,255,0)'); return g; };
  const pathAt = (t,idx) => {
    const W=canvas.clientWidth,H=canvas.clientHeight, ox=tx*(.15+idx*.05), oy=ty*(.10+idx*.04);
    const x0=-.2*W+ox, y0=.55*H+oy, x3=1.2*W+ox, y3=.25*H+oy;
    const n=(u,s)=>Math.sin(u*.6+s)*1+Math.sin(u*.18+s*1.3)*.5;
    const x1=.25*W+ox, y1=.65*H+n(t,1.3+idx)*28+oy, x2=.65*W+ox, y2=.35*H+n(t,2.9+idx)*28+oy;
    return {x0,y0,x1,y1,x2,y2,x3,y3};
  };

  function spawnStreak(r){ r.streaks.push({ p: Math.random()*0.6, life:0 }); if(r.streaks.length>4) r.streaks.shift(); }
  if(!RM) setInterval(()=>RIBBONS.forEach(spawnStreak), 900);


  let raf=null, t0=0;
  function tick(ts){
    if(!t0) t0=ts;
    const dt=Math.min(32,ts-t0)/1000; t0=ts;
    tx += (px-tx)*.08; ty += (py-ty)*.08;
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);

    if(RM){
      const g=ctx.createLinearGradient(0,0,canvas.clientWidth,0);
      g.addColorStop(0,'rgba(25,255,209,.18)'); g.addColorStop(1,'rgba(255,46,99,.18)');
      ctx.fillStyle=g; ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight); return;
    }

    RIBBONS.forEach((r,i)=>{
      const speed=r.baseS*(1+energy*.4), width=r.baseW*(1+energy*.25);
      r.phase += dt*speed; const P=pathAt(r.phase,i);

      ctx.globalCompositeOperation='lighter';
      [1,.6,.35].forEach((a,k)=>{ ctx.beginPath(); ctx.moveTo(P.x0,P.y0); ctx.bezierCurveTo(P.x1,P.y1,P.x2,P.y2,P.x3,P.y3); ctx.strokeStyle=r.hue; ctx.lineWidth=width+k*6; ctx.globalAlpha=.08*a; ctx.stroke(); });

      ctx.save(); ctx.globalCompositeOperation='screen';
      ctx.strokeStyle=shine(width); ctx.lineWidth=width;
      ctx.beginPath(); ctx.moveTo(P.x0,P.y0); ctx.bezierCurveTo(P.x1,P.y1,P.x2,P.y2,P.x3,P.y3); ctx.stroke(); ctx.restore();

      ctx.globalCompositeOperation='lighter';
      ctx.beginPath(); ctx.moveTo(P.x0,P.y0); ctx.bezierCurveTo(P.x1,P.y1,P.x2,P.y2,P.x3,P.y3);
      ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=1.4; ctx.stroke();

      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(const s of r.streaks){
        s.p += dt*(.18+energy*.22); s.life += dt; if(s.p>=1){ s.p=0; s.life=0; }
        const t=s.p, x=(1-t)**3*P.x0 + 3*(1-t)**2*t*P.x1 + 3*(1-t)*t**2*P.x2 + t**3*P.x3;
        const y=(1-t)**3*P.y0 + 3*(1-t)**2*t*P.y1 + 3*(1-t)*t**2*P.y2 + t**3*P.y3;
        const r0=2+Math.sin(s.life*6)*.6; const g=ctx.createRadialGradient(x,y,0,x,y,r0*8);
        g.addColorStop(0,'rgba(255,255,255,.22)'); g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r0*8,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });

    raf=requestAnimationFrame(tick);
  }

  const vis=()=>document.hidden? cancelAnimationFrame(raf): (raf=requestAnimationFrame(tick));
  document.addEventListener('visibilitychange',vis);
  raf=requestAnimationFrame(tick);
})();

/* Magnetic CTAs (hero + nav) */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(RM) return;
  const btns=document.querySelectorAll('.btn.primary.magnet, .topnav .btn.primary.sm');
  btns.forEach(btn=>{
    const strength=10; let raf=null,tx=0,ty=0,cx=0,cy=0;
    function onMove(e){ const r=btn.getBoundingClientRect(); cx=((e.clientX-r.left)/r.width-.5)*strength; cy=((e.clientY-r.top)/r.height-.5)*strength; if(!raf) raf=requestAnimationFrame(apply); }
    function onLeave(){ cx=cy=0; if(!raf) raf=requestAnimationFrame(apply); }
    function apply(){ raf=null; tx+=(cx-tx)*.18; ty+=(cy-ty)*.18; btn.style.transform=`translate(${tx}px,${ty}px)`; }
    btn.addEventListener('mousemove',onMove,{passive:true}); btn.addEventListener('mouseleave',onLeave);
  });
})();


