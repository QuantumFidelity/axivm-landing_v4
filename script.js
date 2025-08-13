/**
 * AXIVM — Premium AI Agent Network Background
 * Cache-busting version: 1.0.1
 */

// Safety check: prevent any canvas-related errors
(function() {
  // Override any potential canvas.getContext calls to prevent errors
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, attributes) {
    try {
      return originalGetContext.call(this, type, attributes);
    } catch (e) {
      console.warn('Canvas context error prevented:', e.message);
      return null;
    }
  };
})();

// (function () {
//   const svg = document.querySelector('.mb-svg');
//   if (!svg) return;
//   // ... rest of the old SVG animation code disabled
// })();

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
// Disabled - SVG element not present in current design
// (() => {
//   const svg = document.querySelector('.mb-svg'); if(!svg) return;
//   // ... rest of the shadow/bevel code disabled
// })();

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
// Disabled - SVG element not present in current design
// (() => {
//   if (AX_RM) return;
//   const svg = document.querySelector('.mb-svg'); if(!svg) return;
//   // ... rest of the glint code disabled
// })();

// Respect user motion preference
const AX_PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* === Parallax tilt for isometric SVG === */
// Disabled - SVG element not present in current design
// (() => {
//   const svg = document.querySelector('.mb-svg.iso');
//   if (!svg || AX_PREFERS_REDUCED) return;
//   // ... rest of the parallax code disabled
// })();

/* === Packet dots traveling along a few traces === */
// Disabled - SVG element not present in current design
// (() => {
//   const svg = document.querySelector('.mb-svg');
//   if (!svg || AX_PREFERS_REDUCED) return;
//   // ... rest of the packet dots code disabled
// })();

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

/* Sticky nav + mobile toggle */
(() => {
  const nav = document.querySelector('.topnav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!nav) return;
  const onScroll = () => (scrollY > 6) ? nav.classList.add('scrolled') : nav.classList.remove('scrolled');
  addEventListener('scroll', onScroll, { passive:true }); onScroll();
  if (toggle && links){
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); });
  }
})();

/* === SINGLE 3D RIBBON ONLY - REMOVED MULTIPLE NEON BEAMS === */
(function(){
  const ribbonContainer = document.getElementById('ribbons');
  if(!ribbonContainer) return;
  
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(RM) return; // Skip animation for reduced motion users
  
  // Clear any existing content - we only want the single 3D ribbon
  ribbonContainer.innerHTML = '';
  
})();



/* === KPI Count-Up - Scroll-triggered animation === */
(() => {
  const band = document.getElementById('kpi-band');
  const hero = document.getElementById('hero');
  if (!band || !hero) return;

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = [...band.querySelectorAll('.count')];

  const fmt = (n, decimals, format) => {
    const fixed = n.toFixed(decimals);
    if (format === 'comma'){
      const [i,d] = fixed.split('.');
      const head = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return d ? head + '.' + d : head;
    }
    return fixed;
  };

  // Initialize counters to 0
  counters.forEach(el => {
    el.textContent = '0';
  });

  // Animate counter function
  const animateCount = (el, start, end, duration = 2000) => {
    if (RM) {
      el.textContent = fmt(end, parseInt(el.dataset.decimals || '0', 10), el.dataset.format || 'plain') + (el.dataset.suffix || '');
      return;
    }
    
    const startTime = performance.now();
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const format = el.dataset.format || 'plain';
    
    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;
      
      el.textContent = fmt(current, decimals, format) + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    requestAnimationFrame(updateCounter);
  };

  // Intersection Observer for scroll-triggered animation (trigger once)
  let hasAnimated = false;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.target !== band) return;

      if (e.isIntersecting && !hasAnimated) {
        // Animate counters when KPI band comes into view (only once)
        hasAnimated = true;
        counters.forEach(el => {
          const end = parseFloat(el.dataset.end || '0');
          animateCount(el, 0, end, 2500);
        });
        
        // Add hero deemphasize effect
        hero.classList.add('deemphasize');
      } else if (e.isIntersecting) {
        // Just add hero deemphasize effect on subsequent scrolls
        hero.classList.add('deemphasize');
      } else {
        hero.classList.remove('deemphasize');
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: "0px 0px -5% 0px"
  });

  io.observe(band);
})();

/* === Subtle Aura Effects === */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM) return;

  const auraSections = document.querySelectorAll('.aura-section');
  if (!auraSections.length) return;

  const auraObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('active');
        }, 2000);
      } else {
        entry.target.classList.remove('active');
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -10% 0px'
  });

  auraSections.forEach(section => {
    auraObserver.observe(section);
  });
})();

/* === Legacy Subtle Glow Effects === */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM) return;

  const glowSections = document.querySelectorAll('.ambient-glow-section');
  if (!glowSections.length) return;

  const glowObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const glow = entry.target.querySelector('.ambient-glow');
      if (!glow) return;

      if (entry.isIntersecting) {
        setTimeout(() => {
          glow.classList.add('active');
        }, 200);
      } else {
        glow.classList.remove('active');
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -10% 0px'
  });

  glowSections.forEach(section => {
    glowObserver.observe(section);
  });
})();

/* === Footer Visibility === */
(() => {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        footer.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -20% 0px'
  });

  footerObserver.observe(footer);
})();

/* === CTA Glimmer: cursor-reactive highlight + micro-haptic === */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const btns = document.querySelectorAll('.btn.glimmer');
  if (!btns.length) return;

  btns.forEach(btn => {
    const set = (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      btn.style.setProperty('--mx', `${x}px`);
      btn.style.setProperty('--my', `${y}px`);
    };
    btn.addEventListener('mousemove', set, {passive:true});
    btn.addEventListener('mouseenter', (e) => {
      set(e);
      if (!RM && 'vibrate' in navigator) { try{ navigator.vibrate(8); }catch{} }
    }, {passive:true});
    btn.addEventListener('mouseleave', () => {
      btn.style.setProperty('--mx', `50%`);
      btn.style.setProperty('--my', `50%`);
    }, {passive:true});
  });
})();

/* Magnetic CTAs (hero + nav) */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(RM) return;
  document.querySelectorAll('.btn.primary.magnet, .topnav .btn.primary.sm').forEach(btn=>{
    const strength=10; let raf=null,tx=0,ty=0,cx=0,cy=0;
    function onMove(e){ const r=btn.getBoundingClientRect(); cx=((e.clientX-r.left)/r.width-.5)*strength; cy=((e.clientY-r.top)/r.height-.5)*strength; if(!raf) raf=requestAnimationFrame(apply); }
    function onLeave(){ cx=cy=0; if(!raf) raf=requestAnimationFrame(apply); }
    function apply(){ raf=null; tx+=(cx-tx)*.18; ty+=(cy-ty)*.18; btn.style.transform=`translate(${tx}px,${ty}px)`; }
    btn.addEventListener('mousemove',onMove,{passive:true});
    btn.addEventListener('mouseleave',onLeave);
  });
})();



