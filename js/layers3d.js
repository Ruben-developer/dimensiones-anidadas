/* ============================================================
   Dimensiones Anidadas — layers3d.js
   VISUALIZACIÓN DIDÁCTICA DE LA ONTOLOGÍA 1+2+3+4

   Cada sección enseña el MECANISMO FÍSICO real del modelo:
   - 1D: cuerda vibrando → modos = partículas (e⁻, q, ν)
   - 2D: domain walls → fluctuaciones = DM, congeladas = DE
   - 3D: órbitas estables (Ehrenfest) + recursividad = conciencia
   - 4D: proyección KK 5D→4D (EM) + σ frontera = DE
   ============================================================ */

(function (window, document) {
  'use strict';

  if (typeof window.THREE === 'undefined') return;

  const THREE = window.THREE;

  // Colores por capa (ontología)
  const COL = {
    1: 0x8B5CF6,  // violeta: vibración original
    2: 0x3B82F6,  // azul: domain wall / superficie
    3: 0x10B981,  // verde: volumen 3D / materia estable
    4: 0xF59E0B   // dorado: hiperespacio / fuerzas
  };
  const COL_HEX = { 1: '#8B5CF6', 2: '#3B82F6', 3: '#10B981', 4: '#F59E0B' };

  // Parámetros ontológicos (de tu vault)
  const R0 = 5.7;        // Gpc - radio hiperesfera 4D
  const SIGMA = 1e-10;   // J/m² - tensión frontera = DE

  // ---------- Renderer ----------
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.inset = '0';
  holder.style.zIndex = '0';
  holder.style.pointerEvents = 'none';
  holder.id = 'bg-3d';
  document.body.prepend(holder);

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

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(8, 12, 15);
  scene.add(dirLight);
  const ptLight = new THREE.PointLight(0xffffff, 0.6, 60);
  ptLight.position.set(-6, -4, 10);
  scene.add(ptLight);

  function ease(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }

  // ============================================================
  // CAPA 1 — LA CUERDA VIBRANTE (1D)
  // Cada modo vibratorio = una partícula del Modelo Estándar
  // ============================================================
  const stringGroup = new THREE.Group();
  scene.add(stringGroup);

  const SEG = 240;
  const LEN = 5.5;
  const stringGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(SEG * 3);
  stringGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const stringMat = new THREE.PointsMaterial({ color: COL[1], size: 0.06, transparent: true, opacity: 0.95 });
  const stringMesh = new THREE.Points(stringGeo, stringMat);
  stringGroup.add(stringMesh);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: COL[1], transparent: true, opacity: 0.8 });
  const lineMesh = new THREE.Line(lineGeo, lineMat);
  stringGroup.add(lineMesh);

  // NÚCLEO: esferas representando partículas generadas
  const particleData = [
    { name: 'e⁻', mass: 0.511, offset: 0 },
    { name: 'u',  mass: 2.2,   offset: 2 },
    { name: 'd',  mass: 4.7,   offset: 4 },
    { name: 'ν',  mass: 0,     offset: 6 },
  ];
  const particles = particleData.map(p => {
    const g = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshBasicMaterial({ color: COL[1], transparent: true, opacity: 0.9 })
    );
    sphere.position.set((p.offset - 3) * 0.8, 0, 0);
    g.add(sphere);
    // Etiqueta
    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;color:#8B5CF6;font-size:11px;font-weight:600;pointer-events:none;white-space:nowrap;';
    label.textContent = p.name;
    label.dataset.type = 'string-label';
    document.body.appendChild(label);
    g.labelEl = label;
    stringGroup.add(g);
    return { g, sphere, label, phase: p.offset * 0.5, baseX: (p.offset - 3) * 0.8 };
  });
  stringGroup.particles = particles;

  function updateString(t, vis, wrap3D, stringShow) {
    const o = vis || 0;
    if (o < 0.01) {
      stringMesh.visible = false;
      lineMesh.visible = false;
      particles.forEach(p => { p.g.visible = false; if (p.labelEl) p.labelEl.style.opacity = '0'; });
      return;
    }
    stringMesh.visible = true;
    lineMesh.visible = true;

    // Modos vibracionales superpuestos (3 armónicos)
    const exp = 1 + (wrap3D || 0) * 0.4;
    const amp = 0.55 * stringShow * exp;
    for (let i = 0; i < SEG; i++) {
      const u = (i / (SEG - 1) - 0.5) * LEN;
      const y = Math.sin(u * 1.4 + t * 2) * amp +
                Math.sin(u * 3.8 - t * 1.6) * 0.25 * amp;
      const z = Math.cos(u * 2.6 + t * 1.8) * 0.3 * amp;
      sPos[i * 3] = u;
      sPos[i * 3 + 1] = y;
      sPos[i * 3 + 2] = z;
      lineGeo.attributes.position.array[i * 3] = u;
      lineGeo.attributes.position.array[i * 3 + 1] = y;
      lineGeo.attributes.position.array[i * 3 + 2] = z;
    }
    stringGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;

    // Partículas oscilando con la cuerda (modo local)
    particles.forEach((p, i) => {
      const localAmp = amp * 0.4;
      const y = Math.sin(t * (2 + i * 0.7) + p.phase) * localAmp;
      p.g.position.set(p.baseX, y, 0);
      // etiqueta en pantalla
      if (p.labelEl) {
        const v = new THREE.Vector3(p.baseX, y + 0.5, 0).project(camera);
        const x = (v.x * 0.5 + 0.5) * window.innerWidth;
        const y2 = (-v.y * 0.5 + 0.5) * window.innerHeight;
        p.labelEl.style.transform = `translate(${x}px, ${y2}px)`;
        p.labelEl.style.opacity = String(o * 0.9);
      }
    });

    stringMesh.material.opacity = 0.95 * o;
    lineMesh.material.opacity = 0.8 * o;
    stringGroup.rotation.y = t * 0.08;
  }

  // ============================================================
  // CAPA 2 — DOMAIN WALLS (2D)
  // Membranas reales: fluctuaciones = Materia Oscura
  // Congeladas (v=0) → ecuación estado w = -1 = Energía Oscura
  // ============================================================
  const dwGroup = new THREE.Group();
  scene.add(dwGroup);

  const DW_SIZE = 6, DW_SEG = 48;
  const dwGeo = new THREE.PlaneGeometry(DW_SIZE, DW_SIZE, DW_SEG, DW_SEG);
  const dwMat = new THREE.MeshPhongMaterial({
    color: COL[2], side: THREE.DoubleSide, transparent: true, opacity: 0.55,
    emissive: COL[2], emissiveIntensity: 0.25, shininess: 50
  });
  const dwMesh = new THREE.Mesh(dwGeo, dwMat);
  dwMesh.scale.set(0.0001, 0.0001, 1);
  dwGroup.add(dwMesh);

  // Puntos de fluctuación (DM) sobre la pared
  const fluctCount = 60 * 60;
  const fluctGeo = new THREE.BufferGeometry();
  const fluctPos = new Float32Array(fluctCount * 3);
  const fluctData = [];
  for (let i = 0; i < fluctCount; i++) {
    const ix = i % 60, iy = Math.floor(i / 60);
    fluctData.push({
      x: (ix / 59 - 0.5) * DW_SIZE,
      y: (iy / 59 - 0.5) * DW_SIZE,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 1.2
    });
  }
  fluctGeo.setAttribute('position', new THREE.BufferAttribute(fluctPos, 3));
  const fluctMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.7 });
  const fluctMesh = new THREE.Points(fluctGeo, fluctMat);
  dwGroup.add(fluctMesh);

  // Partículas DM "proyectadas" al 3D (puntos que emergen de la pared)
  const dmCount = 120;
  const dmGeo = new THREE.BufferGeometry();
  const dmPos = new Float32Array(dmCount * 3);
  const dmData = [];
  for (let i = 0; i < dmCount; i++) {
    dmData.push({
      x: (Math.random() - 0.5) * DW_SIZE * 1.5,
      y: (Math.random() - 0.5) * DW_SIZE * 1.5,
      z: (Math.random() - 0.5) * DW_SIZE * 2,
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2
    });
  }
  dmGeo.setAttribute('position', new THREE.BufferAttribute(dmPos, 3));
  const dmMat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.08, transparent: true, opacity: 0.6 });
  const dmMesh = new THREE.Points(dmGeo, dmMat);
  dwGroup.add(dmMesh);

  // "Congelación": cuando la pared se detiene, se vuelve DE
  let freezeProgress = 0;

  function updateDW(t, vis, membraneScale, wrap3D) {
    const o = vis || 0;
    if (o < 0.01) {
      dwMesh.visible = false; fluctMesh.visible = false; dmMesh.visible = false; return;
    }
    dwMesh.visible = true; fluctMesh.visible = true; dmMesh.visible = true;

    const msc = Math.max(0.0001, membraneScale || 0);
    dwMesh.scale.set(msc, msc, 1);

    // La pared oscila y "fluctúa" (DM)
    const freezeTarget = wrap3D || 0; // en 3D se congela
    freezeProgress = ease(freezeProgress, freezeTarget, 2, 1/60);
    const frozen = freezeProgress;

    const p = dwGeo.attributes.position.array;
    const amp = 0.4 * (1 - frozen * 0.7);
    for (let i = 0; i <= DW_SEG; i++) {
      for (let j = 0; j <= DW_SEG; j++) {
        const idx = (i * (DW_SEG + 1) + j) * 3;
        const x = (i / DW_SEG - 0.5) * DW_SIZE;
        const y = (j / DW_SEG - 0.5) * DW_SIZE;
        const z = Math.sin(x * 1.3 + t * (1.4 - frozen)) *
                  Math.cos(y * 1.3 + t * (1.1 - frozen)) * amp;
        p[idx] = x; p[idx + 1] = y; p[idx + 2] = z;
      }
    }
    dwGeo.attributes.position.needsUpdate = true;
    dwGeo.computeVertexNormals();

    // Fluctuaciones sobre la pared (DM)
    const fp = fluctMesh.geometry.attributes.position.array;
    fluctData.forEach((d, i) => {
      const fx = d.x + Math.sin(d.phase + t * d.speed) * 0.2 * (1 - frozen);
      const fy = d.y + Math.cos(d.phase + t * d.speed * 1.3) * 0.2 * (1 - frozen);
      const fz = Math.sin(d.x * 1.2 + t * (1.5 - frozen)) * Math.cos(d.y * 1.2 + t * (1.1 - frozen)) * amp;
      fp[i * 3] = fx; fp[i * 3 + 1] = fy; fp[i * 3 + 2] = fz;
    });
    fluctMesh.geometry.attributes.position.needsUpdate = true;

    // DM proyectado al 3D
    const dp = dmMesh.geometry.attributes.position.array;
    dmData.forEach((d, i) => {
      dp[i * 3]     = d.x + Math.sin(t * d.speed + d.phase) * 0.15;
      dp[i * 3 + 1] = d.y + Math.cos(t * d.speed * 1.2 + d.phase) * 0.15;
      dp[i * 3 + 2] = d.z + Math.sin(t * d.speed * 0.7 + d.phase) * 0.2;
    });
    dmMesh.geometry.attributes.position.needsUpdate = true;

    // Opacidad: al congelarse, la pared se vuelve "DE" (más transparente/estática)
    dwMat.opacity = 0.55 * (1 - frozen * 0.4) * (vis || 1);
    fluctMesh.material.opacity = 0.7 * (1 - frozen * 0.8) * (vis || 1);
    dmMesh.material.opacity = 0.6 * (vis || 1);
    dwMesh.scale.set(msc, msc, 1);
    dwMesh.visible = msc > 0.001;

    dwGroup.rotation.y = t * 0.05 * (1 - frozen * 0.5);
  }

  // ============================================================
  // CAPA 3 — VOLUMEN 3D + CONCIENCIA
  // Teorema de Ehrenfest: órbitas estables SOLO en 3D
  // Conciencia = recursividad (bucle causal cerrado)
  // ============================================================
  const volGroup = new THREE.Group();
  scene.add(volGroup);

  // Núcleo atómico
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 20),
    new THREE.MeshPhongMaterial({ color: COL[3], emissive: COL[3], emissiveIntensity: 0.6, shininess: 100 })
  );
  volGroup.add(nucleus);

  // Electrones en órbitas ESTABLES (solo en 3D)
  const ORBITS = [
    { r: 1.3, speed: 1.8, tilt: 0.3, n: 1 },
    { r: 2.0, speed: 1.2, tilt: 1.1, n: 2 },
    { r: 2.8, speed: 0.8, tilt: 2.0, n: 3 },
  ];
  const orbitRings = ORBITS.map(o => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(o.r, 0.018, 8, 80),
      new THREE.MeshBasicMaterial({ color: COL[3], transparent: true, opacity: 0.35 })
    );
    ring.rotation.x = o.tilt;
    ring.rotation.z = 0.5;
    volGroup.add(ring);
    return ring;
  });
  const electrons = ORBITS.map(o => {
    const e = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 14, 14),
      new THREE.MeshBasicMaterial({ color: COL[3] })
    );
    volGroup.add(e);
    return { mesh: e, o };
  });

  // "Recursividad" de la conciencia: bucle que se observa a sí mismo
  const recLoop = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.04, 16, 120),
    new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.4 })
  );
  recLoop.rotation.x = Math.PI / 2;
  volGroup.add(recLoop);

  // Esfera envolvente = domain wall cerrada (contorno 2D que guarda info 3D)
  const holoshell = new THREE.Mesh(
    new THREE.SphereGeometry(3.3, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0x9CA3D6, transparent: true, opacity: 0.08 })
  );
  const holowire = new THREE.Mesh(
    new THREE.SphereGeometry(3.3, 40, 40),
    new THREE.MeshBasicMaterial({ color: COL[2], wireframe: true, transparent: true, opacity: 0.35 })
  );
  volGroup.add(holoshell);
  volGroup.add(holowire);

  function updateVolume(t, vis, wrap3D) {
    const o = vis || 0;
    if (o < 0.01) {
      volGroup.children.forEach(c => c.visible = false); return;
    }
    volGroup.children.forEach(c => c.visible = true);

    const ws = Math.max(0, wrap3D || 0);

    // Núcleo y órbitas se encienden con wrap3D
    nucleus.visible = ws > 0.02;
    electrons.forEach(e => e.mesh.visible = ws > 0.02);
    orbitRings.forEach(r => { r.visible = ws > 0.02; r.material.opacity = 0.35 * o * ws; });

    // Electrones orbitando
    electrons.forEach((el, i) => {
      const a = t * el.o.speed + i;
      const x = el.o.r * Math.cos(a);
      const z = el.o.r * Math.sin(a);
      el.mesh.position.set(x, 0, z);
      el.mesh.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), el.o.tilt);
    });

    // Bucle de recursividad (conciencia): gira y pulsa
    recLoop.visible = ws > 0.1;
    recLoop.rotation.y = t * 0.8;
    recLoop.scale.setScalar(1 + 0.15 * Math.sin(t * 3) * ws);

    // Esfera envolvente (domain wall cerrada) crece con wrap3D
    const s = 0.2 + 0.8 * ws;
    holoshell.scale.setScalar(s);
    holowire.scale.setScalar(s);
    holoshell.material.opacity = (0.06 + 0.12 * ws) * o;
    holowire.material.opacity = (0.15 + 0.25 * ws) * o;
    holoshell.visible = ws > 0.02;
    holowire.visible = ws > 0.02;
    holowire.rotation.y = t * 0.08;
    holowire.rotation.x = t * 0.05;

    volGroup.rotation.y = t * 0.2;
  }

  // ============================================================
  // CAPA 4 — HIPERESFERA 4D (Kaluza-Klein)
  // Proyección 5D→4D: EM es sombra de gravedad 5D
  // σ frontera = DE (R₀ = 5.7 Gpc, σ ≈ 10⁻¹⁰ J/m²)
  // SO(10) = 1+2+3+4 = 10
  // ============================================================
  const hsGroup = new THREE.Group();
  scene.add(hsGroup);

  const HS_R = 4.8;
  const hsGeo = new THREE.SphereGeometry(HS_R, 56, 56);
  const hsMat = new THREE.MeshPhongMaterial({
    color: COL[4], wireframe: true, transparent: true, opacity: 0.3,
    emissive: COL[4], emissiveIntensity: 0.15
  });
  const hsMesh = new THREE.Mesh(hsGeo, hsMat);
  hsGroup.add(hsMesh);

  // Capas concéntricas (estructura SO(10) anidada)
  for (let i = 1; i <= 3; i++) {
    const sh = new THREE.Mesh(
      new THREE.SphereGeometry(HS_R * (1 - i * 0.05), 48, 48),
      new THREE.MeshBasicMaterial({ color: COL[4], wireframe: true, transparent: true, opacity: 0.04 })
    );
    hsGroup.add(sh);
  }

  // Rayos KK: EM proyectado 5D→4D (partículas que viajan hacia el centro)
  const rayC = 200;
  const rayGeo = new THREE.BufferGeometry();
  const rayPos = new Float32Array(rayC * 3);
  const rayData = [];
  for (let i = 0; i < rayC; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    rayData.push({ th, ph, speed: 0.35 + Math.random() * 0.5, off: Math.random() * 40 });
  }
  rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPos, 3));
  const rayMat = new THREE.PointsMaterial({ color: COL[4], size: 0.06, transparent: true, opacity: 0.85 });
  const rays = new THREE.Points(rayGeo, rayMat);
  hsGroup.add(rays);

  // Campo EM visible: ondas que se propagan desde la hiperesfera hacia dentro
  const emCount = 80;
  const emGeo = new THREE.BufferGeometry();
  const emPos = new Float32Array(emCount * 3);
  const emData = [];
  for (let i = 0; i < emCount; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    emData.push({ th, ph, r: HS_R * (0.5 + Math.random() * 0.5), speed: 0.8 + Math.random() * 1.2 });
  }
  emGeo.setAttribute('position', new THREE.BufferAttribute(emPos, 3));
  const emMat = new THREE.PointsMaterial({ color: 0xffeb3b, size: 0.05, transparent: true, opacity: 0.7 });
  const emMesh = new THREE.Points(emGeo, emMat);
  hsGroup.add(emMesh);

  function updateHypersphere(t, vis) {
    const o = vis || 0;
    if (o < 0.01) { hsGroup.children.forEach(c => c.visible = false); return; }
    hsGroup.children.forEach(c => c.visible = true);

    hsMesh.rotation.x = t * 0.06;
    hsMesh.rotation.y = t * 0.1;
    hsMesh.material.opacity = 0.3 * o;

    // Rayos KK
    const rp = rays.geometry.attributes.position.array;
    const up = new THREE.Vector3();
    for (let i = 0; i < rayC; i++) {
      const rd = rayData[i];
      const frac = (t * rd.speed + rd.off) % 1;
      const rad = HS_R * Math.pow(1 - frac, 1.3);
      up.set(Math.sin(rd.ph) * Math.cos(rd.th), Math.sin(rd.ph) * Math.sin(rd.th), Math.cos(rd.ph));
      rp[i * 3] = up.x * rad; rp[i * 3 + 1] = up.y * rad; rp[i * 3 + 2] = up.z * rad;
    }
    rays.geometry.attributes.position.needsUpdate = true;
    rays.material.opacity = 0.85 * o;

    // Campo EM (proyección KK)
    const ep = emMesh.geometry.attributes.position.array;
    emData.forEach((d, i) => {
      const r = d.r * (0.9 + 0.1 * Math.sin(t * d.speed));
      const x = r * Math.sin(d.ph) * Math.cos(d.th + t * d.speed * 0.5);
      const y = r * Math.sin(d.ph) * Math.sin(d.th + t * d.speed * 0.5);
      const z = r * Math.cos(d.ph);
      ep[i * 3] = x; ep[i * 3 + 1] = y; ep[i * 3 + 2] = z;
    });
    emMesh.geometry.attributes.position.needsUpdate = true;
    emMesh.material.opacity = 0.7 * o;

    hsGroup.rotation.y = t * 0.015;
  }

  // ============================================================
  // ESTRELLAS DE FONDO
  // ============================================================
  const starCount = 1100;
  const sG = new THREE.BufferGeometry();
  const sP = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 12 + Math.random() * 50;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    sP[i * 3] = r * Math.sin(ph) * Math.cos(th);
    sP[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    sP[i * 3 + 2] = r * Math.cos(ph);
  }
  sG.setAttribute('position', new THREE.BufferAttribute(sP, 3));
  const stars = new THREE.Points(sG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.4 }));
  scene.add(stars);

  // ============================================================
  // ESTADO Y NAVEGACIÓN
  // ============================================================
  const SCENES = {
    intro: { show: [1, 2, 3, 4], zoom: 34, membraneScale: 1, wrap3D: 1, stringShow: 0.9 },
    1:     { show: [1],          zoom: 6.5, membraneScale: 0, wrap3D: 0, stringShow: 1 },
    2:     { show: [1, 2],        zoom: 11, membraneScale: 1, wrap3D: 0, stringShow: 0.9 },
    3:     { show: [1, 2, 3],     zoom: 17, membraneScale: 1, wrap3D: 1, stringShow: 0.85 },
    4:     { show: [1, 2, 3, 4],  zoom: 26, membraneScale: 1, wrap3D: 1, stringShow: 0.8 },
    5:     { show: [1, 2, 3, 4],  zoom: 34, membraneScale: 1, wrap3D: 1, stringShow: 0.85 },
    6:     { show: [1, 2, 3, 4],  zoom: 34, membraneScale: 1, wrap3D: 1, stringShow: 0.85 },
    7:     { show: [1, 2, 3, 4],  zoom: 22, membraneScale: 1, wrap3D: 1, stringShow: 0.8 },
    8:     { show: [1, 2, 3, 4],  zoom: 34, membraneScale: 1, wrap3D: 1, stringShow: 0.85 },
    9:     { show: [1, 2, 3, 4],  zoom: 34, membraneScale: 1, wrap3D: 1, stringShow: 0.85 },
  };

  const state = { active: 'intro', targetZoom: 34, vis: { 1: 0.9, 2: 0.9, 3: 0.8, 4: 0.7 }, membraneScale: 1, wrap3D: 1, stringShow: 0.9, mouseX: 0, mouseY: 0 };
  const soft = { zoom: 34, vis1: 0.9, vis2: 0.9, vis3: 0.8, vis4: 0.7, membraneScale: 1, wrap3D: 1, stringShow: 0.9 };

  window.addEventListener('mousemove', (e) => { state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2; state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2; });

  function onSectionChange(e) {
    const map = { intro: 'intro', dim1: '1', dim2: '2', dim3: '3', dim4: '4', dim5: '5', dim6: '6', dim7: '7', dim8: '8', dim9: '9' };
    const key = map[e.detail.id] || 'intro';
    const s = SCENES[key] || SCENES.intro;
    state.active = key;
    state.targetZoom = s.zoom;
    const has = {}; [1, 2, 3, 4].forEach(n => { has[n] = s.show.includes(n) ? 1 : 0; });
    state.vis = has;
    state.membraneScale = s.membraneScale;
    state.wrap3D = s.wrap3D;
    state.stringShow = s.stringShow;
  }
  window.addEventListener('sectionchange', onSectionChange);

  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

  // ============================================================
  // LOOP PRINCIPAL
  // ============================================================
  let last = performance.now();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    const t = now / 1000;
    last = now;

    soft.zoom = ease(soft.zoom, state.targetZoom, 2.2, dt);
    soft.vis1 = ease(soft.vis1, state.vis[1] || 0, 3, dt);
    soft.vis2 = ease(soft.vis2, state.vis[2] || 0, 3, dt);
    soft.vis3 = ease(soft.vis3, state.vis[3] || 0, 3, dt);
    soft.vis4 = ease(soft.vis4, state.vis[4] || 0, 3, dt);
    soft.membraneScale = ease(soft.membraneScale, state.membraneScale, 2.5, dt);
    soft.wrap3D = ease(soft.wrap3D, state.wrap3D, 2.2, dt);
    soft.stringShow = ease(soft.stringShow, state.stringShow, 2.5, dt);

    camera.position.z = ease(camera.position.z, soft.zoom, 2.2, dt);
    camera.position.x = ease(camera.position.x, state.mouseX * 1.3, 2, dt);
    camera.position.y = ease(camera.position.y, -state.mouseY * 0.8, 2, dt);
    camera.lookAt(0, 0, 0);

    updateString(t, soft.vis1, soft.wrap3D, soft.stringShow);
    updateDW(t, soft.vis2, soft.membraneScale, soft.wrap3D);
    updateVolume(t, soft.vis3, soft.wrap3D);
    updateHypersphere(t, soft.vis4);

    stars.rotation.y = t * 0.018;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

})(window, document);