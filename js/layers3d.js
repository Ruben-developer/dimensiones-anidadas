/* ============================================================
   Dimensiones Anidadas — layers3d.js
   Visualización Three.js de las 4 capas anidadas
   ============================================================ */

(function (window, document) {
  'use strict';

  if (typeof window.THREE === 'undefined') {
    // Three.js no cargó; no hacemos nada y dejamos fondo limpio
    return;
  }

  const THREE = window.THREE;

  // ---------- Utilidades ----------
  function hsl(hex) {
    const c = new THREE.Color(hex);
    return { r: c.r, g: c.g, b: c.b };
  }

  // ---------- Estado de la cámara por capa ----------
  // Cada capa "zoom in" hacia el centro, mostrando progresivamente capas internas
  const CAMERA_ZOOM = {
    intro: 30,
    1: 8,    // muy cerca del centro -> solo se ve la cuerda (1D)
    2: 14,   // se ve la membrana 2D
    3: 22,   // se ve el volumen 3D
    4: 30,   // se ve la hiperesfera completa
    5: 30,
    6: 30,
    7: 22,
    8: 30,
    9: 30
  };

  // Opacidad de cada esfera según capa activa
  const SPHERE_VISIBILITY = {
    // [1D, 2D, 3D, 4D]
    intro: [0.9, 0.35, 0.25, 0.2],
    1:     [1.0, 0.0, 0.0, 0.0],
    2:     [0.8, 0.85, 0.0, 0.0],
    3:     [0.5, 0.6, 0.85, 0.0],
    4:     [0.4, 0.5, 0.7, 0.9],
    5:     [0.5, 0.6, 0.7, 0.8],
    6:     [0.5, 0.6, 0.7, 0.8],
    7:     [0.4, 0.5, 0.8, 0.35],
    8:     [0.5, 0.6, 0.7, 0.8],
    9:     [1.0, 1.0, 1.0, 1.0]
  };

  // ---------- Setup escena ----------
  const canvas = document.createElement('canvas');
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.inset = '0';
  holder.style.zIndex = '0';
  holder.style.pointerEvents = 'none';
  holder.id = 'bg-3d';
  document.body.prepend(holder);
  holder.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 34);
  camera.lookAt(0, 0, 0);

  // ---------- Las cuatro capas ----------
  const RADII = [1.6, 3.6, 6.6, 10.5];
  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  const spheres = RADII.map((r, i) => {
    const geo = new THREE.SphereGeometry(r, 48, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS[i],
      transparent: true,
      opacity: 0.9,
      wireframe: i === 0 ? false : true,  // la 1D es sólida
      wireframeLinewidth: 1
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return { mesh, baseOpacity: 0.9, radius: r, index: i };
  });

  // La 1D: en realidad es una cuerda, la representamos con una esfera sólida pequeña
  // y un anillo vibrante
  const ringGeo = new THREE.TorusGeometry(RADII[0] * 1.15, 0.02, 8, 96);
  const ringMat = new THREE.MeshBasicMaterial({ color: COLORS[0], transparent: true, opacity: 0.7 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  scene.add(ring);

  // Partículas de fondo (estrellas/materia)
  const starCount = 1400;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 14 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.5 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---------- Estado de la capa activa ----------
  const state = {
    active: 'intro',
    targetZoom: CAMERA_ZOOM.intro,
    vis: SPHERE_VISIBILITY.intro.slice(),
    time: 0
  };

  // ---------- Listeners ----------
  function onSectionChange(e) {
    const id = e.detail.id; // 'intro', 'dim1'...
    // mapear a clave numerica simple
    const map = { intro: 'intro', dim1: '1', dim2: '2', dim3: '3', dim4: '4', dim5: '5', dim6: '6', dim7: '7', dim8: '8', dim9: '9' };
    const key = map[id] || 'intro';
    state.active = key;
    state.targetZoom = CAMERA_ZOOM[key] ?? 30;
    state.vis = SPHERE_VISIBILITY[key] ? SPHERE_VISIBILITY[key].slice() : SPHERE_VISIBILITY.intro.slice();
  }
  window.addEventListener('sectionchange', onSectionChange);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- Loop ----------
  function ease(current, target, lambda, dt) {
    return current + (target - current) * (1 - Math.exp(-lambda * dt));
  }

  let last = performance.now();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    state.time += dt;

    // Cámara: ease hacia el zoom objetivo
    camera.position.z = ease(camera.position.z, state.targetZoom, 2.5, dt);

    // Rota la arena
    spheres.forEach((s, i) => {
      s.mesh.rotation.y = state.time * (0.12 + i * 0.03);
      s.mesh.rotation.x = state.time * (0.05 + i * 0.02);
      // visibilidad suave
      const target = state.vis[i] ?? 0;
      s.mesh.material.opacity = ease(s.mesh.material.opacity, target, 3, dt);
    });

    // Anillo vibrante (1D)
    ring.rotation.x = state.time * 0.4;
    ring.rotation.y = state.time * 0.3;
    ring.material.opacity = ease(ring.material.opacity, state.vis[0] ?? 0, 3, dt);
    const pulse = 1 + 0.05 * Math.sin(state.time * 4);
    ring.scale.set(pulse, pulse, pulse);

    stars.rotation.y = state.time * 0.02;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

})(window, document);
