/* ============================================================
    Dimensiones Anidadas — layers3d.js
    VISUALIZACIÓN ANIDADA: 4D contiene 3D contiene 2D contiene 1D
    
    Todas las capas visibles SIMULTÁNEAMENTE.
    El tiempo controla R(t) = 2.0 + 1.5 * tanh((t-5)/2)
    Un slider en la página controla el tiempo.
    ============================================================ */

(function (window, document) {
  'use strict';

  if (typeof window.THREE === 'undefined') return;

  const THREE = window.THREE;

  // Colores ontológicos del modelo
  const C4 = 0x8B5CF6, C3 = 0x10B981, C2 = 0xF59E0B, C1 = 0xEF4444;
  const PROJECTION = 0x4fc3f7;
  const BH = 0xff6f00;

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
  camera.position.set(0, 0, 18);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dl = new THREE.DirectionalLight(0xffffff, 0.9);
  dl.position.set(8, 12, 15); scene.add(dl);
  const pl1 = new THREE.PointLight(C3, 0.5, 30); pl1.position.set(5, 5, 5); scene.add(pl1);
  const pl2 = new THREE.PointLight(C4, 0.3, 30); pl2.position.set(-5, -5, 5); scene.add(pl2);

  // ---- Slider de tiempo ----
  const sliderCSS = document.createElement('style');
  sliderCSS.textContent = `
    #time-slider-container {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 2000; background: rgba(10,10,26,0.85);
      border: 1px solid rgba(255,255,255,0.15); border-radius: 12px;
      padding: 10px 20px; backdrop-filter: blur(10px);
      display: flex; align-items: center; gap: 12px;
    }
    #time-slider-container label {
      color: #4fc3f7; font-family: 'Space Grotesk', sans-serif;
      font-size: 12px; font-weight: 600; white-space: nowrap;
    }
    #time-slider-container input[type=range] {
      width: 200px; accent-color: #4fc3f7; cursor: pointer;
    }
    #time-display {
      color: #fff; font-family: 'Space Grotesk', sans-serif;
      font-size: 13px; min-width: 120px; text-align: right;
    }
    #layer-labels {
      position: fixed; top: 15px; right: 15px; z-index: 2000;
      display: flex; flex-direction: column; gap: 6px;
    }
    .layer-label {
      padding: 4px 12px; border-radius: 6px; font-size: 11px;
      font-weight: 700; font-family: 'Space Grotesk', sans-serif;
      color: #fff; backdrop-filter: blur(5px);
    }
  `;
  document.head.appendChild(sliderCSS);

  const sliderContainer = document.createElement('div');
  sliderContainer.id = 'time-slider-container';
  sliderContainer.innerHTML = `
    <label>⏱ t =</label>
    <input type="range" id="time-slider" min="0" max="10" step="0.05" value="5">
    <span id="time-display">t=5.00 R=3.00</span>
  `;
  document.body.appendChild(sliderContainer);

  const layerLabels = document.createElement('div');
  layerLabels.id = 'layer-labels';
  layerLabels.innerHTML = `
    <div class="layer-label" style="background:rgba(139,92,246,0.8)">4D Hipervolumen</div>
    <div class="layer-label" style="background:rgba(16,185,129,0.8)">3D Universo</div>
    <div class="layer-label" style="background:rgba(245,158,11,0.8)">2D Membrana</div>
    <div class="layer-label" style="background:rgba(239,68,68,0.8)">1D Cuerda</div>
  `;
  document.body.appendChild(layerLabels);

  // ---------- Estado ----------
  const state = { time: 5.0, autoRotate: true, rotationSpeed: 0.002 };

  function R_t(t) {
    return 2.0 + 1.5 * Math.tanh((t - 5.0) / 2.0);
  }

  function ease(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }

  // ============================================================
  // CREACIÓN DE OBJETOS POR CAPA
  // ============================================================

  // ---- 4D HIPERESFERA ----
  const group4D = new THREE.Group();
  scene.add(group4D);

  const hsOuterGeo = new THREE.SphereGeometry(5.2, 64, 64);
  const hsOuterMat = new THREE.MeshPhongMaterial({
    color: C4, wireframe: true, transparent: true, opacity: 0.12,
    emissive: C4, emissiveIntensity: 0.1, shininess: 40
  });
  const hsOuter = new THREE.Mesh(hsOuterGeo, hsOuterMat);
  group4D.add(hsOuter);

  // Segundo shell (más interno, muestra la estructura 4D)
  const hsInnerGeo = new THREE.IcosahedronGeometry(4.5, 2);
  const hsInnerMat = new THREE.MeshPhongMaterial({
    color: C4, wireframe: true, transparent: true, opacity: 0.08,
    emissive: C4, emissiveIntensity: 0.05
  });
  const hsInner = new THREE.Mesh(hsInnerGeo, hsInnerMat);
  group4D.add(hsInner);

  // Rayos KK (proyección desde 4D al 3D)
  const nRay = 200;
  const rayGeo = new THREE.BufferGeometry();
  const rayPos = new Float32Array(nRay * 6); // posición + color
  const rayData = [];
  for (let i = 0; i < nRay; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    rayData.push({ th, ph, speed: 0.3 + Math.random() * 0.6 });
  }
  rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPos, 3));
  const rayMat = new THREE.PointsMaterial({ color: PROJECTION, size: 0.04, transparent: true, opacity: 0.5 });
  const rayMesh = new THREE.Points(rayGeo, rayMat);
  group4D.add(rayMesh);

  // ---- 3D UNIVERSO ----
  const group3D = new THREE.Group();
  scene.add(group3D);

  const u3Geo = new THREE.SphereGeometry(2.0, 64, 64);
  const u3Mat = new THREE.MeshPhongMaterial({
    color: C3, transparent: true, opacity: 0.25,
    emissive: C3, emissiveIntensity: 0.15, shininess: 80
  });
  const u3Sphere = new THREE.Mesh(u3Geo, u3Mat);
  group3D.add(u3Sphere);

  const u3WireGeo = new THREE.SphereGeometry(2.05, 32, 32);
  const u3WireMat = new THREE.MeshBasicMaterial({ color: C3, wireframe: true, transparent: true, opacity: 0.15 });
  const u3Wire = new THREE.Mesh(u3WireGeo, u3WireMat);
  group3D.add(u3Wire);

  // Anillos de curvatura (representan R(t))
  const orbitRings = [];
  for (let i = 0; i < 3; i++) {
    const rGeo = new THREE.TorusGeometry(2.0 + i * 0.4, 0.01, 8, 80);
    const rMat = new THREE.MeshBasicMaterial({ color: C3, transparent: true, opacity: 0.15 });
    const ring = new THREE.Mesh(rGeo, rMat);
    ring.rotation.x = Math.PI / 2 + i * 0.4;
    ring.rotation.y = i * 0.5;
    group3D.add(ring);
    orbitRings.push(ring);
  }

  // ---- 2D MEMBRANA ----
  const group2D = new THREE.Group();
  scene.add(group2D);

  // Membrana circular con estructura topológica
  const memGeo = new THREE.CircleGeometry(1.5, 80);
  const memMat = new THREE.MeshPhongMaterial({
    color: C2, side: THREE.DoubleSide, transparent: true, opacity: 0.15,
    emissive: C2, emissiveIntensity: 0.1
  });
  const memMesh = new THREE.Mesh(memGeo, memMat);
  memMesh.rotation.x = -Math.PI / 2;
  group2D.add(memMesh);

  // Borde de la membrana
  const memEdgeGeo = new THREE.TorusGeometry(1.5, 0.03, 8, 80);
  const memEdgeMat = new THREE.MeshBasicMaterial({ color: C2, transparent: true, opacity: 0.5 });
  const memEdge = new THREE.Mesh(memEdgeGeo, memEdgeMat);
  memEdge.rotation.x = -Math.PI / 2;
  group2D.add(memEdge);

  // Dominios (estructura interna)
  const domainLines = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(1.5 * Math.cos(angle), 0.01, 1.5 * Math.sin(angle))
    ]);
    const lineMat = new THREE.LineBasicMaterial({ color: C2, transparent: true, opacity: 0.4 });
    const line = new THREE.Line(lineGeo, lineMat);
    group2D.add(line);
    domainLines.push(line);
  }

  // Puntos de fluctuación (materia oscura proyectada)
  const nDM = 120;
  const dmGeo = new THREE.BufferGeometry();
  const dmPos = new Float32Array(nDM * 3);
  const dmData = [];
  for (let i = 0; i < nDM; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.5;
    dmData.push({ theta, r, speed: 0.5 + Math.random() * 1.5 });
    dmPos[i*3] = r * Math.cos(theta);
    dmPos[i*3+1] = (Math.random() - 0.5) * 0.1;
    dmPos[i*3+2] = r * Math.sin(theta);
  }
  dmGeo.setAttribute('position', new THREE.BufferAttribute(dmPos, 3));
  const dmMat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.04, transparent: true, opacity: 0.6 });
  const dmMesh = new THREE.Points(dmGeo, dmMat);
  group2D.add(dmMesh);

  // ---- 1D CUERDA ----
  const group1D = new THREE.Group();
  scene.add(group1D);

  // Cuerda principal (vibración)
  const CURVE_SEG = 150;
  const L = 4.5;
  const stringGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array((CURVE_SEG + 1) * 3);
  stringGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const stringMat = new THREE.LineBasicMaterial({ color: C1, transparent: true, opacity: 0.9 });
  const stringLine = new THREE.Line(stringGeo, stringMat);
  group1D.add(stringLine);

  // Modos armónicos superpuestos
  const modes = [];
  for (let n = 1; n <= 3; n++) {
    const mGeo = new THREE.BufferGeometry();
    const mPos = new Float32Array((CURVE_SEG + 1) * 3);
    mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
    const modeColors = [0xEF4444, 0xFF5722, 0xFF8F00];
    const mMat = new THREE.LineBasicMaterial({ color: modeColors[n-1], transparent: true, opacity: 0.5 });
    const mLine = new THREE.Line(mGeo, mMat);
    group1D.add(mLine);
    modes.push({ geo: mGeo, n });
  }

  // Partículas de la cuerda
  const nParts = 20;
  const partGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(nParts * 3);
  partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const partMat = new THREE.PointsMaterial({ color: C1, size: 0.08, transparent: true, opacity: 0.9 });
  const partMesh = new THREE.Points(partGeo, partMat);
  group1D.add(partMesh);

  // ---- AGUJERO NEGRO ----
  const bhGroup = new THREE.Group();
  scene.add(bhGroup);

  const bhGeo = new THREE.SphereGeometry(0.4, 32, 32);
  const bhMat = new THREE.MeshBasicMaterial({ color: BH, transparent: true, opacity: 0.9 });
  const bhMesh = new THREE.Mesh(bhGeo, bhMat);
  bhMesh.position.set(1.8, 0, 0);
  bhGroup.add(bhMesh);

  // Horizonte de eventos
  const bhHorizonGeo = new THREE.TorusGeometry(0.7, 0.02, 8, 40);
  const bhHorizonMat = new THREE.MeshBasicMaterial({ color: BH, transparent: true, opacity: 0.4 });
  const bhHorizon = new THREE.Mesh(bhHorizonGeo, bhHorizonMat);
  bhHorizon.position.copy(bhMesh.position);
  bhGroup.add(bhHorizon);

  // Información 2D visible desde el BH
  const bhInfoGeo = new THREE.SphereGeometry(0.9, 16, 16);
  const bhInfoMat = new THREE.MeshBasicMaterial({ color: PROJECTION, wireframe: true, transparent: true, opacity: 0.15 });
  const bhInfo = new THREE.Mesh(bhInfoGeo, bhInfoMat);
  bhInfo.position.copy(bhMesh.position);
  bhGroup.add(bhInfo);

  // ---- FLECHAS DE PROYECCIÓN ----
  const arrowGroup = new THREE.Group();
  scene.add(arrowGroup);

  function createArrow(from, to, color) {
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const len = new THREE.Vector3().distanceTo(new THREE.Vector3(), to);
    const arrow = new THREE.ArrowHelper(dir, from, len * 0.3, color, 0.15, 0.08);
    return arrow;
  }

  const arrow4D3D = createArrow(new THREE.Vector3(0, 3, 0), new THREE.Vector3(0, 2, 0), PROJECTION);
  const arrow3D2D = createArrow(new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, 0.8, 0), PROJECTION);
  const arrow2D1D = createArrow(new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.05, 0), PROJECTION);
  arrowGroup.add(arrow4D3D, arrow3D2D, arrow2D1D);

  // ---- ESTRELLAS DE FONDO ----
  const sG = new THREE.BufferGeometry();
  const sP = new Float32Array(800 * 3);
  for (let i = 0; i < 800; i++) {
    const r = 15 + Math.random() * 50;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    sP[i*3] = r * Math.sin(ph) * Math.cos(th);
    sP[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    sP[i*3+2] = r * Math.cos(ph);
  }
  sG.setAttribute('position', new THREE.BufferAttribute(sP, 3));
  scene.add(new THREE.Points(sG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.3 })));

  // ============================================================
  // ACTUALIZACIÓN: dado el tiempo, actualiza todo
  // ============================================================
  function updateAll(time) {
    const R = R_t(time);
    const R3 = Math.max(0.1, R);
    const R2 = Math.max(0.1, R * 0.6);
    const R1 = Math.max(0.05, R * 0.4);

    // Actualizar display del slider
    const display = document.getElementById('time-display');
    if (display) display.textContent = `t=${time.toFixed(2)} R=${R3.toFixed(2)}`;

    // ---- 4D: hiperesfera ----
    const hsScale = Math.max(0.1, R / 5.2);
    group4D.scale.setScalar(hsScale);
    group4D.rotation.y += 0.001;
    group4D.rotation.x = Math.sin(time * 0.1) * 0.1;
    hsOuter.rotation.y += 0.002;
    hsInner.rotation.y -= 0.0015;
    hsInner.rotation.z += 0.001;

    // Rayos KK
    const rp = rayMesh.geometry.attributes.position.array;
    for (let i = 0; i < nRay; i++) {
      const rd = rayData[i];
      const frac = ((time * rd.speed * 0.1) + rd.off) % 1;
      const rad = 5.2 * hsScale * Math.pow(1 - frac, 1.3);
      rp[i*3] = rad * Math.sin(rd.ph) * Math.cos(rd.th);
      rp[i*3+1] = rad * Math.sin(rd.ph) * Math.sin(rd.th);
      rp[i*3+2] = rad * Math.cos(rd.ph);
    }
    rayMesh.geometry.attributes.position.needsUpdate = true;
    rayMesh.material.opacity = 0.4 + 0.3 * Math.sin(time);

    // ---- 3D: universo ----
    const u3Scale = Math.max(0.1, R3 / 2.0);
    group3D.scale.setScalar(u3Scale);
    group3D.rotation.y += 0.003;
    u3Sphere.rotation.y += 0.002;
    u3Wire.rotation.y -= 0.001;

    // Anillos de curvatura
    orbitRings.forEach((ring, i) => {
      ring.rotation.x += 0.002 * (i + 1);
      ring.rotation.z += 0.001 * (i + 1);
      ring.material.opacity = 0.1 + 0.1 * Math.sin(time + i);
    });

    // ---- 2D: membrana ----
    const memScale = Math.max(0.1, R2 / 1.5);
    group2D.scale.setScalar(memScale);
    group2D.rotation.z += 0.005;
    memEdge.rotation.z += 0.003;

    // Dominios
    domainLines.forEach((line, i) => {
      line.rotation.z += 0.002;
      line.material.opacity = 0.3 + 0.2 * Math.sin(time * 2 + i);
    });

    // DM fluctuando
    const dp = dmMesh.geometry.attributes.position.array;
    for (let i = 0; i < nDM; i++) {
      const d = dmData[i];
      const r = d.r * memScale * (0.8 + 0.2 * Math.sin(time * d.speed));
      const theta = d.theta + time * 0.01 * d.speed;
      dp[i*3] = r * Math.cos(theta);
      dp[i*3+1] = (Math.random() - 0.5) * 0.05;
      dp[i*3+2] = r * Math.sin(theta);
    }
    dmMesh.geometry.attributes.position.needsUpdate = true;
    dmMesh.material.opacity = 0.4 + 0.3 * Math.sin(time * 1.5);

    // ---- 1D: cuerda ----
    const s1Scale = Math.max(0.05, R1 / 1.0);
    group1D.scale.setScalar(s1Scale);
    group1D.position.y = (1 - s1Scale) * 0.5;

    // Vibración de la cuerda
    const amp = 0.5 * Math.sin(time * 0.5) * s1Scale;
    const pos = stringGeo.attributes.position.array;
    for (let i = 0; i <= CURVE_SEG; i++) {
      const u = i / CURVE_SEG;
      const x = (u - 0.5) * L * s1Scale;
      const phase = x * 2.5 + time * 2;
      pos[i*3] = x;
      pos[i*3+1] = Math.sin(phase) * amp;
      pos[i*3+2] = Math.cos(phase * 1.7) * amp * 0.6;
    }
    stringGeo.attributes.position.needsUpdate = true;

    // Modos armónicos
    modes.forEach(mode => {
      const mp = mode.geo.attributes.position.array;
      const n = mode.n;
      for (let i = 0; i <= CURVE_SEG; i++) {
        const u = i / CURVE_SEG;
        const x = (u - 0.5) * L * s1Scale;
        const y = 0.3 * Math.sin(n * x) * Math.exp(-n * 0.05) * s1Scale;
        mp[i*3] = x;
        mp[i*3+1] = y + n * 0.3 * s1Scale;
        mp[i*3+2] = 0;
      }
      mode.geo.attributes.position.needsUpdate = true;
    });

    // Partículas
    const pp = partMesh.geometry.attributes.position.array;
    for (let i = 0; i < nParts; i++) {
      const base = (i - nParts/2) * 0.15 * s1Scale;
      const y = Math.sin(time * 3 + i * 0.8) * 0.2 * s1Scale;
      pp[i*3] = base;
      pp[i*3+1] = y;
      pp[i*3+2] = 0;
    }
    partMesh.geometry.attributes.position.needsUpdate = true;
    partMesh.material.opacity = 0.5 + 0.3 * Math.sin(time);

    // ---- BH: agujero negro ----
    const bhAngle = time * 0.5;
    bhMesh.position.x = 1.8 * Math.cos(bhAngle * 0.3);
    bhMesh.position.z = 1.8 * Math.sin(bhAngle * 0.3);
    bhMesh.rotation.z += 0.02;
    bhHorizon.rotation.z += 0.03;
    bhHorizon.material.opacity = 0.3 + 0.2 * Math.sin(time * 3);
    bhInfo.material.opacity = 0.1 + 0.1 * Math.sin(time * 2);

    // ---- Proyección flechas ----
    arrow4D3D.position.set(0, R3, 0);
    arrow3D2D.position.set(0, R2, 0);
    arrow2D1D.position.set(0, R1, 0);
    arrowGroup.children.forEach(a => a.visible = true);
  }

  // ============================================================
  // EVENTOS
  // ============================================================
  const slider = document.getElementById('time-slider');
  if (slider) {
    slider.addEventListener('input', function() {
      state.time = parseFloat(this.value);
    });
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Auto-rotación suave
  let last = performance.now();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    // Auto-avanzar tiempo si el slider no está siendo arrastrado
    if (state.autoRotate) {
      state.time += dt * 0.3;
      if (state.time > 10) state.time = 0;
      if (slider) slider.value = state.time;
    }

    updateAll(state.time);

    // Rotación suave de la cámara
    const angle = performance.now() * 0.0002;
    camera.position.x = Math.sin(angle) * 18;
    camera.position.z = Math.cos(angle) * 18;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

})(window, document);
