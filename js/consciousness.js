/* ============================================================
   Dimensiones Anidadas — consciousness.js
   Animación canvas: cerebro integrando vibraciones de las 4 capas
   ============================================================ */

(function (window, document) {
  'use strict';

  const holder = document.getElementById('canvas-mind');
  if (!holder) return;

  const canvas = document.createElement('canvas');
  holder.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const rect = holder.getBoundingClientRect();
    W = rect.width || window.innerWidth;
    H = rect.height || window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Neuronas dentro de un contorno "cerebral" (elipse central)
  const N = 90;
  const nodes = [];
  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  for (let i = 0; i < N; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random()); // distribución uniforme en disco
    nodes.push({
      x: 0.5 + 0.42 * rad * Math.cos(angle),
      y: 0.5 + 0.38 * rad * Math.sin(angle),
      phase: Math.random() * Math.PI * 2,
      freq: 0.8 + Math.random() * 2.2,
      layer: Math.floor(Math.random() * 4)
    });
  }

  // Vecinos cercanos (para dibujar sinapsis)
  function dist(a, b) {
    const dx = (a.x - b.x);
    const dy = (a.y - b.y);
    return Math.sqrt(dx * dx + dy * dy);
  }
  const links = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (dist(nodes[i], nodes[j]) < 0.16) {
        links.push([i, j]);
      }
    }
  }

  let time = 0;
  let active = false;

  function onSection(e) {
    active = e.detail.id === 'dim7';
  }
  window.addEventListener('sectionchange', onSection);

  function ease(a, b, k) { return a + (b - a) * k; }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Aparición progresiva según se acerca la sección
    const target = active ? 1 : 0.25;
    time += 0.016;

    // Sinapsis
    ctx.lineWidth = 0.6;
    for (const [a, b] of links) {
      const na = nodes[a], nb = nodes[b];
      const ax = na.x * W, ay = na.y * H;
      const bx = nb.x * W, by = nb.y * H;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = `rgba(255,255,255,${0.05 * target})`;
      ctx.stroke();
    }

    // Neuronas: pulso con fase según capa
    for (const n of nodes) {
      const pulse = 0.5 + 0.5 * Math.sin(time * n.freq * 4 + n.phase);
      const r = (2 + pulse * 4) * target;
      const x = n.x * W, y = n.y * W;
      const c = COLORS[n.layer];

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.4 + 0.6 * pulse * target;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ondas EM coherentes que atraviesan el campo (proyección 4D→3D)
    ctx.lineWidth = 1.4;
    for (let w = 0; w < 3; w++) {
      const baseY = H * (0.3 + w * 0.2);
      const amp = (8 + w * 4) * target;
      const speed = time * (0.5 + w * 0.3);
      ctx.beginPath();
      for (let px = 0; px <= W; px += 4) {
        const yy = baseY + Math.sin(px * 0.02 - speed * 6 + w) * amp;
        if (px === 0) ctx.moveTo(px, yy);
        else ctx.lineTo(px, yy);
      }
      ctx.strokeStyle = COLORS[w % 4];
      ctx.globalAlpha = 0.35 * target;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

})(window, document);
