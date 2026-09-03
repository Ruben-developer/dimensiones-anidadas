/* ============================================================
   Dimensiones Anidadas — layers3d.js
   Visualización Three.js de las 4 capas anidadas — versión rica
   Cada capa tiene una representación visual propia e interactiva.
   ============================================================ */

(function (window, document) {
  'use strict';

  if (typeof window.THREE === 'undefined') return;

  const THREE = window.THREE;

  const COLORS = {
    1: 0x8B5CF6,  // violeta
    2: 0x3B82F6,  // azul
    3: 0x10B981,  // verde
    4: 0xF59E0B   // dorado
  };
  const COL_HEX = {
    1: '#8B5CF6', 2: '#3B82F6', 3: '#10B981', 4: '#F59E0B'
  };

  const CAMERA_ZOOM = {
    intro: 34, 1: 8, 2: 13, 3: 21, 4: 30, 5: 30, 6: 30, 7: 24, 8: 30, 9: 30
  };
  // Visibilidad por capa [1D, 2D, 3D, 4D]
  const V = {
    intro: [0.9, 0.35, 0.3, 0.25],
    1:     [1.0, 0.0, 0.0, 0.0],
    2:     [0.8, 0.9, 0.0, 0.0],
    3:     [0.4, 0.55, 0.9, 0.0],
    4:     [0.3, 0.4, 0.6, 0.92],
    5:     [0.5, 0.6, 0.7, 0.82],
    6:     [0.5, 0.6, 0.7, 0.82],
    7:     [0.4, 0.5, 0.8, 0.4],
    8:     [0.5, 0.6, 0.7, 0.82],
    9:     [1.0, 1.0, 1.0, 1.0]
  };

  // ---------- Renderer ----------
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.inset = '0';
  holder.style.zIndex = '0';
  holder.style.pointerEvents = 'none';
  holder.id = 'bg-3d';
  document.body.prepend(holder);

  // Si WebGL no está disponible, el sitio funciona igualmente con los
  // fondos CSS; no rompemos la página.
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (e) {
    holder.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 34);
  camera.lookAt(0, 0, 0);

  // Luz para materiales con brillo
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 10);
  scene.add(dirLight);
  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  pointLight.position.set(-5, -3, 6);
  scene.add(pointLight);
  const layerRoot = new THREE.Group();
  scene.add(layerRoot);

  function ease(a, b, k) { return a + (b - a) * k; }

  const dims = {}; // contendrá los elementos animables de cada capa

  // ============================================================
  // CAPA 1 — La cuerda vibrante (1D)
  // ============================================================
  function buildLayer1() {
    const g = new THREE.Group();

    // La cuerda: una línea de puntos que vibra en modo armónico (3D)
    const seg = 64;
    const pts = [];
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(seg * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: COLORS[1], size: 0.05, transparent: true, opacity: 1 });
    const line = new THREE.Points(geo, mat);
    g.add(line);

    // Glow alrededor (esfera difusa pequeña)
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 24),
      new THREE.MeshBasicMaterial({ color: COLORS[1], transparent: true, opacity: 0.25 })
    );
    g.add(glow);

    // Partículas hijo que "emanan" (partículas generadas por la vibración)
    const particleCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pData = [];
    for (let i = 0; i < particleCount; i++) {
      pData.push({
        speed: 0.2 + Math.random() * 0.5,
        dir: Math.random() * Math.PI * 2,
        off: Math.random() * 10
      });
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: COLORS[1], size: 0.04, transparent: true, opacity: 0.8 });
    const particles = new THREE.Points(pGeo, pMat);
    g.add(particles);

    scene.add(g);
    dims[1] = { g, line, positions, particles, pData, particleCount, seg, glow };
  }

  // ============================================================
  // CAPA 2 — La membrana ondulada (2D) domain wall
  // ============================================================
  function buildLayer2() {
    const g = new THREE.Group();

    const size = 5, seg = 32;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    const mat = new THREE.MeshPhongMaterial({
      color: COLORS[2],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      wireframe: false,
      emissive: COLORS[2],
      emissiveIntensity: 0.3,
      shininess: 40
    });
    const mesh = new THREE.Mesh(geo, mat);
    g.add(mesh);
    mesh.rotation.y = Math.PI / 2; // de pié, como pared

    // Rejilla de puntos sobre la membrana (fluctuaciones)
    const sGeo = new THREE.BufferGeometry();
    const sCount = 40 * 40;
    const sPos = new Float32Array(sCount * 3);
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const sMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.7 });
    const ptsMesh = new THREE.Points(sGeo, sMat);
    g.add(ptsMesh);

    scene.add(g);
    const vertices = geo.attributes.position;
    dims[2] = { g, mesh, vertices, pts: sGeo.attributes.position, seg, size, ptsMesh };
  }

  // ============================================================
  // CAPA 3 — El volumen con órbitas estables (3D)
  // ============================================================
  function buildLayer3() {
    const g = new THREE.Group();

    // Núcleo central
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshPhongMaterial({ color: COLORS[3], emissive: COLORS[3], emissiveIntensity: 0.5, shininess: 80 })
    );
    g.add(core);

    // Electrones orbitando en órbitas estables (demuestra Ehrenfest)
    const orbits = [
      { radius: 1.0, speed: 1.5, tilt: 0.3, phase: 0 },
      { radius: 1.6, speed: 1.0, tilt: 1.2, phase: 2 },
      { radius: 2.2, speed: 0.7, tilt: 2.1, phase: 4 }
    ];

    // Anillos de órbita
    const orbitMeshes = orbits.map((o) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(o.radius, 0.015, 6, 64),
        new THREE.MeshBasicMaterial({ color: COLORS[3], transparent: true, opacity: 0.35 })
      );
      ring.rotation.x = o.tilt;
      ring.rotation.z = o.phase * 0.5;
      g.add(ring);
      return ring;
    });

    // Electrones (puntos brillantes)
    const electronGeo = new THREE.SphereGeometry(0.09, 10, 10);
    const electronMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const electrons = orbits.map((o) => {
      const e = new THREE.Mesh(electronGeo, electronMat.clone());
      e.material.color = new THREE.Color(COL_HEX[3]);
      g.add(e);
      return { mesh: e, orbit: o };
    });

    // "Huella" de la superficie frontera (esfera tenue de volumen)
    const boundary = new THREE.Mesh(
      new THREE.SphereGeometry(3.1, 32, 32),
      new THREE.MeshBasicMaterial({ color: COLORS[3], wireframe: true, transparent: true, opacity: 0.1 })
    );
    g.add(boundary);

    scene.add(g);
    dims[3] = { g, core, orbits, electrons, orbitMeshes, boundary };
  }

  // ============================================================
  // CAPA 4 — El hiperespacio (4D) proyectando fuerzas
  // ============================================================
  function buildLayer4() {
    const g = new THREE.Group();

    // Hiperesfera: esfera grande con rejilla y brillo
    const radius = 5.2;
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 48),
      new THREE.MeshPhongMaterial({
        color: COLORS[4],
        wireframe: true,
        transparent: true,
        opacity: 0.3,
        emissive: COLORS[4],
        emissiveIntensity: 0.2
      })
    );
    g.add(sphere);

    // Capa densa tipo hilera (evocación 4D)
    const innerShell = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.92, 48, 48),
      new THREE.MeshBasicMaterial({ color: COLORS[4], transparent: true, opacity: 0.06, side: THREE.BackSide })
    );
    g.add(innerShell);

    // Proyección: partículas que viajan hacia el interior (fuerzas EM/gravedad)
    const pCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pData = [];
    for (let i = 0; i < pCount; i++) {
      // Posición inicial en la cáscara esférica
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pData.push({ theta, phi, speed: 0.4 + Math.random() * 0.6, off: Math.random() * 5 });
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: COLORS[4], size: 0.06, transparent: true, opacity: 0.9 });
    const rays = new THREE.Points(pGeo, pMat);
    g.add(rays);

    // Lente de "proyección" — lineas radiales
    scene.add(g);
    dims[4] = { g, sphere, rays, pData, pCount, pPos, radius };
  }

  buildLayer1();
  buildLayer2();
  buildLayer3();
  buildLayer4();

  // ============================================================
  // Estrellas de fondo
  // ============================================================
  const starCount = 1200;
  const sG = new THREE.BufferGeometry();
  const sP = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 14 + Math.random() * 45;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    sP[i * 3] = r * Math.sin(p) * Math.cos(t);
    sP[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    sP[i * 3 + 2] = r * Math.cos(p);
  }
  sG.setAttribute('position', new THREE.BufferAttribute(sP, 3));
  const stars = new THREE.Points(sG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.5 }));
  scene.add(stars);

  // ============================================================
  // Estado
  // ============================================================
  const state = {
    active: 'intro',
    targetZoom: CAMERA_ZOOM.intro,
    vis: V.intro.slice(),
    mouseX: 0, mouseY: 0
  };
  let targetRotY = 0, targetRotX = 0;

  // Interactividad con el mouse (rotación sutil)
  window.addEventListener('mousemove', (e) => {
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function onSectionChange(e) {
    const map = { intro: 'intro', dim1: '1', dim2: '2', dim3: '3', dim4: '4', dim5: '5', dim6: '6', dim7: '7', dim8: '8', dim9: '9' };
    const key = map[e.detail.id] || 'intro';
    state.active = key;
    state.targetZoom = CAMERA_ZOOM[key] ?? 30;
    state.vis = (V[key] ? V[key].slice() : V.intro.slice());
  }
  window.addEventListener('sectionchange', onSectionChange);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ============================================================
  // Loop de animación
  // ============================================================
  const visOpacity = { 1: 0.9, 2: 0.35, 3: 0.3, 4: 0.25 };

  function updateLayer1(t) {
    const d = dims[1];
    const target = state.vis[0] ?? 0;
    visOpacity[1] = ease(visOpacity[1], target, 3, 0.016);

    // Vibración armónica en 3D (cuerda)
    const pos = d.line.geometry.attributes.position.array;
    for (let i = 0; i < d.seg; i++) {
      const u = (i / (d.seg - 1)) * 4 - 2; // -2..2
      const amp = 0.25;
      // Modos superpuestos
      pos[i * 3]     = Math.sin(u * 1.2 + t * 2) * amp;
      pos[i * 3 + 1] = Math.cos(u * 2.4 + t * 1.4) * amp * 0.6;
      pos[i * 3 + 2] = u * 0.35;
    }
    d.line.geometry.attributes.position.needsUpdate = true;
    d.line.material.opacity = visOpacity[1];

    // Glow
    d.glow.material.opacity = 0.25 * visOpacity[1];
    const pulse = 1 + 0.2 * Math.sin(t * 5);
    d.glow.scale.set(pulse, pulse, pulse);

    // Partículas que emanan de la cuerda
    const pp = d.particles.geometry.attributes.position.array;
    for (let i = 0; i < d.particleCount; i++) {
      const dt = d.pData[i];
      const r = 0.4 + 0.9 * Math.abs(Math.sin(t * dt.speed + dt.off));
      const a = dt.dir + t * 0.3;
      // Partículas generadas por la vibración dispersándose
      pp[i * 3]     = Math.cos(a) * r;
      pp[i * 3 + 1] = Math.sin(a) * r;
      pp[i * 3 + 2] = Math.sin(dt.off * 11 + t * dt.speed * 0.8) * r;
    }
    d.particles.geometry.attributes.position.needsUpdate = true;
    d.particles.material.opacity = 0.8 * visOpacity[1];

    d.g.rotation.y = t * 0.15;
    d.g.rotation.x = Math.sin(t * 0.2) * 0.15;
  }

  function updateLayer2(t) {
    const d = dims[2];
    const target = state.vis[1] ?? 0;
    visOpacity[2] = ease(visOpacity[2], target, 3, 0.016);
    d.mesh.material.opacity = 0.6 * visOpacity[2];
    const p = d.vertices.array;

    // Onda viajera sobre la membrana
    for (let i = 0; i <= d.seg; i++) {
      for (let j = 0; j <= d.seg; j++) {
        const idx = (i * (d.seg + 1) + j) * 3;
        const x = (i / d.seg - 0.5) * d.size;
        const z = (j / d.seg - 0.5) * d.size;
        const ripple = Math.sin(x * 1.5 + t * 1.5) * Math.cos(z * 1.5 + t * 1.1) * 0.4;
        p[idx + 2] = ripple;
      }
    }
    d.vertices.needsUpdate = true;
    d.g.rotation.y = t * 0.12;

    // Puntos encima
    const sp = d.pts.array;
    const spCount = 40;
    for (let i = 0; i < spCount; i++) {
      for (let j = 0; j < spCount; j++) {
        const idx = (i * spCount + j) * 3;
        const x = (i / spCount - 0.5) * d.size;
        const z = (j / spCount - 0.5) * d.size;
        sp[idx] = x;
        sp[idx + 1] = Math.sin(x * 1.5 + t * 1.5) * Math.cos(z * 1.5 + t * 1.1) * 0.4;
        sp[idx + 2] = z;
      }
    }
    d.pts.needsUpdate = true;
  }

  function updateLayer3(t) {
    const d = dims[3];
    const target = state.vis[2] ?? 0;
    visOpacity[3] = ease(visOpacity[3], target, 3, 0.016);

    d.core.material.opacity = 1;
    d.boundary.material.opacity = 0.1 * visOpacity[3];

    // Electrones orbitando (órbitas estables)
    d.electrons.forEach((el, i) => {
      const o = el.orbit;
      const a = t * o.speed + i;
      const r = o.radius;
      const x = r * Math.cos(a);
      const z = r * Math.sin(a);
      el.mesh.position.set(x, 0, z);
      // aplicar tilt de la órbita aproximado
      el.mesh.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), o.tilt);
      el.mesh.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), o.phase * 0.5);
    });

    // Rotar anillos y núcleo
    d.g.rotation.y = t * 0.2;
    d.core.scale.setScalar(1 + 0.1 * Math.sin(t * 3));

    d.orbitMeshes.forEach((ring, i) => {
      ring.material.opacity = 0.35 * visOpacity[3];
    });
  }

  function updateLayer4(t) {
    const d = dims[4];
    const target = state.vis[3] ?? 0;
    visOpacity[4] = ease(visOpacity[4], target, 3, 0.016);
    d.sphere.material.opacity = 0.3 * visOpacity[4];

    // Rotación de la hiperesfera
    d.sphere.rotation.x = t * 0.08;
    d.sphere.rotation.y = t * 0.12;

    // Proyección: rayos viajando hacia el interior
    const pp = d.rays.geometry.attributes.position.array;
    for (let i = 0; i < d.pCount; i++) {
      const pr = d.pData[i];
      // recorre del borde (5.2) hacia dentro
      const frac = (t * pr.speed + pr.off) % 1;
      const rad = d.radius * (1 - frac);
      const dir = new THREE.Vector3(
        Math.sin(pr.phi) * Math.cos(pr.theta),
        Math.sin(pr.phi) * Math.sin(pr.theta),
        Math.cos(pr.phi)
      );
      pp[i * 3]     = dir.x * rad;
      pp[i * 3 + 1] = dir.y * rad;
      pp[i * 3 + 2] = dir.z * rad;
    }
    d.rays.geometry.attributes.position.needsUpdate = true;
    d.rays.material.opacity = 0.9 * visOpacity[4];

    d.g.rotation.y = t * 0.03;
  }

  let last = performance.now();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    const t = now / 1000;
    last = now;

    // Cámara con parallax por mouse
    camera.position.z = ease(camera.position.z, state.targetZoom, 2.5, dt);
    camera.position.x = ease(camera.position.x, state.mouseX * 1.2, 2, dt);
    camera.position.y = ease(camera.position.y, -state.mouseY * 0.8, 2, dt);
    camera.lookAt(0, 0, 0);

    updateLayer1(t);
    updateLayer2(t);
    updateLayer3(t);
    updateLayer4(t);

    stars.rotation.y = t * 0.02;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

})(window, document);
