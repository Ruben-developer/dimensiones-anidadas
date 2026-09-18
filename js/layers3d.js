/* ============================================================
    Dimensiones Anidadas — layers3d.js
    OPERACIÓN DE BARRIDO (SWEEP): cada dimensión crea la siguiente
    
    1D → 2D: la cuerda barre → crea la membrana (la cuerda = borde de la membrana)
    2D → 3D: la membrana barre → crea el volumen (la membrana = borde del volumen)
    3D → 4D: el volumen barre → crea la hiperesfera (el volumen = borde de la 4D)
    
    El scroll controla el progreso de barrido (0% = objeto original,
    100% = objeto barrido completo con el original como contorno).
    
    R(t) = 2.0 + 1.5·tanh((t-5)/2) controla la escala temporal.
    ============================================================ */

(function (window, document) {
  'use strict';

  if (typeof window.THREE === 'undefined') return;
  const THREE = window.THREE;

  // ==================== COLORES ====================
  const C1 = 0xEF4444; // 1D - cuerda (rojo)
  const C2 = 0xF59E0B; // 2D - membrana (naranja)
  const C3 = 0x10B981; // 3D - universo (verde)
  const C4 = 0x8B5CF6; // 4D - hiperespacio (violeta)
  const PROJ = 0x4fc3f7; // proyección (cyan)
  const BH = 0xff6f00;   // agujero negro (naranja brillante)
  const BORDER = 0xffffff; // contorno blanco

  // ==================== RENDERER ====================
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
  renderer.setClearColor(0x050510, 1);
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 22);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dl = new THREE.DirectionalLight(0xffffff, 0.8);
  dl.position.set(10, 15, 10); scene.add(dl);
  const pl1 = new THREE.PointLight(C3, 0.5, 40); pl1.position.set(5, 5, 8); scene.add(pl1);
  const pl2 = new THREE.PointLight(C4, 0.4, 40); pl2.position.set(-8, -5, 5); scene.add(pl2);

  // ==================== SLIDER DE TIEMPO ====================
  const sliderCSS = document.createElement('style');
  sliderCSS.textContent = `
    #time-container {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 2000; background: rgba(10,10,26,0.9);
      border: 1px solid rgba(79,195,247,0.3); border-radius: 14px;
      padding: 14px 24px; backdrop-filter: blur(12px);
      display: flex; align-items: center; gap: 16px;
      box-shadow: 0 0 20px rgba(79,195,247,0.1);
    }
    #time-container label {
      color: #4fc3f7; font-family: 'Space Grotesk', sans-serif;
      font-size: 13px; font-weight: 700; white-space: nowrap;
    }
    #time-container input[type=range] {
      width: 260px; accent-color: #4fc3f7; cursor: pointer; height: 6px;
    }
    #time-display {
      color: #fff; font-family: 'Space Grotesk', sans-serif;
      font-size: 14px; min-width: 150px; text-align: left;
      font-weight: 600;
    }
    #phase-display {
      color: #4fc3f7; font-family: 'Space Grotesk', sans-serif;
      font-size: 12px; min-width: 200px;
      text-align: left; opacity: 0.8;
    }
    #layer-indicators {
      position: fixed; top: 15px; left: 15px; z-index: 2000;
      display: flex; flex-direction: column; gap: 8px;
    }
    .layer-ind {
      padding: 6px 14px; border-radius: 8px; font-size: 12px;
      font-weight: 700; font-family: 'Space Grotesk', sans-serif;
      color: #fff; backdrop-filter: blur(6px);
      border-left: 3px solid; transition: all 0.3s;
    }
  `;
  document.head.appendChild(sliderCSS);

  const sliderContainer = document.createElement('div');
  sliderContainer.id = 'time-container';
  sliderContainer.innerHTML = `
    <label>⏱ t</label>
    <input type="range" id="time-slider" min="0" max="10" step="0.01" value="5">
    <div>
      <div id="time-display">t=5.00 R=3.00</div>
      <div id="phase-display">Barrido: —</div>
    </div>
  `;
  document.body.appendChild(sliderContainer);

  const layerIndicators = document.createElement('div');
  layerIndicators.id = 'layer-indicators';
  layerIndicators.innerHTML = `
    <div class="layer-ind" style="background:rgba(139,92,246,0.85);border-color:#8B5CF6">4D Hiperesfera</div>
    <div class="layer-ind" style="background:rgba(16,185,129,0.85);border-color:#10B981">3D Volumen</div>
    <div class="layer-ind" style="background:rgba(245,158,11,0.85);border-color:#F59E0B">2D Membrana</div>
    <div class="layer-ind" style="background:rgba(239,68,68,0.85);border-color:#EF4444">1D Cuerda</div>
  `;
  document.body.appendChild(layerIndicators);

  // ==================== ESTADO ====================
  const state = { time: 5.0 };

  function R_t(t) { return 2.0 + 1.5 * Math.tanh((t - 5.0) / 2.0); }

  function ease(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }

  // ==================== GEOMETRÍA DE BARREADO ====================
  // Cada dimensión se crea barriendo la anterior.
  // El barrido: dado un objeto kD, se mueve perpendicularmente
  // creando un objeto (k+1)D. El original se convierte en el borde.

  // --- 1D: CUERDA VIBRANTE ---
  const CURVE_SEG = 200;
  const L = 5.0;
  const curvePoints = [];
  for (let i = 0; i <= CURVE_SEG; i++) {
    const u = i / CURVE_SEG;
    const x = (u - 0.5) * L;
    curvePoints.push(x);
  }

  // La cuerda como línea
  const stringGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array((CURVE_SEG + 1) * 3);
  stringGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const stringMat = new THREE.LineBasicMaterial({ color: C1, transparent: true, opacity: 0.9 });
  const stringLine = new THREE.Line(stringGeo, stringMat);
  scene.add(stringLine);

  // Partículas de la cuerda
  const nParts = 50;
  const partGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(nParts * 3);
  partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const partMat = new THREE.PointsMaterial({ color: C1, size: 0.08, transparent: true, opacity: 0.8 });
  const partMesh = new THREE.Points(partGeo, partMat);
  scene.add(partMesh);

  // Modos armónicos
  const modeGroup = new THREE.Group();
  scene.add(modeGroup);
  for (let n = 1; n <= 4; n++) {
    const mGeo = new THREE.BufferGeometry();
    const mPos = new Float32Array((CURVE_SEG + 1) * 3);
    mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
    const colors = [0xEF4444, 0xFF5722, 0xFF8F00, 0xFFC107];
    const mMat = new THREE.LineBasicMaterial({ color: colors[n-1], transparent: true, opacity: 0.4 });
    const mLine = new THREE.Line(mGeo, mMat);
    modeGroup.add(mLine);
  }

  // --- 2D: MEMBRANA (barrido de la cuerda) ---
  const MEM_W = 80; // resolución angular
  const MEM_H = 100; // resolución longitudinal

  // La membrana es la superficie de revolución de la cuerda
  // La cuerda gira alrededor del eje Z, creando una superficie
  const memGeo = new THREE.BufferGeometry();
  const mPos = new Float32Array(MEM_W * MEM_H * 3);
  const mNor = new Float32Array(MEM_W * MEM_H * 3);
  const mUV = new Float32Array(MEM_W * MEM_H * 2);
  memGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  memGeo.setAttribute('normal', new THREE.BufferAttribute(mNor, 3));
  memGeo.setAttribute('uv', new THREE.BufferAttribute(mUV, 2));

  const memMat = new THREE.MeshPhongMaterial({
    color: C2, side: THREE.DoubleSide, transparent: true, opacity: 0.0,
    emissive: C2, emissiveIntensity: 0.1, shininess: 80,
    wireframe: false
  });
  const memMesh = new THREE.Mesh(memGeo, memMat);
  scene.add(memMesh);

  // Borde de la membrana = la cuerda original
  const memEdgeGeo = new THREE.TorusGeometry(0.5, 0.04, 8, 80);
  const memEdgeMat = new THREE.MeshBasicMaterial({ color: BORDER, transparent: true, opacity: 0.3 });
  const memEdge = new THREE.Mesh(memEdgeGeo, memEdgeMat);
  memEdge.rotation.x = -Math.PI / 2;
  scene.add(memEdge);

  // Líneas de dominio sobre la membrana
  const domainLines = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const pts = [];
    for (let j = 0; j <= MEM_H; j++) {
      const u = j / (MEM_H - 1);
      pts.push(new THREE.Vector3());
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({ color: C2, transparent: true, opacity: 0.2 });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
    domainLines.push(line);
  }

  // Puntos de fluctuación (DM) sobre la membrana
  const nDM = 200;
  const dmGeo = new THREE.BufferGeometry();
  const dmPos = new Float32Array(nDM * 3);
  const dmData = [];
  for (let i = 0; i < nDM; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = Math.random() * 2.0;
    dmData.push({ theta, r, speed: 0.5 + Math.random() * 1.5 });
    dmPos[i*3] = r * Math.cos(theta);
    dmPos[i*3+1] = (Math.random() - 0.5) * 0.05;
    dmPos[i*3+2] = r * Math.sin(theta);
  }
  dmGeo.setAttribute('position', new THREE.BufferAttribute(dmPos, 3));
  const dmMat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.035, transparent: true, opacity: 0.0 });
  const dmMesh = new THREE.Points(dmGeo, dmMat);
  scene.add(dmMesh);

  // --- 3D: VOLUMEN (barrido de la membrana) ---
  const volGroup = new THREE.Group();
  scene.add(volGroup);

  // La esfera 3D = barrido de la membrana 2D
  const sphereGeo = new THREE.SphereGeometry(1.0, 64, 64);
  const sphereMat = new THREE.MeshPhongMaterial({
    color: C3, transparent: true, opacity: 0.0,
    emissive: C3, emissiveIntensity: 0.1, shininess: 80,
    wireframe: false
  });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  volGroup.add(sphereMesh);

  // Borde del volumen = la membrana 2D
  const volEdgeGeo = new THREE.SphereGeometry(1.05, 32, 32);
  const volEdgeMat = new THREE.MeshBasicMaterial({ color: BORDER, wireframe: true, transparent: true, opacity: 0.0 });
  const volEdge = new THREE.Mesh(volEdgeGeo, volEdgeMat);
  volGroup.add(volEdge);

  // Anillos de curvatura dentro del volumen
  const sphereRings = [];
  for (let i = 0; i < 5; i++) {
    const ringGeo = new THREE.TorusGeometry(0.8 + i * 0.2, 0.008, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: C3, transparent: true, opacity: 0.0 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + i * 0.3;
    ring.rotation.y = i * 0.4;
    volGroup.add(ring);
    sphereRings.push(ring);
  }

  // --- 4D: HIPERESFERA (barrido del volumen) ---
  const hsGroup = new THREE.Group();
  scene.add(hsGroup);

  // La hiperesfera 4D como cascarón
  const hsGeo = new THREE.SphereGeometry(1.0, 64, 64);
  const hsMat = new THREE.MeshPhongMaterial({
    color: C4, wireframe: true, transparent: true, opacity: 0.0,
    emissive: C4, emissiveIntensity: 0.1, shininess: 40
  });
  const hsMesh = new THREE.Mesh(hsGeo, hsMat);
  hsGroup.add(hsMesh);

  // Estructura interna 4D (icosaedro)
  const hsInnerGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const hsInnerMat = new THREE.MeshPhongMaterial({
    color: C4, wireframe: true, transparent: true, opacity: 0.0,
    emissive: C4, emissiveIntensity: 0.05
  });
  const hsInner = new THREE.Mesh(hsInnerGeo, hsInnerMat);
  hsGroup.add(hsInner);

  // Rayos KK (proyección 4D→3D)
  const nRay = 150;
  const rayGeo = new THREE.BufferGeometry();
  const rayPos = new Float32Array(nRay * 3);
  const rayData = [];
  for (let i = 0; i < nRay; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    rayData.push({ th, ph, speed: 0.3 + Math.random() * 0.7 });
  }
  rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPos, 3));
  const rayMat = new THREE.PointsMaterial({ color: PROJ, size: 0.04, transparent: true, opacity: 0.0 });
  const rayMesh = new THREE.Points(rayGeo, rayMat);
  hsGroup.add(rayMesh);

  // --- AGUJERO NEGRO ---
  const bhGroup = new THREE.Group();
  scene.add(bhGroup);

  const bhGeo = new THREE.SphereGeometry(0.3, 24, 24);
  const bhMat = new THREE.MeshBasicMaterial({ color: BH, transparent: true, opacity: 0.9 });
  const bhMesh = new THREE.Mesh(bhGeo, bhMat);
  bhMesh.position.set(2.0, 0, 0);
  bhGroup.add(bhMesh);

  const bhRingGeo = new THREE.TorusGeometry(0.6, 0.02, 8, 32);
  const bhRingMat = new THREE.MeshBasicMaterial({ color: BH, transparent: true, opacity: 0.3 });
  const bhRing = new THREE.Mesh(bhRingGeo, bhRingMat);
  bhRing.position.copy(bhMesh.position);
  bhGroup.add(bhRing);

  // Información 2D visible desde BH
  const bhInfoGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const bhInfoMat = new THREE.MeshBasicMaterial({ color: PROJ, wireframe: true, transparent: true, opacity: 0.0 });
  const bhInfo = new THREE.Mesh(bhInfoGeo, bhInfoMat);
  bhInfo.position.copy(bhMesh.position);
  bhGroup.add(bhInfo);

  // --- FLECHAS DE BARREADO ---
  const arrowGroup = new THREE.Group();
  scene.add(arrowGroup);

  function makeArrow(pos, color, label) {
    const group = new THREE.Group();
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), pos, 0.5, color, 0.15, 0.08
    );
    group.add(arrow);
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 128; textCanvas.height = 32;
    const ctx = textCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Space Grotesk';
    ctx.fillText(label, 2, 22);
    const texture = new THREE.CanvasTexture(textCanvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = 0.6;
    sprite.scale.set(1, 0.3, 1);
    group.add(sprite);
    group.position.copy(pos);
    return group;
  }

  // ==================== OPERACIÓN DE BARREADO ====================
  // Dado un objeto kD con parámetro de progreso p ∈ [0,1]:
  // - p=0: mostrar solo el objeto original (sin barrido)
  // - p=1: mostrar el objeto barrido completo (original como borde)

  function updateString(time, R) {
    const amp = 0.6 * Math.sin(time * 0.3) * R / 2.0;
    const freq = 2.5;
    const pos = stringGeo.attributes.position.array;
    for (let i = 0; i <= CURVE_SEG; i++) {
      const x = curvePoints[i];
      const phase = x * freq + time * 2;
      pos[i*3] = x * (R / 2.0);
      pos[i*3+1] = Math.sin(phase) * amp * (R / 2.0);
      pos[i*3+2] = Math.cos(phase * 1.7) * amp * 0.6 * (R / 2.0);
    }
    stringGeo.attributes.position.needsUpdate = true;

    // Partículas
    const pp = partMesh.geometry.attributes.position.array;
    for (let i = 0; i < nParts; i++) {
      const idx = Math.floor(i / nParts * (CURVE_SEG + 1));
      pp[i*3] = pos[idx*3];
      pp[i*3+1] = pos[idx*3+1];
      pp[i*3+2] = pos[idx*3+2];
    }
    partMesh.geometry.attributes.position.needsUpdate = true;
    partMesh.material.opacity = 0.5 + 0.3 * Math.sin(time);

    // Modos armónicos
    modeGroup.children.forEach((modeLine, nIdx) => {
      const n = nIdx + 1;
      const mp = modeLine.geometry.attributes.position.array;
      for (let i = 0; i <= CURVE_SEG; i++) {
        const x = curvePoints[i] * (R / 2.0);
        const y = 0.35 * Math.sin(n * x) * Math.exp(-n * 0.05) * (R / 2.0);
        mp[i*3] = x;
        mp[i*3+1] = y + n * 0.25 * (R / 2.0);
        mp[i*3+2] = 0;
      }
      modeLine.geometry.attributes.position.needsUpdate = true;
    });
    modeGroup.children.forEach(m => { m.visible = true; m.material.opacity = 0.3 + 0.2 * Math.sin(time); });
  }

  function updateMembrane(sweepProgress, R) {
    // sweepProgress ∈ [0,1]: 0 = cuerda sola, 1 = membrana completa
    // La membrana es la superficie de revolución de la cuerda
    // La cuerda gira alrededor del eje Y, creando la membrana

    const memR = 2.5 * (R / 2.0); // radio máximo de la membrana
    const memHeight = 5.0 * (R / 2.0); // altura de la membrana
    const memOp = THREE.MathUtils.clamp(sweepProgress, 0, 1);

    // Generar superficie de revolución
    const pos = mPos;
    const nor = mNor;
    for (let j = 0; j < MEM_H; j++) {
      const u = j / (MEM_H - 1); // 0..1 a lo largo de la cuerda
      const x = curvePoints[j] * (R / 2.0);
      const amp = 0.6 * Math.sin((x * 2.5 + 0) * 2) * (R / 2.0);
      const z_pos = amp; // posición Z de la cuerda (la cuerda vibra en Z)

      for (let i = 0; i < MEM_W; i++) {
        const theta = (i / MEM_W) * Math.PI * 2;
        const progressTheta = theta * memOp;

        // Posición en la superficie de revolución
        const rx = x * Math.cos(progressTheta);
        const rz = x * Math.sin(progressTheta);
        const ry = z_pos; // la cuerda vibra en Y

        const idx = (j * MEM_W + i) * 3;
        pos[idx] = rx;
        pos[idx+1] = ry;
        pos[idx+2] = rz;

        // Normal aproximada
        const dx = curvePoints[Math.min(j+1, CURVE_SEG)] - curvePoints[Math.max(j-1, 0)];
        const nx = Math.cos(progressTheta);
        const nz = Math.sin(progressTheta);
        const len = Math.sqrt(nx*nx + nz*nz) || 1;
        nor[idx] = nx / len;
        nor[idx+1] = 0;
        nor[idx+2] = nz / len;
      }
    }
    memGeo.attributes.position.needsUpdate = true;
    memGeo.attributes.normal.needsUpdate = true;
    memGeo.computeVertexNormals();

    // Opacidad de la membrana
    memMesh.material.opacity = memOp * 0.35;
    memMesh.visible = memOp > 0.01;

    // Borde de la membrana = la cuerda original
    const borderScale = memR * (1 - sweepProgress * 0.5) / 0.5;
    memEdge.geometry.dispose();
    memEdge.geometry = new THREE.TorusGeometry(borderScale * 0.5, 0.04, 8, 80);
    memEdge.rotation.x = -Math.PI / 2;
    memEdge.material.opacity = memOp * 0.6;
    memEdge.visible = memOp > 0.01;

    // Dominios
    domainLines.forEach((line, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const pts = [];
      for (let j = 0; j < MEM_H; j++) {
        const u = j / (MEM_H - 1);
        const x = curvePoints[j] * (R / 2.0);
        const amp = 0.6 * Math.sin(x * 2.5) * (R / 2.0);
        const progressTheta = (angle * memOp);
        const rx = x * Math.cos(progressTheta);
        const rz = x * Math.sin(progressTheta);
        pts[j] = new THREE.Vector3(rx, amp, rz);
      }
      line.geometry.dispose();
      line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      line.material.opacity = memOp * 0.3 * (0.5 + 0.5 * Math.sin(time * 2 + i));
      line.visible = memOp > 0.01;
    });

    // DM sobre la membrana
    const dp = dmGeo.attributes.position.array;
    for (let i = 0; i < nDM; i++) {
      const d = dmData[i];
      const r = d.r * (R / 2.0) * memOp;
      const theta = d.theta + time * 0.01 * d.speed;
      dp[i*3] = r * Math.cos(theta);
      dp[i*3+1] = (Math.random() - 0.5) * 0.05 * memOp;
      dp[i*3+2] = r * Math.sin(theta);
    }
    dmGeo.attributes.position.needsUpdate = true;
    dmMesh.material.opacity = memOp * 0.5 * (0.5 + 0.5 * Math.sin(time * 1.5));
    dmMesh.visible = memOp > 0.01;

    // Rotación de la membrana
    memMesh.rotation.y += 0.002;
  }

  function updateVolume(sweepProgress, R) {
    // sweepProgress ∈ [0,1]: 0 = membrana sola, 1 = volumen completo
    const volOp = THREE.MathUtils.clamp(sweepProgress, 0, 1);
    const volR = 2.0 * (R / 2.0);

    // La esfera crece desde un disco plano hasta una esfera completa
    // Usamos scale Y para mostrar la "expansión" del barrido
    const scaleY = volOp;
    const scaleXZ = Math.sqrt(Math.max(0, 1 - Math.pow(1 - volOp, 2) * 0.5));

    volGroup.scale.set(scaleXZ, scaleY, scaleXZ);

    sphereMesh.material.opacity = volOp * 0.25;
    sphereMesh.visible = volOp > 0.01;

    // Borde = membrana
    volEdge.material.opacity = volOp * 0.4;
    volEdge.visible = volOp > 0.01;
    volEdge.scale.setScalar(volR / 1.0);

    // Anillos de curvatura
    sphereRings.forEach((ring, i) => {
      ring.material.opacity = volOp * 0.15 * (0.5 + 0.5 * Math.sin(time + i));
      ring.rotation.x += 0.003 * (i + 1);
      ring.rotation.y += 0.002 * (i + 1);
      ring.scale.setScalar(volR / 1.0);
    });

    // Rotación del volumen
    volGroup.rotation.y += 0.0015;
  }

  function updateHyperspace(sweepProgress, R) {
    // sweepProgress ∈ [0,1]: 0 = volumen, 1 = hiperesfera
    const hsOp = THREE.MathUtils.clamp(sweepProgress, 0, 1);
    const hsR = 3.0 * (R / 2.0);

    // Hiperesfera como cascarón wireframe
    hsMesh.material.opacity = hsOp * 0.2;
    hsMesh.scale.setScalar(hsR / 1.0);
    hsMesh.visible = hsOp > 0.01;
    hsMesh.rotation.x += 0.001;
    hsMesh.rotation.y += 0.0015;

    // Icosaedro interno
    hsInner.material.opacity = hsOp * 0.15;
    hsInner.scale.setScalar(hsR / 1.0);
    hsInner.visible = hsOp > 0.01;
    hsInner.rotation.y -= 0.0008;

    // Rayos KK
    const rp = rayGeo.attributes.position.array;
    for (let i = 0; i < nRay; i++) {
      const rd = rayData[i];
      const frac = ((time * rd.speed * 0.1) + rd.off) % 1;
      const rad = hsR * Math.pow(1 - frac, 1.5) * hsOp;
      rp[i*3] = rad * Math.sin(rd.ph) * Math.cos(rd.th);
      rp[i*3+1] = rad * Math.sin(rd.ph) * Math.sin(rd.th);
      rp[i*3+2] = rad * Math.cos(rd.ph);
    }
    rayGeo.attributes.position.needsUpdate = true;
    rayMesh.material.opacity = hsOp * 0.6 * (0.5 + 0.5 * Math.sin(time));
    rayMesh.visible = hsOp > 0.01;

    // BH
    const bhAngle = time * 0.5;
    bhMesh.position.x = 2.0 * Math.cos(bhAngle * 0.3) * hsOp;
    bhMesh.position.z = 2.0 * Math.sin(bhAngle * 0.3) * hsOp;
    bhMesh.rotation.z += 0.02;
    bhRing.rotation.z += 0.03;
    bhRing.material.opacity = 0.3 * hsOp;
    bhInfo.material.opacity = 0.08 * hsOp;
    bhInfo.scale.setScalar(hsR / 1.0);
    bhGroup.visible = hsOp > 0.01;

    // Actualizar posición de flechas
    arrowGroup.children.forEach((arrow, i) => {
      const positions = [
        new THREE.Vector3(0, hsR * 1.2, 0),
        new THREE.Vector3(0, hsR * 0.7, 0),
        new THREE.Vector3(0, hsR * 0.3, 0)
      ];
      if (positions[i]) arrow.position.copy(positions[i]);
    });
  }

  // ==================== SLIDER ====================
  const slider = document.getElementById('time-slider');

  // ==================== LOOP ====================
  let last = performance.now();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    // Tiempo
    state.time = parseFloat(slider.value);
    const R = R_t(state.time);

    // Display
    const timeDisp = document.getElementById('time-display');
    const phaseDisp = document.getElementById('phase-display');
    if (timeDisp) timeDisp.textContent = `t=${state.time.toFixed(2)} R=${R.toFixed(2)}`;

    // El tiempo controla todo. El barrido cicla cada 10 segundos:
    // 0-2.5s: 1D → 2D (cuerda barre → membrana)
    // 2.5-5s: 2D → 3D (membrana barre → volumen)
    // 5-7.5s: 3D → 4D (volumen barre → hiperesfera)
    // 7.5-10s: descanso / todas visibles
    const cycleTime = (state.time % 10);
    const sweepPhase = cycleTime / 10; // 0..1 en cada ciclo

    let sweep1D2D, sweep2D3D, sweep3D4D;
    if (sweepPhase < 0.25) {
      sweep1D2D = sweepPhase / 0.25; // 0 → 1
      sweep2D3D = 0;
      sweep3D4D = 0;
    } else if (sweepPhase < 0.50) {
      sweep1D2D = 1;
      sweep2D3D = (sweepPhase - 0.25) / 0.25; // 0 → 1
      sweep3D4D = 0;
    } else if (sweepPhase < 0.75) {
      sweep1D2D = 1;
      sweep2D3D = 1;
      sweep3D4D = (sweepPhase - 0.50) / 0.25; // 0 → 1
    } else {
      sweep1D2D = 1;
      sweep2D3D = 1;
      sweep3D4D = 1;
    }

    // Fase actual para display
    let phase = '1D — Cuerda vibrante';
    if (sweep1D2D > 0.01 && sweep1D2D < 0.99) phase = '1D → 2D: Cuerda barriendo → Membrana';
    else if (sweep2D3D > 0.01 && sweep2D3D < 0.99) phase = '2D → 3D: Membrana barriendo → Volumen';
    else if (sweep3D4D > 0.01 && sweep3D4D < 0.99) phase = '3D → 4D: Volumen barriendo → Hiperesfera';
    else if (sweep1D2D >= 0.99 && sweep2D3D < 1) phase = '2D — Membrana (contorno: cuerda)';
    else if (sweep2D3D >= 0.99 && sweep3D4D < 1) phase = '3D — Volumen (contorno: membrana)';
    else if (sweep3D4D >= 0.99) phase = '4D — Hiperesfera completa';
    if (phaseDisp) phaseDisp.textContent = phase;

    // Actualizar todos los componentes
    updateString(state.time, R);
    updateMembrane(sweep1D2D, R);
    updateVolume(sweep2D3D, R);
    updateHyperspace(sweep3D4D, R);

    // Cámara orbita suavemente
    const angle = performance.now() * 0.0003;
    camera.position.x = Math.sin(angle) * 22;
    camera.position.z = Math.cos(angle) * 22;
    camera.position.y = 3 + Math.sin(time * 0.1) * 2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // ==================== RESIZE ====================
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})(window, document);
