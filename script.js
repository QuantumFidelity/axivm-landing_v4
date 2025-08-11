/**
 * AXIVM — Premium AI Agent Map
 * Cinematic Canvas 2D visualization with scroll-driven chaos→cohere→order morph
 * Pure vanilla JS, no external libraries
 */

(function(){
  'use strict';

  // ===== CONFIGURATION =====
  const NODE_BASE = 1200;          // more particles for full screen coverage
  const MAX_KNN = 3;               // max connections per node
  const GLOW_STRENGTH = 0.9;       // additive glow intensity
  const CHAOS_FORCE = 0.0008;      // slower chaotic movement
  const COHERE_FORCE = 0.0002;     // very gentle clustering force
  const ORDER_FORCE = 0.0004;      // extremely slow reordering for scroll control
  const HUE_START = 190;           // cyan
  const HUE_END = 140;             // emerald
  const ACCENT_HUE = 18;           // warm ember
  const ACCENT_PROB = 0.03;        // 3% accent nodes

  // ===== CANVAS SETUP =====
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  let nodes = [];
  let edges = [];
  let animationId;
  let scrollProgress = 0;
  let mouse = { x: 0, y: 0 };
  let camera = { x: 0, y: 0 };
  let time = 0;
  let ambientAngle = 0;
  let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mouseActive = false;

  // ===== HELPER FUNCTIONS =====
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function hsl(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ===== NODE SYSTEM =====
  function createNodes() {
    const count = Math.floor(NODE_BASE * (w * h) / (1920 * 1080) * dpr);
    nodes = [];
    
    for (let i = 0; i < count; i++) {
      const isAccent = Math.random() < ACCENT_PROB;
      nodes.push({
        x: Math.random() * w,  // True full screen distribution
        y: Math.random() * h,  // True full screen distribution
        z: (Math.random() - 0.5) * 200,
        vx: 0,                                // No initial velocity - completely static
        vy: 0,                                // No initial velocity - completely static
        vz: 0,                                // No initial velocity - completely static
        size: Math.random() * 2 + 0.8,       // Slightly larger particles
        cluster: 0, // Not used anymore
        targetCluster: 0, // Not used anymore
        isAccent: isAccent,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  // ===== CLUSTER SYSTEM =====
  function getClusterCentroids() {
    // Distribute clusters across the entire screen
    return [
      { x: w * 0.15, y: h * 0.15 },   // Top-left cluster
      { x: w * 0.85, y: h * 0.15 },   // Top-right cluster
      { x: w * 0.15, y: h * 0.85 },   // Bottom-left cluster
      { x: w * 0.85, y: h * 0.85 }    // Bottom-right cluster
    ];
  }

  // ===== HEX LATTICE FOR ORDERED STATE =====
  function getHexLatticePositions() {
    const positions = [];
    const hexSize = 40; // Larger spacing for full screen
    const rows = 10; // More rows for full screen coverage
    const cols = 16; // More columns for full screen coverage
    
    // Cover the entire screen with hex lattice
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let x = (col / (cols - 1)) * w; // Distribute across full width
        const y = (row / (rows - 1)) * h; // Distribute across full height
        
        // Add some hex offset for more natural distribution
        if (row % 2 === 1) x += hexSize * 0.5;
        
        positions.push({ x, y });
      }
    }
    return positions;
  }

  // ===== EDGE SYSTEM =====
  function updateEdges() {
    edges = [];
    const phases = getPhaseValues(scrollProgress);
    
    // Start completely disconnected, gradually connect more
    const baseDistance = Math.min(w, h) * 0.08;
    const maxDistance = baseDistance * (0.1 + phases.cohere * 0.6 + phases.order * 0.8);
    
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      const connections = [];
      
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        
        const nodeB = nodes[j];
        const dist = distance(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
        
        if (dist < maxDistance) {
          connections.push({ node: nodeB, distance: dist });
        }
      }
      
      // Sort by distance and take closest MAX_KNN
      connections.sort((a, b) => a.distance - b.distance);
      
      // Start with NO connections, gradually increase
      const maxConnections = Math.floor(MAX_KNN * (0 + phases.cohere * 0.5 + phases.order * 0.5));
      
      for (let k = 0; k < Math.min(connections.length, maxConnections); k++) {
        edges.push({
          from: nodeA,
          to: connections[k].node,
          distance: connections[k].distance,
          pulseT: Math.random(),
          pulseSpeed: 0.02 + Math.random() * 0.03
        });
      }
    }
  }

  // ===== COLOR SYSTEM =====
  function getNodeColor(node, progress) {
    if (node.isAccent) {
      return hsl(ACCENT_HUE, 94, 58);
    }
    
    const hue = lerp(HUE_START, HUE_END, progress);
    const saturation = 90;
    const lightness = lerp(58, 45, progress); // Darker as we progress
    
    return hsl(hue, saturation, lightness);
  }

  // ===== ANIMATION PHASES =====
  function getPhaseValues(progress) {
    return {
      chaos: 1 - smoothstep(0.0, 0.25, progress),
      cohere: smoothstep(0.2, 0.75, progress),
      order: smoothstep(0.7, 1.0, progress)
    };
  }

  // ===== NODE UPDATE =====
  function updateNodes() {
    const phases = getPhaseValues(scrollProgress);
    const centroids = getClusterCentroids();
    const hexPositions = getHexLatticePositions();
    
    nodes.forEach((node, index) => {
      // Only update if we're in the animated sections (not hero)
      if (scrollProgress > 0.3) {
        // Update velocity based on phase
        if (phases.chaos > 0.1) {
          // Dynamic chaotic movement
          node.vx += (Math.random() - 0.5) * CHAOS_FORCE * phases.chaos * 2;
          node.vy += (Math.random() - 0.5) * CHAOS_FORCE * phases.chaos * 2;
          node.vz += (Math.random() - 0.5) * CHAOS_FORCE * 0.5 * phases.chaos;
          
          // Add some organic wandering
          if (Math.random() < 0.15) {
            node.vx += (Math.random() - 0.5) * 0.8;
            node.vy += (Math.random() - 0.5) * 0.8;
          }
          
          // Mouse interaction - water-like repulsion and attraction
          if (mouseActive) {
            const mouseDist = distance(node.x, node.y, mouse.x, mouse.y);
            if (mouseDist < 200) { // Larger interaction radius
              const force = (200 - mouseDist) / 200;
              const dx = node.x - mouse.x;
              const dy = node.y - mouse.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 0) {
                // Stronger repulsion when close, gentle attraction when further
                const repelRadius = 100;
                const repelForce = mouseDist < repelRadius ? -1.2 : 0.6;
                
                node.vx += (dx / dist) * force * repelForce;
                node.vy += (dy / dist) * force * repelForce;
              }
            }
          }
        }
        
        if (phases.cohere > 0.1) {
          // Gentle organic movement during cohere phase
          if (Math.random() < 0.08) { // 8% chance of movement
            node.vx += (Math.random() - 0.5) * 0.6;
            node.vy += (Math.random() - 0.5) * 0.6;
          }
          
          // Add some subtle attraction to nearby particles
          if (Math.random() < 0.02) { // 2% chance of attraction
            const nearbyNodes = nodes.filter(other => {
              const dist = distance(node.x, node.y, other.x, other.y);
              return dist > 0 && dist < 100;
            });
            
            if (nearbyNodes.length > 0) {
              const randomNode = nearbyNodes[Math.floor(Math.random() * nearbyNodes.length)];
              const dx = randomNode.x - node.x;
              const dy = randomNode.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 0) {
                node.vx += (dx / dist) * 0.3;
                node.vy += (dy / dist) * 0.3;
              }
            }
          }
        }
        
        if (phases.order > 0.1) {
          // Gentle organized movement during order phase (slower toward bottom)
          const slowFactor = 1 - (scrollProgress * 0.7); // Slow down by 70% at bottom
          if (Math.random() < 0.05) { // 5% chance of movement
            node.vx += (Math.random() - 0.5) * 0.4 * slowFactor;
            node.vy += (Math.random() - 0.5) * 0.4 * slowFactor;
          }
          
          // Add some wave-like movement (also slowed)
          const time = Date.now() * 0.001;
          const waveX = Math.sin(time * 0.5 + node.x * 0.01) * 0.2 * slowFactor;
          const waveY = Math.cos(time * 0.3 + node.y * 0.01) * 0.2 * slowFactor;
          
          if (Math.random() < 0.03) { // 3% chance of wave movement
            node.vx += waveX;
            node.vy += waveY;
          }
        }
        
        // Apply velocity
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;
        
        // Damping
        node.vx *= 0.98;
        node.vy *= 0.98;
        node.vz *= 0.98;
        
        // Keep in bounds (smaller margin for full screen coverage)
        const margin = 20;
        if (node.x < margin) {
          node.x = margin;
          node.vx = Math.abs(node.vx) * 0.2; // Very strong bounce back
        }
        if (node.x > w - margin) {
          node.x = w - margin;
          node.vx = -Math.abs(node.vx) * 0.2; // Very strong bounce back
        }
        if (node.y < margin) {
          node.y = margin;
          node.vy = Math.abs(node.vy) * 0.2; // Very strong bounce back
        }
        if (node.y > h - margin) {
          node.y = h - margin;
          node.vy = -Math.abs(node.vy) * 0.2; // Very strong bounce back
        }
      }
      
      // Update pulse phase
      node.pulsePhase += 0.05;
    });
  }

  // ===== RENDERING =====
  function render() {
    // Clear completely transparent (no background at all)
    ctx.clearRect(0, 0, w, h);
    
    // Disable camera parallax to prevent particles from moving with mouse
    camera.x = 0;
    camera.y = 0;
    
    // Update ambient light
    ambientAngle += 0.001;
    const ambientX = Math.cos(ambientAngle) * w * 0.3;
    const ambientY = Math.sin(ambientAngle) * h * 0.3;
    
    // Sort nodes by depth for proper layering
    const sortedNodes = [...nodes].sort((a, b) => b.z - a.z);
    
    // Always render particles full screen, but only animate them when scrolled down
    if (scrollProgress > 0.3) {
      // Render edges first (background)
      renderEdges();
      
      // Render nodes with glow
      renderNodes(sortedNodes, ambientX, ambientY);
    } else {
      // Hero section: Show static particles only
      renderStaticParticles(sortedNodes, ambientX, ambientY);
    }
  }

  function renderEdges() {
    const phases = getPhaseValues(scrollProgress);
    
    edges.forEach(edge => {
      // Update pulse
      edge.pulseT += edge.pulseSpeed;
      if (edge.pulseT > 1) edge.pulseT = 0;
      
      // Calculate visibility based on phase
      let alpha = 0.3;
      if (phases.chaos > 0.5) {
        alpha = Math.random() > 0.8 ? 0.2 : 0;
      } else if (phases.cohere > 0.5) {
        alpha = 0.5;
      } else if (phases.order > 0.5) {
        alpha = 0.8; // Much more visible in ordered state
      }
      
      if (alpha > 0) {
        const fromX = edge.from.x + camera.x;
        const fromY = edge.from.y + camera.y;
        const toX = edge.to.x + camera.x;
        const toY = edge.to.y + camera.y;
        
        // Curved line
        const midX = (fromX + toX) * 0.5;
        const midY = (fromY + toY) * 0.5 + Math.sin(time * 0.5) * 10 * phases.chaos;
        
        ctx.strokeStyle = `rgba(25, 182, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo(midX, midY, toX, toY);
        ctx.stroke();
        
        // Data pulse
        if (Math.random() < 0.01) {
          const pulseX = lerp(fromX, toX, edge.pulseT);
          const pulseY = lerp(fromY, toY, edge.pulseT);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  function renderStaticParticles(sortedNodes, ambientX, ambientY) {
    // Add subtle background gradient for hero
    const gradient = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.8);
    gradient.addColorStop(0, 'rgba(25, 182, 255, 0.08)');
    gradient.addColorStop(0.5, 'rgba(25, 182, 255, 0.03)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Render particles in hero section - static, no animation
    sortedNodes.forEach(node => {
      const x = node.x + camera.x;
      const y = node.y + camera.y;
      
      // Depth-based size and opacity with safety checks
      const depth = clamp((node.z + 100) / 200, 0.1, 1.0);
      let size = Math.max(0.5, node.size * depth);
      let opacity = lerp(0.3, 0.7, depth); // Higher opacity for better visibility
      
      // Get color (cyan for hero section)
      const color = node.isAccent ? hsl(18, 94, 58) : hsl(190, 90, 58);
      
      // Draw to main canvas with glow
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.shadowColor = color;
      ctx.shadowBlur = size * 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }



  function renderNodes(sortedNodes, ambientX, ambientY) {
    const phases = getPhaseValues(scrollProgress);
    
    // Create offscreen buffer for glow
    const glowCanvas = document.createElement('canvas');
    const glowCtx = glowCanvas.getContext('2d');
    glowCanvas.width = w;
    glowCanvas.height = h;
    
    sortedNodes.forEach(node => {
      const x = node.x + camera.x;
      const y = node.y + camera.y;
      
      // Depth-based size and opacity with safety checks
      const depth = clamp((node.z + 100) / 200, 0.1, 1.0); // Prevent negative values
      let size = Math.max(0.5, node.size * depth); // Minimum size of 0.5
      let opacity = lerp(0.3, 1.0, depth);
      
      // Make nodes larger and more visible in ordered state
      if (phases.order > 0.5) {
        size *= 1.5;
        opacity = Math.min(1.0, opacity * 1.3);
      }
      
      // Ambient lighting
      const ambientDist = distance(x, y, ambientX, ambientY);
      const ambientLight = Math.max(0, 1 - ambientDist / 300);
      
      // Get color
      const color = getNodeColor(node, scrollProgress);
      
      // Draw to main canvas
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity * (0.7 + ambientLight * 0.3);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw to glow buffer
      glowCtx.fillStyle = color;
      let glowAlpha = opacity * GLOW_STRENGTH * 0.3;
      let glowSize = size * 1.5;
      
      // Enhanced glow in ordered state
      if (phases.order > 0.5) {
        glowAlpha *= 1.5;
        glowSize *= 1.2;
      }
      
      glowCtx.globalAlpha = glowAlpha;
      glowCtx.shadowColor = color;
      glowCtx.shadowBlur = size * 3;
      glowCtx.beginPath();
      glowCtx.arc(x, y, glowSize, 0, Math.PI * 2);
      glowCtx.fill();
    });
    
    // Composite glow buffer
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glowCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ===== RESIZE HANDLING =====
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio, 2);
    
    // Scale for high DPR
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    
    createNodes();
    updateEdges();
  }

  // ===== SCROLL HANDLING =====
  function updateScroll() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = clamp(scrollTop / docHeight, 0, 1);
  }



  // ===== ANIMATION LOOP =====
  function animate() {
    if (!reduceMotion) {
      time += 0.016;
      updateNodes();
      updateEdges();
    }
    render();
    animationId = requestAnimationFrame(animate);
  }

  // ===== INITIALIZATION =====
  function init() {
    if (reduceMotion) {
      // Show mid-state for reduced motion
      scrollProgress = 0.5;
    }
    
    resize();
    animate();
    
    // Event listeners
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', updateScroll, { passive: true });
    
    // Mouse interaction for water-like particle behavior
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouseActive = true;
    }, { passive: true });
    
    window.addEventListener('mouseenter', () => {
      mouseActive = true;
    }, { passive: true });
    
    window.addEventListener('mouseleave', () => {
      mouseActive = false;
    }, { passive: true });
    
    // Touch support for mobile
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouseActive = true;
      }
    }, { passive: true });
    
    window.addEventListener('touchend', () => {
      mouseActive = false;
    }, { passive: true });
    
    // Update year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // ===== CLEANUP =====
  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('beforeunload', cleanup);

})();
