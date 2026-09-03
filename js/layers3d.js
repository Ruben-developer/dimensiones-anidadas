/* ============================================================
   Dimensiones Anidadas — layers3d.js
   Visualización Three.js con NARRATIVA HOLOGRÁFICA.

   La escena crece siguiendo el scroll / la sección activa:
     1D → solo la cuerda vibrando
     2D → la cuerda barre y GENERA una membrana
     3D → la membrana se cierra envolviendo un volumen interior
     4D → el volumen queda envuelto por la hiperesfera que proyecta fuerzas

   De este modo la visualización cuenta la historia del modelo:
   la información viaja de capa en capa (principio holográfico).
   ============================================================ */

(function (window, document) {
  'use strict';

  if (typeof window.THREE === 'undefined') return;

  const THREE = window.THREE;

  const COL = {
    1: 0x8B5CF6, 2: 0x3B82F6, 3: 0x10B981, 4: 0xF59E0B
  };
  const COL_HEX = {
    1: '#8B5CF6', 2: '#3B82F6', 3: '#10B981', 4: '#F59E0B'
  };

  const STRING_LEN = 6;      // longitud de la cuerda
  const STRING_SEG = 200;    // subdivisiones de la cuerda

  // ---------- Escenas: qué mostrar y a qué distancia ----------
  // "show": qué grupos están visibles.  "zoom": distancia cámara.
  // "membraneScale": hasta dónde crece la membrana (nace en la capa 2).
  // "wrap3D": cuánto se cierra la membrana en superficie 3D (0=abierta, 1=cerrada)
  const SCENES = {
    intro: { show: [1, 2, 3, 4], zoom: 34, membraneScale: 1, wrap3D: 1, stringShow: 0.8 },
    1:     { show: [1],          zoom: 5.5, membraneScale: 0, wrap3D: 0, stringShow: 1 },
    2:     { show: [1, 2],        zoom: 10,  membraneScale: 1, wrap3D: 0, stringShow: 0.9 },
    3:     { show: [1, 2, 3],     zoom: 16,  membraneScale: 1, wrap3D: 1, stringShow: 0.85 },
    4:     { show: [1, 2, 3, 4],  zoom: 25,  membraneScale: 1, wrap3D: 1, stringShow: 0.75 },
    5:     { show: [1, 2, 3, 4],  zoom: 34,  membraneScale: 1, wrap3D: 1, stringShow: 0.8 },
    6:     { show: [1, 2, 3, 4],  zoom: 34,  membraneScale: 1, wrap3D: 1, stringShow: 0.8 },
    7:     { show: [1, 2, 3, 4],  zoom: 24,  membraneScale: 1, wrap3D: 1, stringShow: 0.75 },
    8:     { show: [1, 2, 3, 4],  zoom: 34,  membraneScale: 1, wrap3D: 1, stringShow: 0.8 },
    9:     { show: [1, 2, 3, 4],  zoom: 34,  membraneScale: 1, wrap3D: 1, stringShow: 0.8 }
  };

  // ---------- Renderer + escena ----------
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

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight.position.set(6, 9, 12);
  scene.add(dirLight);
  const pointLight = new THREE.PointLight(0xffffff, 0.6, 50);
  pointLight.position.set(-4, -3, 8);
  scene.add(pointLight);

  function ease(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }

  // ============================================================
  // CAPA 1 — LA CUERDA VIBRANTE
  // ============================================================
  const stringGroup = new THREE.Group();
  scene.add(stringGroup);

  // Malla de la cuerda (tubo fino de grosor variable)
  const stringGeo = new THREE.BufferGeometry();
  const stringPos = new Float32Array(STRING_SEG * 3);
  stringGeo.setAttribute('position', new THREE.BufferAttribute(stringPos, 3));
  const stringMat = new THREE.PointsMaterial({ color: COL[1], size: 0.09, transparent: true, opacity: 0.95 });
  const stringMesh = new THREE.Points(stringGeo, stringMat);
  stringGroup.add(stringMesh);

  // Hilo continuo (linea con ancho) para que se lea como cuerda
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STRING_SEG * 3), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: COL[1], transparent: true, opacity: 0.9 });
  const lineMesh = new THREE.Line(lineGeo, lineMat);
  stringGroup.add(lineMesh);

  // Glow central
  const stringGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 24, 24),
    new THREE.MeshBasicMaterial({ color: COL[1], transparent: true, opacity: 0.22 })
  );
  stringGroup.add(stringGlow);

  // Partículas hijas (cada vibración = partícula)
  const childCount = 90;
  const childGeo = new THREE.BufferGeometry();
  const childPos = new Float32Array(childCount * 3);
  const childData = [];
  for (let i = 0; i < childCount; i++) {
    childData.push({
      dir: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.9,
      off: Math.random() * 20
    });
  }
  childGeo.setAttribute('position', new THREE.BufferAttribute(childPos, 3));
  const childMat = new THREE.PointsMaterial({ color: COL[1], size: 0.05, transparent: true, opacity: 0.85 });
  const childMesh = new THREE.Points(childGeo, childMat);
  stringGroup.add(childMesh);

  const dims = {
    1: {
      positions: stringPos, linePos: lineGeo.attributes.position.array,
      childPos, childData, childCount,
      glow: stringGlow
    }
  };

  function updateString(t, vis, wrap3D, stringShow) {
    const d = dims[1];
    // La amplitud crece cuando hay volumen alrededor (wrap3D): la cuerda
    // es el "esqueleto" que llena el interior del contorno superior.
    const exp = 1 + (wrap3D || 0) * 0.5;
    const amp = 0.8 * stringShow * exp;
    for (let i = 0; i < STRING_SEG; i++) {
      const u = (i / (STRING_SEG - 1) - 0.5) * STRING_LEN;
      // varios modos armónicos superpuestos
      const y = Math.sin(u * 1.6 + t * 2.2) * amp +
                Math.sin(u * 4.2 - t * 3.1) * 0.22 * amp;
      const z = Math.cos(u * 2.6 + t * 1.7) * 0.4 * amp +
                Math.sin(u * 6.1 + t * 4.0) * 0.12 * amp;
      d.positions[i * 3]     = u;
      d.positions[i * 3 + 1] = y;
      d.positions[i * 3 + 2] = z;
      d.linePos[i * 3]     = u;
      d.linePos[i * 3 + 1] = y;
      d.linePos[i * 3 + 2] = z;
    }
    stringGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;

    // Partículas
    for (let i = 0; i < d.childCount; i++) {
      const c = d.childData[i];
      const r = 0.7 + 1.1 * Math.abs(Math.sin(t * c.speed + c.off));
      const a = c.dir + t * 0.25;
      d.childPos[i * 3]     = Math.cos(a) * r;
      d.childPos[i * 3 + 1] = Math.sin(a) * r;
      d.childPos[i * 3 + 2] = Math.sin(c.off * 7 + t * c.speed * 0.6) * r * 0.8;
    }
    childGeo.attributes.position.needsUpdate = true;

    const o = vis ? vis : 1;
    stringMesh.material.opacity = 0.95 * o;
    lineMesh.material.opacity = 0.9 * o;
    childMesh.material.opacity = 0.85 * o;
    stringGlow.material.opacity = 0.22 * (wrap3D > 0.5 ? stringShow : 1) * o;
    stringGlow.scale.setScalar(1 + 0.25 * Math.sin(t * 4) * stringShow);

    stringGroup.rotation.y = t * 0.1;
    stringGroup.rotation.x = Math.sin(t * 0.25) * 0.12;
  }

  // ============================================================
  // CAPA 2 — LA MEMBRANA (domain wall) que NACE de la cuerda
  // ============================================================
  const membraneGroup = new THREE.Group();
  scene.add(membraneGroup);

  const M_SIZE = 5.5, M_SEG = 40;
  const membraneGeo = new THREE.PlaneGeometry(M_SIZE, M_SIZE, M_SEG, M_SEG);
  const membraneMat = new THREE.MeshPhongMaterial({
    color: COL[2], side: THREE.DoubleSide, transparent: true, opacity: 0.55,
    emissive: COL[2], emissiveIntensity: 0.25, shininess: 45
  });
  const membrane = new THREE.Mesh(membraneGeo, membraneMat);
  membrane.scale.set(0.0001, 0.0001, 1); // nace pequeña
  membraneGroup.add(membrane);

  // Puntos de fluctuación sobre la membrana
  const mPtsGeo = new THREE.BufferGeometry();
  const mPtsCount = 50 * 50;
  const mPtsPos = new Float32Array(mPtsCount * 3);
  mPtsGeo.setAttribute('position', new THREE.BufferAttribute(mPtsPos, 3));
  const mPtsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.7 });
  const mPts = new THREE.Points(mPtsGeo, mPtsMat);
  membraneGroup.add(mPts);

  const mVert = membraneGeo.attributes.position;
  dims[2] = { membrane, mVert, mPts, mPtsPos, mPtsCount, M_SIZE, M_SEG };

  function updateMembrane(t, vis, membraneScale, wrap3D) {
    const d = dims[2];
    const o = vis ? vis : 1;

    // La membrana "nace y crece" desde la cuerda (escala)
    const msc = Math.max(0.0001, membraneScale || 0.0001);
    // en la capa 2 queda abierta (plano); en la 3+ se cierra sobre un volumen (ver escala y pos)
    membrane.scale.set(msc, msc, 1);

    // Ondulación
    const amp = 0.35;
    const p = d.mVert.array;
    for (let i = 0; i <= M_SEG; i++) {
      for (let j = 0; j <= M_SEG; j++) {
        const idx = (i * (M_SEG + 1) + j) * 3;
        const x = (i / M_SEG - 0.5) * M_SIZE;
        const y = (j / M_SEG - 0.5) * M_SIZE;
        // ondas viajeras
        let z = Math.sin(x * 1.4 + t * 1.6) * Math.cos(y * 1.4 + t * 1.2) * amp;
        z += Math.sin((x + y) * 3 + t * 3) * 0.08;
        p[idx]     = x;
        p[idx + 1] = y;
        p[idx + 2] = z;
      }
    }
    d.mVert.needsUpdate = true;
    // Recalcular normales para el material Phong (en r128 es método de la geometría)
    try {
      membraneGeo.computeVertexNormals();
    } catch (e) { /* ignorar */ }

    // Puntos sobre la membrana
    const sp = d.mPtsPos;
    for (let i = 0; i < 50; i++) {
      for (let j = 0; j < 50; j++) {
        const idx = (i * 50 + j) * 3;
        const x = (i / 49 - 0.5) * M_SIZE;
        const y = (j / 49 - 0.5) * M_SIZE;
        const z = Math.sin(x * 1.4 + t * 1.6) * Math.cos(y * 1.4 + t * 1.2) * amp;
        sp[idx]     = x;
        sp[idx + 1] = y;
        sp[idx + 2] = z;
      }
    }
    mPtsGeo.attributes.position.needsUpdate = true;

    // A medida que la membrana se cierra (wrap3D→1) sobre un volumen,
    // el plano se repliega/atenúa y la esfera envolvente (holoshell/holowire)
    // toma el relevo como la domain-wall cerrada. Transición suave.
    const planarFade = Math.max(0, 1 - wrap3D * 1.4);
    membraneMat.opacity = (0.55 * planarFade) * o;
    mPtsMat.opacity = (0.7 * planarFade) * o;
    membrane.visible = planarFade > 0.02;
    mPts.visible = planarFade > 0.02;

    // Separación de domain walls determina masas → leve rotación
    membraneGroup.rotation.y = t * 0.08;
    membraneGroup.rotation.z = Math.sin(t * 0.2) * 0.05;
  }

  // ============================================================
  // CAPA 3 — EL VOLUMEN (sistema interior envuelto por la membrana)
  // ============================================================
  const volumeGroup = new THREE.Group();
  scene.add(volumeGroup);

  // Núcleo central (materia estable 3D)
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 20, 20),
    new THREE.MeshPhongMaterial({ color: COL[3], emissive: COL[3], emissiveIntensity: 0.5, shininess: 90 })
  );
  volumeGroup.add(core);

  // Órbitas estables (teorema de Ehrenfest)
  const ORBITS = [
    { r: 1.2, speed: 1.6, tilt: 0.4 },
    { r: 1.9, speed: 1.1, tilt: 1.3 },
    { r: 2.6, speed: 0.75, tilt: 2.2 }
  ];
  const orbitRings = ORBITS.map((o) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(o.r, 0.02, 8, 72),
      new THREE.MeshBasicMaterial({ color: COL[3], transparent: true, opacity: 0.4 })
    );
    ring.rotation.x = o.tilt;
    ring.rotation.z = 0.4;
    volumeGroup.add(ring);
    return ring;
  });
  const electrons = ORBITS.map((o) => {
    const e = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: COL[3] })
    );
    e.material.color = new THREE.Color(COL_HEX[3]);
    volumeGroup.add(e);
    return { mesh: e, o };
  });

  // Frontera "holográfica": la info del 3D vive en el 2D que lo envuelve.
  // Esta esfera ES la domain wall cerrada (contorno 2D convertido en superficie).
  // Usa color azul (2D) para que se lea como la misma membrana que se replegó.
  const holoshell = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0x9CA3D6, wireframe: false, transparent: true, opacity: 0.10 })
  );
  volumeGroup.add(holoshell);

  // Rejilla de la domain wall cerrada (azul, contorno 2D)
  const holowire = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 40, 40),
    new THREE.MeshBasicMaterial({ color: COL[2], wireframe: true, transparent: true, opacity: 0.35 })
  );
  volumeGroup.add(holowire);

  dims[3] = { core, electrons, orbitRings, holoshell, holowire };

  function updateVolume(t, vis, wrap3D) {
    const d = dims[3];
    const o = vis ? vis : 1;

    const ws = Math.max(0, wrap3D || 0);
    // El volumen (núcleo + órbitas) solo es visible cuando la membrana
    // se cierra (wrap3D → 1): es la materia estable del interior 3D.
    core.visible = ws > 0.05;
    d.orbitRings.forEach((r) => { r.visible = ws > 0.05; });
    d.electrons.forEach((el) => { el.mesh.visible = ws > 0.05; });

    // La esfera envolvente ("domain wall" cerrada que guarda la info 3D):
    // crece y se ilumina a medida que la membrana envuelve.
    const shellScale = 0.2 + 0.8 * ws;
    holoshell.scale.setScalar(shellScale);
    holowire.scale.setScalar(shellScale);
    holoshell.material.opacity = (0.08 + 0.15 * ws) * o;
    holowire.material.opacity = (0.1 + 0.3 * ws) * o;
    holoshell.visible = ws > 0.02;
    holowire.visible = ws > 0.02;

    holowire.rotation.x = t * 0.1;
    holowire.rotation.y = t * 0.14;

    // electrones orbitando
    d.electrons.forEach((el, i) => {
      const a = t * el.o.speed + i;
      const x = el.o.r * Math.cos(a);
      const z = el.o.r * Math.sin(a);
      el.mesh.position.set(x, 0, z);
      el.mesh.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), el.o.tilt);
    });

    d.orbitRings.forEach((ring, i) => {
      ring.material.opacity = 0.4 * o;
    });

    core.scale.setScalar(1 + 0.08 * Math.sin(t * 3));
    volumeGroup.rotation.y = t * 0.25;
  }

  // ============================================================
  // CAPA 4 — LA HIPERESFERA (proyecta fuerzas hacia dentro)
  // ============================================================
  const hypersphereGroup = new THREE.Group();
  scene.add(hypersphereGroup);

  const HS_R = 4.6;
  const hypersphere = new THREE.Mesh(
    new THREE.SphereGeometry(HS_R, 48, 48),
    new THREE.MeshPhongMaterial({
      color: COL[4], wireframe: true, transparent: true, opacity: 0.28,
      emissive: COL[4], emissiveIntensity: 0.2
    })
  );
  hypersphereGroup.add(hypersphere);

  // Conchas internas (evocación de hiperespacio)
  for (let i = 1; i <= 3; i++) {
    const sh = new THREE.Mesh(
      new THREE.SphereGeometry(HS_R * (1 - i * 0.06), 40, 40),
      new THREE.MeshBasicMaterial({ color: COL[4], wireframe: true, transparent: true, opacity: 0.05 })
    );
    hypersphereGroup.add(sh);
  }

  // Rayos de proyección 4D→3D (partículas que viajan hacia el centro)
  const rayCount = 160;
  const rayGeo = new THREE.BufferGeometry();
  const rayPos = new Float32Array(rayCount * 3);
  const rayData = [];
  for (let i = 0; i < rayCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    rayData.push({ theta, phi, speed: 0.4 + Math.random() * 0.7, off: Math.random() * 30 });
  }
  rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPos, 3));
  const rayMat = new THREE.PointsMaterial({ color: COL[4], size: 0.06, transparent: true, opacity: 0.9 });
  const rays = new THREE.Points(rayGeo, rayMat);
  hypersphereGroup.add(rays);

  dims[4] = { hypersphere, rays, rayData, rayCount, HS_R };

  function updateHypersphere(t, vis) {
    const d = dims[4];
    const o = vis ? vis : 1;

    d.hypersphere.rotation.x = t * 0.08;
    d.hypersphere.rotation.y = t * 0.12;
    d.hypersphere.material.opacity = 0.28 * o;

    // rayos viajan del borde hacia el centro
    const rp = d.rays.geometry.attributes.position.array;
    const up = new THREE.Vector3();
    for (let i = 0; i < d.rayCount; i++) {
      const rd = d.rayData[i];
      const frac = (t * rd.speed + rd.off) % 1;
      const rad = d.HS_R * Math.pow(1 - frac, 1.2);
      up.set(
        Math.sin(rd.phi) * Math.cos(rd.theta),
        Math.sin(rd.phi) * Math.sin(rd.theta),
        Math.cos(rd.phi)
      );
      rp[i * 3]     = up.x * rad;
      rp[i * 3 + 1] = up.y * rad;
      rp[i * 3 + 2] = up.z * rad;
    }
    d.rays.geometry.attributes.position.needsUpdate = true;
    d.rays.material.opacity = 0.9 * o;

    hypersphereGroup.rotation.y = t * 0.02;
  }

  // ============================================================
  // Estrellas de fondo
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
  const stars = new THREE.Points(sG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.45 }));
  scene.add(stars);

  // ============================================================
  // Estado y navegación
  // ============================================================
  const state = {
    active: 'intro',
    targetZoom: 34,
    vis: { 1: 0.8, 2: 0.8, 3: 0.8, 4: 0.5 },
    membraneScale: 1,
    wrap3D: 1,
    stringShow: 0.8,
    mouseX: 0, mouseY: 0
  };

  window.addEventListener('mousemove', (e) => {
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const soft = {
    zoom: 34,
    vis1: 0.8, vis2: 0.8, vis3: 0.8, vis4: 0.5,
    membraneScale: 1, wrap3D: 1, stringShow: 0.8
  };

  function onSectionChange(e) {
    const map = { intro: 'intro', dim1: '1', dim2: '2', dim3: '3', dim4: '4', dim5: '5', dim6: '6', dim7: '7', dim8: '8', dim9: '9' };
    const key = map[e.detail.id] || 'intro';
    const s = SCENES[key] || SCENES.intro;
    state.active = key;
    state.targetZoom = s.zoom;
    // targets de visibilidad por grupo (0 si no se muestra)
    const has = {};
    [1, 2, 3, 4].forEach((n) => { has[n] = s.show.includes(n) ? 1 : 0; });
    state.vis = has;
    state.membraneScale = s.membraneScale;
    state.wrap3D = s.wrap3D;
    state.stringShow = s.stringShow;
  }
  window.addEventListener('sectionchange', onSectionChange);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ============================================================
  // Loop principal
  // ============================================================
  let last = performance.now();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    const t = now / 1000;
    last = now;

    // suavizar
    soft.zoom = ease(soft.zoom, state.targetZoom, 2.2, dt);
    soft.vis1 = ease(soft.vis1, state.vis[1] || 0, 3, dt);
    soft.vis2 = ease(soft.vis2, state.vis[2] || 0, 3, dt);
    soft.vis3 = ease(soft.vis3, state.vis[3] || 0, 3, dt);
    soft.vis4 = ease(soft.vis4, state.vis[4] || 0, 3, dt);
    soft.membraneScale = ease(soft.membraneScale, state.membraneScale, 2.5, dt);
    soft.wrap3D = ease(soft.wrap3D, state.wrap3D, 2.2, dt);
    soft.stringShow = ease(soft.stringShow, state.stringShow, 2.5, dt);

    // cámara con parallax por mouse
    camera.position.z = ease(camera.position.z, soft.zoom, 2.2, dt);
    camera.position.x = ease(camera.position.x, state.mouseX * 1.3, 2, dt);
    camera.position.y = ease(camera.position.y, -state.mouseY * 0.8, 2, dt);
    camera.lookAt(0, 0, 0);

    updateString(t, soft.vis1, soft.wrap3D, soft.stringShow);
    updateMembrane(t, soft.vis2, soft.membraneScale, soft.wrap3D);
    updateVolume(t, soft.vis3, soft.wrap3D);
    updateHypersphere(t, soft.vis4);

    stars.rotation.y = t * 0.02;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

})(window, document);
