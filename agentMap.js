/**
 * AXIVM — Interactive AI Agent Map
 * Three.js-based visualization with scroll-triggered transformation
 */

(function(){
  'use strict';

  // ===== CONFIGURATION =====
  const CONFIG = {
    MAX_AGENTS: 80,
    MOBILE_AGENTS: 40,
    AGENT_SIZE: { min: 0.5, max: 2.0 },
    CONNECTION_DISTANCE: 6,
    COLORS: {
      chaos: '#ff3c3c',
      organized: '#00b7ff', 
      precision: '#00ff99'
    }
  };

  // ===== THREE.JS SETUP =====
  let scene, camera, renderer;
  let agents = [];
  let agentMeshes = [];
  let connectionLines = [];
  let mouse = { x: 0, y: 0 };
  let scrollProgress = 0;
  let currentState = 'chaos';
  let animationId;
  let isMobile = window.innerWidth < 768;
  let agentCount = isMobile ? CONFIG.MOBILE_AGENTS : CONFIG.MAX_AGENTS;

  // Initialize Three.js
  function initThreeJS() {
    console.log('Initializing Three.js...');
    
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    console.log('Creating agents...');
    createAgents();
    createConnections();
    
    console.log('Starting animation...');
    animate();
  }

  // ===== AGENT SYSTEM =====
  function createAgents() {
    const geometry = new THREE.SphereGeometry(1, 8, 8);
    
    for (let i = 0; i < agentCount; i++) {
      const agent = {
        id: i,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 8
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.005
        ),
        size: Math.random() * (CONFIG.AGENT_SIZE.max - CONFIG.AGENT_SIZE.min) + CONFIG.AGENT_SIZE.min,
        group: Math.floor(Math.random() * 4)
      };
      
      agents.push(agent);
      
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(CONFIG.COLORS.chaos),
        transparent: true,
        opacity: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(agent.size);
      mesh.position.copy(agent.position);
      mesh.userData = { agent: agent };
      
      agentMeshes.push(mesh);
      scene.add(mesh);
    }
    
    console.log(`Created ${agentCount} agents`);
  }

  // ===== CONNECTION SYSTEM =====
  function createConnections() {
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });
    
    for (let i = 0; i < agentCount * 2; i++) {
      const line = new THREE.Line(lineGeometry.clone(), lineMaterial.clone());
      line.visible = false;
      connectionLines.push(line);
      scene.add(line);
    }
  }

  // ===== ANIMATION LOOP =====
  function animate() {
    animationId = requestAnimationFrame(animate);
    
    updateAgentPositions();
    updateAgentColors();
    updateConnections();
    
    renderer.render(scene, camera);
  }

  // ===== AGENT POSITION UPDATES =====
  function updateAgentPositions() {
    agents.forEach((agent, i) => {
      const mesh = agentMeshes[i];
      
      if (currentState === 'chaos') {
        // Chaotic movement
        agent.position.add(agent.velocity);
        agent.velocity.add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.0005,
          (Math.random() - 0.5) * 0.0005,
          (Math.random() - 0.5) * 0.0002
        ));
        
        // Keep in bounds
        agent.position.clampLength(0, 10);
        agent.velocity.multiplyScalar(0.99);
        
      } else if (currentState === 'organized') {
        // Move toward group positions
        const groupPositions = [
          new THREE.Vector3(-6, 4, 0),
          new THREE.Vector3(6, 4, 0),
          new THREE.Vector3(-6, -4, 0),
          new THREE.Vector3(6, -4, 0)
        ];
        
        const targetPos = groupPositions[agent.group].clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 1
          )
        );
        
        const direction = targetPos.clone().sub(agent.position);
        agent.velocity.lerp(direction.multiplyScalar(0.01), 0.02);
        agent.position.add(agent.velocity);
        
      } else if (currentState === 'precision') {
        // Organized network
        const groupPositions = [
          new THREE.Vector3(-6, 4, 0),
          new THREE.Vector3(6, 4, 0),
          new THREE.Vector3(-6, -4, 0),
          new THREE.Vector3(6, -4, 0)
        ];
        
        const targetPos = groupPositions[agent.group].clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 0.5
          )
        );
        
        agent.position.lerp(targetPos, 0.05);
        agent.velocity.multiplyScalar(0.9);
      }
      
      mesh.position.copy(agent.position);
    });
  }

  // ===== AGENT COLOR UPDATES =====
  function updateAgentColors() {
    const stateValue = getStateValue(currentState);
    
    agentMeshes.forEach((mesh, i) => {
      const material = mesh.material;
      
      let color;
      if (stateValue < 0.5) {
        const t = stateValue * 2;
        color = new THREE.Color().lerpColors(
          new THREE.Color(CONFIG.COLORS.chaos),
          new THREE.Color(CONFIG.COLORS.organized),
          t
        );
      } else {
        const t = (stateValue - 0.5) * 2;
        color = new THREE.Color().lerpColors(
          new THREE.Color(CONFIG.COLORS.organized),
          new THREE.Color(CONFIG.COLORS.precision),
          t
        );
      }
      
      material.color.copy(color);
    });
  }

  // ===== CONNECTION UPDATES =====
  function updateConnections() {
    let connectionIndex = 0;
    
    agents.forEach((agent, i) => {
      const connections = [];
      
      agents.forEach((otherAgent, j) => {
        if (i === j) return;
        
        const distance = agent.position.distanceTo(otherAgent.position);
        if (distance < CONFIG.CONNECTION_DISTANCE && connections.length < 2) {
          connections.push({ agent: otherAgent, distance });
        }
      });
      
      connections.sort((a, b) => a.distance - b.distance);
      
      connections.forEach((connection, k) => {
        if (connectionIndex >= connectionLines.length) return;
        
        const line = connectionLines[connectionIndex];
        const points = [
          agent.position.clone(),
          connection.agent.position.clone()
        ];
        
        line.geometry.setFromPoints(points);
        
        if (currentState === 'chaos') {
          line.visible = Math.random() > 0.8;
          line.material.opacity = 0.2;
        } else if (currentState === 'organized') {
          line.visible = true;
          line.material.opacity = 0.4;
        } else if (currentState === 'precision') {
          line.visible = true;
          line.material.opacity = 0.6;
        }
        
        connectionIndex++;
      });
    });
    
    for (let i = connectionIndex; i < connectionLines.length; i++) {
      connectionLines[i].visible = false;
    }
  }

  // ===== SCROLL HANDLING =====
  function updateScrollProgress() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = Math.min(scrollTop / docHeight, 1);
    
    if (scrollProgress < 0.3) {
      currentState = 'chaos';
    } else if (scrollProgress < 0.6) {
      currentState = 'organized';
    } else {
      currentState = 'precision';
    }
  }

  function getStateValue(state) {
    const states = { chaos: 0, organized: 0.5, precision: 1.0 };
    return states[state] || 0;
  }

  // ===== MOUSE INTERACTION =====
  function updateMouse(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.01;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.01;
  }

  // ===== RESIZE HANDLING =====
  function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    
    isMobile = width < 768;
    agentCount = isMobile ? CONFIG.MOBILE_AGENTS : CONFIG.MAX_AGENTS;
  }

  // ===== INITIALIZATION =====
  function init() {
    console.log('Initializing agent map...');
    
    if (typeof THREE === 'undefined') {
      console.error('Three.js not available');
      return;
    }
    
    initThreeJS();
    
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('mousemove', updateMouse, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    updateScrollProgress();
    
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    
    console.log('Agent map initialized successfully');
  }

  // ===== CLEANUP =====
  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (renderer) {
      renderer.dispose();
    }
    
    agentMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    
    connectionLines.forEach(line => {
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('beforeunload', cleanup);

})();
