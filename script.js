/* AXIVM Automations — lightweight interactive background + small UX helpers
   - GPU-friendly canvas of 3D-ish particles with perspective projection
   - Mouse/touch moves the camera subtly
   - Respects prefers-reduced-motion, pauses when tab is hidden
   - No dependencies
*/
(function(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d', { alpha: true });

  let w = 0, h = 0, cx = 0, cy = 0;
  let points = [];
  let animId = null;
  let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hidden = document.visibilityState === 'hidden';

  const COLOR_NEON = '#19b6ff';
  const COLOR_ACCENT = '#ff5e3a';
  const BG_FADE = 'rgba(10,10,10,0.35)';

  let baseCount = 140;
  let spin = 0;
  let targetRX = 0, targetRY = 0;
  let rotX = 0, rotY = 0;

  function resize(){
    const { innerWidth, innerHeight } = window;
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    cx = w * 0.5; cy = h * 0.5;

    const area = innerWidth * innerHeight;
    const density = Math.min(1.0, area / (1400 * 900));
    const count = Math.floor(baseCount * (0.55 + 0.75 * density));
    initPoints(count);
  }

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function initPoints(count){
    points = [];
    for (let i = 0; i < count; i++){
      let x, y, z, d2;
      do {
        x = rand(-1, 1); y = rand(-1, 1); z = rand(-1, 1);
        d2 = x*x + y*y + z*z;
      } while (d2 > 1);
      const isAccent = (i % 23 === 0);
      points.push({ x, y, z, a: isAccent });
    }
  }

  function project(p){
    const sinX = Math.sin(rotX), cosX = Math.cos(rotX);
    const sinY = Math.sin(rotY + spin), cosY = Math.cos(rotY + spin);

    let x = p.x * cosY - p.z * sinY;
    let z = p.x * sinY + p.z * cosY;
    let y = p.y * cosX - z * sinX;
    z = p.y * sinX + z * cosX;

    const depth = 2.2;
    const f = 1 / (depth - z);
    const sx = cx + (x * f) * w * 0.42;
    const sy = cy + (y * f) * h * 0.42;
    const size = Math.max(0.5, 1.6 * f * dpr);
    const alpha = Math.min(1, Math.max(0.15, 0.85 * f));
    return { sx, sy, size, alpha };
  }

  function draw(){
    ctx.fillStyle = BG_FADE;
    ctx.fillRect(0, 0, w, h);

    rotX += (targetRX - rotX) * 0.06;
    rotY += (targetRY - rotY) * 0.06;

    spin += reduceMotion ? 0.0005 : 0.0016;

    for (let i = 0; i < points.length; i++){
      const p = points[i];
      const pr = project(p);
      if (pr.sx < -20 || pr.sx > w + 20 || pr.sy < -20 || pr.sy > h + 20) continue;

      ctx.globalAlpha = pr.alpha;
      ctx.beginPath();
      ctx.arc(pr.sx, pr.sy, pr.size, 0, Math.PI * 2);

      if (p.a){
        ctx.fillStyle = COLOR_ACCENT;
        ctx.shadowColor = COLOR_ACCENT;
        ctx.shadowBlur = 12 * dpr;
      } else {
        ctx.fillStyle = COLOR_NEON;
        ctx.shadowColor = COLOR_NEON;
        ctx.shadowBlur = 14 * dpr;
      }
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function loop(){
    if (!hidden) draw();
    requestAnimationFrame(loop);
  }

  function onPointerMove(e){
    const x = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const y = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    const nx = (x / window.innerWidth) * 2 - 1;
    const ny = (y / window.innerHeight) * 2 - 1;
    const maxTilt = reduceMotion ? 0.05 : 0.22;
    targetRY = nx * maxTilt;
    targetRX = -ny * maxTilt;

    const card = document.getElementById('tiltTarget');
    if (card){
      const degX = ny * (reduceMotion ? 1.5 : 4.5);
      const degY = -nx * (reduceMotion ? 1.5 : 4.5);
      card.style.transform = `perspective(900px) rotateX(${degX}deg) rotateY(${degY}deg)`;
    }
  }

  function onLeave(){
    targetRX = 0; targetRY = 0;
    const card = document.getElementById('tiltTarget');
    if (card) card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }

  document.addEventListener('visibilitychange', () => {
    hidden = document.visibilityState === 'hidden';
  });

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('touchstart', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('mouseleave', onLeave);
  window.addEventListener('touchend', onLeave);

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  loop();
})();
