/* ============================================================
   Dimensiones Anidadas — layers3d.js
   EVOLUCIÓN VISUAL CONTINUA: cuerda → membrana → volumen → hiperesfera

   Un solo parámetro t ∈ [0,1] controla toda la morfosis:
   t ∈ [0, 0.25]   → 1D: cuerda vibrando
   t ∈ [0.25,0.5]  → 2D: la cuerda barre y SU trayectoria SE CONVIERTE en la membrana
   t ∈ [0.5, 0.75] → 3D: la membrana se ENVUELVE cerrándose en esfera conteniendo el volumen
   t ∈ [0.75, 1]   → 4D: el volumen queda dentro de la hiperesfera con proyección KK
   ============================================================ */

(function (window, document) {
  'use strict';

  if (typeof window.THREE === 'undefined') return;

  const THREE = window.THREE;

  // Colores ontológicos
  const C1 = 0x8B5CF6, C2 = 0x3B82F6, C3 = 0x10B981, C4 = 0xF59E0B;

  // ---------- Renderer ----------
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none';
  holder.id = 'bg-3d';
  document.body.prepend(holder);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (e) { holder.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 28);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dl = new THREE.DirectionalLight(0xffffff, 0.9);
  dl.position.set(8, 12, 15); scene.add(dl);

  function ease(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }

  // ============================================================
  // GEOMETRÍA BASE: una curva paramétrica que servirá de "hilo"
  // para la cuerda, el barrido de la membrana, y el contorno final
  // ============================================================
  const CURVE_SEG = 300;
  const L = 4.5; // longitud de la cuerda

  // Curva base: una línea en X que vibra en Y,Z
  function getCurvePoints(t, amp) {
    const pts = [];
    for (let i = 0; i <= CURVE_SEG; i++) {
      const u = i / CURVE_SEG; // 0..1
      const x = (u - 0.5) * L;
      const phase = x * 2.5 + t * 3;
      const y = Math.sin(phase) * amp;
      const z = Math.cos(phase * 1.7) * amp * 0.6;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }

  // ============================================================
  // OBJETOS VISUALES (creados una vez, animados por t)
  // ============================================================

  // --- 1. La CUERDA (puntos + línea) ---
  const stringGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array((CURVE_SEG + 1) * 3);
  stringGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const stringMat = new THREE.PointsMaterial({ color: C1, size: 0.05, transparent: true, opacity: 1 });
  const stringPts = new THREE.Points(stringGeo, stringMat);
  scene.add(stringPts);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((CURVE_SEG + 1) * 3), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: C1, transparent: true, opacity: 0.9 });
  const stringLine = new THREE.Line(lineGeo, lineMat);
  scene.add(stringLine);

  // Partículas que "emanan" de la cuerda (modos = partículas)
  const nParts = 16;
  const partGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(nParts * 3);
  partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const partMat = new THREE.PointsMaterial({ color: C1, size: 0.12, transparent: true, opacity: 0.9 });
  const partMesh = new THREE.Points(partGeo, partMat);
  scene.add(partMesh);

  // Etiquetas partículas HTML
  const partLabels = ['e⁻','u','d','ν','μ','τ','s','c','b','t','W','Z','H','γ','g','νₘ'];
  const partEls = partLabels.slice(0, nParts).map((txt, i) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;color:#8B5CF6;font-size:11px;font-weight:600;pointer-events:none;white-space:nowrap;z-index:10;text-shadow:0 0 4px #000';
    el.textContent = txt;
    document.body.appendChild(el);
    return { el, baseX: (i - nParts/2) * 0.4, phase: i * 0.8 };
  });

  // --- 2. La MEMBRANA (barrido de la cuerda) ---
  // Geometría: una "cinta" que se genera barrido de la curva
  const MEM_W = 48;  // resolución angular (barrido)
  const MEM_H = 60;  // resolución longitudinal (a lo largo de la cuerda)
  const memGeo = new THREE.BufferGeometry();
  const mPos = new Float32Array(MEM_W * MEM_H * 3);
  const mNor = new Float32Array(MEM_W * MEM_H * 3);
  const mUV  = new Float32Array(MEM_W * MEM_H * 2);
  memGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  memGeo.setAttribute('normal', new THREE.BufferAttribute(mNor, 3));
  memGeo.setAttribute('uv', new THREE.BufferAttribute(mUV, 2));

  const memMat = new THREE.MeshPhongMaterial({
    color: C2, side: THREE.DoubleSide, transparent: true, opacity: 0,
    emissive: C2, emissiveIntensity: 0.2, shininess: 60
  });
  const memMesh = new THREE.Mesh(memGeo, memMat);
  scene.add(memMesh);

  // Puntos de fluctuación sobre la membrana (DM)
  const nFluct = 80 * 80;
  const flGeo = new THREE.BufferGeometry();
  const flPos = new Float32Array(nFluct * 3);
  flGeo.setAttribute('position', new THREE.BufferAttribute(flPos, 3));
  const flMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0 });
  const flMesh = new THREE.Points(flGeo, flMat);
  scene.add(flMesh);

  // DM proyectado al 3D (puntos que emergen)
  const nDM = 180;
  const dmGeo = new THREE.BufferGeometry();
  const dmPos = new Float32Array(nDM * 3);
  dmGeo.setAttribute('position', new THREE.BufferAttribute(dmPos, 3));
  const dmMat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.07, transparent: true, opacity: 0 });
  const dmMesh = new THREE.Points(dmGeo, dmMat);
  scene.add(dmMesh);

  // --- 3. EL VOLUMEN 3D (núcleo + órbitas + recursividad) ---
  const volGroup = new THREE.Group();
  scene.add(volGroup);

  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 24),
    new THREE.MeshPhongMaterial({ color: C3, emissive: C3, emissiveIntensity: 0.6, shininess: 100 })
  );
  nucleus.visible = false; volGroup.add(nucleus);

  const ORBITS = [
    { r: 1.3, speed: 1.8, tilt: 0.3 },
    { r: 2.0, speed: 1.2, tilt: 1.1 },
    { r: 2.8, speed: 0.8, tilt: 2.0 },
  ];
  const electrons = ORBITS.map(o => {
    const e = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 14, 14),
      new THREE.MeshBasicMaterial({ color: C3 })
    );
    e.visible = false; volGroup.add(e);
    return { mesh: e, o };
  });
  const orbitRings = ORBITS.map(o => {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(o.r, 0.018, 8, 80),
      new THREE.MeshBasicMaterial({ color: C3, transparent: true, opacity: 0 })
    );
    r.rotation.x = o.tilt; r.visible = false; volGroup.add(r);
    return r;
  });

  // Bucle recursividad (conciencia)
  const recLoop = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.04, 16, 120),
    new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0 })
  );
  recLoop.rotation.x = Math.PI / 2; recLoop.visible = false; volGroup.add(recLoop);

  // Esfera envolvente = domain wall cerrada (contorno 2D que se cierra)
  const holoshell = new THREE.Mesh(
    new THREE.SphereGeometry(3.3, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0x9CA3D6, transparent: true, opacity: 0 })
  );
  const holowire = new THREE.Mesh(
    new THREE.SphereGeometry(3.3, 40, 40),
    new THREE.MeshBasicMaterial({ color: C2, wireframe: true, transparent: true, opacity: 0 })
  );
  holoshell.visible = false; holowire.visible = false;
  volGroup.add(holoshell); volGroup.add(holowire);

  // --- 4. LA HIPERESFERA 4D ---
  const hsGroup = new THREE.Group(); scene.add(hsGroup);
  const HS_R = 5.2;
  const hsMesh = new THREE.Mesh(
    new THREE.SphereGeometry(5.2, 56, 56),
    new THREE.MeshPhongMaterial({ color: C4, wireframe: true, transparent: true, opacity: 0, emissive: C4, emissiveIntensity: 0.15 })
  );
  hsGroup.add(hsMesh);

  // Rayos KK
  const nRay = 160;
  const rayGeo = new THREE.BufferGeometry();
  const rayPos = new Float32Array(nRay * 3);
  rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPos, 3));
  const rayData = [];
  for (let i = 0; i < nRay; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    rayData.push({ th, ph, speed: 0.35 + Math.random() * 0.5, off: Math.random() * 40 });
  }
  rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPos, 3));
  const rayMat = new THREE.PointsMaterial({ color: C4, size: 0.06, transparent: true, opacity: 0 });
  const rayMesh = new THREE.Points(rayGeo, rayMat);
  hsGroup.add(rayMesh);

  // EM proyectado
  const nEM = 100;
  const emGeo = new THREE.BufferGeometry();
  const emPos = new Float32Array(nEM * 3);
  emGeo.setAttribute('position', new THREE.BufferAttribute(emPos, 3));
  const emData = [];
  for (let i = 0; i < nEM; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    emData.push({ th, ph, r: 2.6 + Math.random() * 1.8, speed: 0.8 + Math.random() * 1.2 });
  }
  emGeo.setAttribute('position', new THREE.BufferAttribute(emPos, 3));
  const emMat = new THREE.PointsMaterial({ color: 0xffeb3b, size: 0.05, transparent: true, opacity: 0 });
  const emMesh = new THREE.Points(emGeo, emMat);
  hsGroup.add(emMesh);

  // --- Estrellas fondo ---
  const sG = new THREE.BufferGeometry();
  const sP = new Float32Array(1000 * 3);
  for (let i = 0; i < 1000; i++) {
    const r = 12 + Math.random() * 50, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    sP[i*3] = r * Math.sin(ph) * Math.cos(th);
    sP[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    sP[i*3+2] = r * Math.cos(ph);
  }
  sG.setAttribute('position', new THREE.BufferAttribute(sP, 3));
  scene.add(new THREE.Points(sG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.4 })));

  // ============================================================
  // MAPEO SCROLL → t (0 a 1 continuo)
  // Cada sección ocupa un rango de t
  // ============================================================
  const SECTION_T = {
    intro:  0.00,
    dim1:   0.125,   // 1D: cuerda pura
    dim2:   0.375,   // 2D: barrido→membrana
    dim3:   0.625,   // 3D: membrana→volumen
    dim4:   0.875,   // 4D: hiperesfera
    dim5:   0.875, dim6: 0.875, dim7: 0.875, dim8: 0.875, dim9: 1.0
  };

  // Estado de animación suave
  const state = { targetT: 0, t: 0 };
  const ZOOM_BASE = { intro: 30, dim1: 7, dim2: 10, dim3: 15, dim4: 24 };

  window.addEventListener('sectionchange', e => {
    const map = { intro: 'intro', dim1: '1', dim2: '2', dim3: '3', dim4: '4', dim5: '5', dim6: '6', dim7: '7', dim8: '8', dim9: '9' };
    const key = map[e.detail.id] || 'intro';
    state.targetT = SECTION_T[key] || 0;
    state.targetZoom = ZOOM_BASE[key] || 30;
  });

  window.addEventListener('mousemove', e => {
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ============================================================
  // FUNCIÓN PRINCIPAL: dado t ∈ [0,1], actualiza TODO
  // ============================================================
  function updateAll(t) {
    // --- Parámetros suaves por fase ---
    // Fase 1: 0→0.25  cuerda pura
    // Fase 2: 0.25→0.5  barrido→membrana
    // Fase 3: 0.5→0.75  membrana→esfera+volumen
    // Fase 4: 0.75→1  hiperesfera

    const p1 = THREE.MathUtils.clamp((t - 0) / 0.25, 0, 1);      // cuerda visible
    const p2 = THREE.MathUtils.clamp((t - 0.25) / 0.25, 0, 1);    // membrana crece
    const p3 = THREE.MathUtils.clamp((t - 0.5) / 0.25, 0, 1);     // membrana→volumen
    const p4 = THREE.MathUtils.clamp((t - 0.75) / 0.25, 0, 1);    // hiperesfera

    // --- 1. CUERDA ---
    const curveAmp = 0.55 * (1 + p3 * 0.3); // crece un poco en fases 3-4
    const pts = getCurvePoints(t * 4, curveAmp);
    for (let i = 0; i <= CURVE_SEG; i++) {
      const v = pts[i];
      sPos[i*3] = v.x; sPos[i*3+1] = v.y; sPos[i*3+2] = v.z;
      lineGeo.attributes.position.array[i*3] = v.x;
      lineGeo.attributes.position.array[i*3+1] = v.y;
      lineGeo.attributes.position.array[i*3+2] = v.z;
    }
    stringGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;

    stringPts.material.opacity = p1 > 0 ? 1 : 0;
    stringLine.material.opacity = p1 > 0 ? 0.9 : 0;
    stringPts.visible = p1 > 0.01;
    stringLine.visible = p1 > 0.01;

    // Partículas (modos = partículas)
    for (let i = 0; i < nParts; i++) {
      const base = partEls[i].baseX;
      const phase = partEls[i].phase;
      const y = Math.sin(t * 5 + phase) * 0.3;
      pPos[i*3] = base; pPos[i*3+1] = y; pPos[i*3+2] = 0;
      if (partEls[i].el) {
        const v = new THREE.Vector3(base, y + 0.5, 0).project(camera);
        partEls[i].el.style.transform = `translate(${(v.x*0.5+0.5)*innerWidth}px, ${(-v.y*0.5+0.5)*innerHeight}px)`;
        partEls[i].el.style.opacity = String(p1 * 0.9);
      }
    }
    partGeo.attributes.position.needsUpdate = true;
    partMesh.material.opacity = p1;
    partMesh.visible = p1 > 0.01;

    // --- 2. MEMBRANA (barrido de la curva) ---
    // La membrana ES el barrido de la curva: una "cinta" que sigue la curva
    if (p2 > 0.01) {
      memMesh.visible = true; memMesh.material.opacity = 0.55 * p2;
      flMesh.visible = true; flMesh.material.opacity = 0.7 * p2 * (1 - THREE.MathUtils.clamp((t-0.5)/0.25, 0, 1));
      dmMesh.visible = true; dmMesh.material.opacity = 0.6 * p2;

      // Generar membrana como superficie de revolución/barrido de la curva
      for (let j = 0; j < MEM_H; j++) {
        const u = j / (MEM_H - 1); // 0..1 a lo largo de la curva
        const curveT = t * 4;
        const amp = 0.55;
        // Posición base en la curva
        const cx = (u - 0.5) * L;
        const cy = Math.sin(cx * 2.5 + curveT * 3) * amp;
        const cz = Math.cos(cx * 2.5 * 1.7 + curveT * 3) * amp * 0.6;

        for (let i = 0; i < MEM_W; i++) {
          const v = i / MEM_W; // 0..1 angular
          const angle = v * Math.PI * 2;
          // Radio de la membrana (crece con p2)
          const R = 1.8 * p2;
          // Tangente a la curva para orientar el anillo
          const du = 0.01;
          const u2 = THREE.MathUtils.clamp(u + du, 0, 1);
          const cx2 = (u2 - 0.5) * L;
          const cy2 = Math.sin(cx2 * 2.5 + curveT * 3) * amp;
          const cz2 = Math.cos(cx2 * 2.5 * 1.7 + curveT * 3) * amp * 0.6;
          const tx = cx2 - cx, ty = cy2 - cy, tz = cz2 - cz;
          const tlen = Math.sqrt(tx*tx + ty*ty + tz*tz) || 1;
          // Normal y binormal para orientar el anillo
          const nx = tx / tlen, ny = ty / tlen, nz = tz / tlen;
          // Vector perpendicular arbitrario
          const px = -nz, pz = nx, py = 0;
          const plen = Math.sqrt(px*px + py*py + pz*pz) || 1;
          const bx = py * nz - pz * ny;
          const by = pz * nx - px * nz;
          const bz = px * ny - py * nx;

          const rx = cx + R * (Math.cos(angle) * bx + Math.sin(angle) * px / plen);
          const ry = cy + R * (Math.cos(angle) * by + Math.sin(angle) * py / plen);
          const rz = cz + R * (Math.cos(angle) * bz + Math.sin(angle) * pz / plen);

          const idx = (j * MEM_W + i) * 3;
          mPos[idx] = rx; mPos[idx+1] = ry; mPos[idx+2] = rz;
          mUV[idx] = v; mUV[idx+1] = u;
        }
      }
      memGeo.attributes.position.needsUpdate = true;
      memGeo.computeVertexNormals();
    } else {
      memMesh.visible = false;
    }

    // Fluctuaciones DM sobre membrana
    if (p2 > 0.01) {
      const freeze = THREE.MathUtils.clamp((t - 0.5) / 0.25, 0, 1);
      const amp = 0.4 * (1 - freeze * 0.7);
      for (let i = 0; i < nFluct; i++) {
        // regeneración simple
        const u = Math.random(), v = Math.random();
        const cx = (u - 0.5) * 4;
        const cy = (v - 0.5) * 4;
        const cz = Math.sin(cx * 1.3 + t * (1.4 - freeze)) * Math.cos(cy * 1.3 + t * (1.1 - freeze)) * amp;
        flPos[i*3] = cx; flPos[i*3+1] = cy; flPos[i*3+2] = cz;
      }
      flGeo.attributes.position.needsUpdate = true;
    }

    // DM proyectado
    if (p2 > 0.01) {
      for (let i = 0; i < nDM; i++) {
        dmPos[i*3] += Math.sin(t * 0.5 + i) * 0.01;
        dmPos[i*3+1] += Math.cos(t * 0.7 + i) * 0.01;
        dmPos[i*3+2] += Math.sin(t * 0.3 + i) * 0.01;
      }
      dmGeo.attributes.position.needsUpdate = true;
    }

    // --- 3. VOLUMEN (se enciende en fase 3) ---
    const volOn = p3 > 0.02;
    volGroup.children.forEach(c => c.visible = volOn);
    if (volOn) {
      const ws = p3;
      nucleus.visible = true;
      electrons.forEach(e => e.mesh.visible = true);
      orbitRings.forEach(r => { r.visible = true; r.material.opacity = 0.35 * ws; });
      recLoop.visible = true; recLoop.material.opacity = 0.4 * ws;
      recLoop.rotation.y = t * 0.8;
      recLoop.scale.setScalar(1 + 0.15 * Math.sin(t * 3) * ws);

      // Electrones
      electrons.forEach((el, i) => {
        const a = t * el.o.speed + i;
        const x = el.o.r * Math.cos(a), z = el.o.r * Math.sin(a);
        el.mesh.position.set(x, 0, z);
        el.mesh.position.applyAxisAngle(new THREE.Vector3(1,0,0), el.o.tilt);
      });

      // Esfera envolvente = membrana cerrada
      const s = 0.2 + 0.8 * ws;
      holoshell.visible = true; holowire.visible = true;
      holoshell.scale.setScalar(s); holowire.scale.setScalar(s);
      holoshell.material.opacity = (0.08 + 0.12 * ws);
      holowire.material.opacity = (0.15 + 0.25 * ws);
      holowire.rotation.y = t * 0.08;
    }

    // --- 4. HIPERESFERA 4D ---
    const hsOn = p4 > 0.02;
    hsGroup.children.forEach(c => c.visible = hsOn);
    if (hsOn) {
      hsMesh.visible = true; hsMesh.material.opacity = 0.3 * p4;
      hsMesh.rotation.x = t * 0.06; hsMesh.rotation.y = t * 0.1;

      // Rayos KK
      rayMesh.visible = true; rayMesh.material.opacity = 0.85 * p4;
      const rp = rayMesh.geometry.attributes.position.array;
      const up = new THREE.Vector3();
      for (let i = 0; i < nRay; i++) {
        const rd = rayData[i];
        const frac = (t * rd.speed + rd.off) % 1;
        const rad = 5.2 * Math.pow(1 - frac, 1.3);
        up.set(Math.sin(rd.ph)*Math.cos(rd.th), Math.sin(rd.ph)*Math.sin(rd.th), Math.cos(rd.ph));
        rp[i*3] = up.x * rad; rp[i*3+1] = up.y * rad; rp[i*3+2] = up.z * rad;
      }
      rayMesh.geometry.attributes.position.needsUpdate = true;
      rayMesh.material.opacity = 0.85 * p4;

      // EM
      emMesh.visible = true; emMesh.material.opacity = 0.7 * p4;
      const ep = emMesh.geometry.attributes.position.array;
      emData.forEach((d, i) => {
        const r = d.r * (0.9 + 0.1 * Math.sin(t * d.speed));
        ep[i*3] = r * Math.sin(d.ph) * Math.cos(d.th + t * d.speed * 0.5);
        ep[i*3+1] = r * Math.sin(d.ph) * Math.sin(d.th + t * d.speed * 0.5);
        ep[i*3+2] = r * Math.cos(d.ph);
      });
      emMesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  // ============================================================
  // LOOP: scroll → t suave → updateAll(t)
  // ============================================================
  let last = performance.now();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    // Suavizar t y zoom
    state.t = ease(state.t, state.targetT, 2.5, dt);
    camera.position.z = ease(camera.position.z, state.targetZoom, 2.2, dt);
    camera.position.x = ease(camera.position.x, (state.mouseX||0) * 1.2, 2, dt);
    camera.position.y = ease(camera.position.y, -(state.mouseY||0) * 0.8, 2, dt);
    camera.lookAt(0, 0, 0);

    updateAll(state.t);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

})(window, document);