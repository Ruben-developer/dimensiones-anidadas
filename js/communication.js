/* ============================================================
   Dimensiones Anidadas — communication.js
   Diagrama SVG animado: flujos bidireccionales entre capas
   con partículas que recorren las conexiones.
   ============================================================ */

(function (window, document) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const DIMS_COLORS = { 1: '#8B5CF6', 2: '#3B82F6', 3: '#10B981', 4: '#F59E0B' };
  const NAMES = { 1: 'Vibración', 2: 'Superficie', 3: 'Volumen', 4: 'Hiperespacio' };

  const FLOWS = [
    { from: 1, to: 2, label: 'cuerda barre una superficie' },
    { from: 2, to: 3, label: 'fluctuaciones → materia oscura' },
    { from: 3, to: 2, label: 'agujero negro → info en horizonte' },
    { from: 3, to: 4, label: 'materia curva el 4D' },
    { from: 4, to: 3, label: 'Kaluza-Klein → EM, dilatón' },
    { from: 4, to: 2, label: 'separación de walls → masas' },
    { from: 1, to: 3, label: 'modos vibratorios → campo EM' }
  ];

  // Layout circular para que no quede tan plano
  function nodePos(d) {
    // ángulo: 4D arriba, bajando en el orden 1,2,3 a la izquierda/derecha
    const cx = 200, cy = 230;
    const angles = { 1: -2.6, 2: -1.6, 3: 1.6, 4: 2.6 };
    const rad = 130;
    const a = angles[d];
    return { x: cx + Math.sin(a) * rad, y: cy - Math.cos(a) * rad * 0.9 };
  }
  const POS = { 1: nodePos(1), 2: nodePos(2), 3: nodePos(3), 4: nodePos(4) };

  function build() {
    const holder = document.getElementById('comm-diagram');
    if (!holder) return;

    holder.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 500');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Defs
    const defs = document.createElementNS(NS, 'defs');
    for (let d = 1; d <= 4; d++) {
      const m = document.createElementNS(NS, 'marker');
      m.setAttribute('id', `arrow-${d}`);
      m.setAttribute('viewBox', '0 0 10 10');
      m.setAttribute('refX', '9');
      m.setAttribute('refY', '5');
      m.setAttribute('markerWidth', '6');
      m.setAttribute('markerHeight', '6');
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      p.setAttribute('fill', DIMS_COLORS[d]);
      m.appendChild(p);
      defs.appendChild(m);
    }
    svg.appendChild(defs);

    // Guardamos paths para animar partículas
    const paths = [];
    const midPoints = [];

    FLOWS.forEach((f, fi) => {
      const p1 = POS[f.from], p2 = POS[f.to];
      // Curva con control
      const ctrl = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 40 };
      const d = `M ${p1.x} ${p1.y} Q ${ctrl.x} ${ctrl.y} ${p2.x} ${p2.y}`;

      const line = document.createElementNS(NS, 'path');
      line.setAttribute('d', d);
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', DIMS_COLORS[f.from]);
      line.setAttribute('stroke-width', '1.6');
      line.setAttribute('stroke-dasharray', '4 4');
      line.setAttribute('opacity', '0.7');
      line.setAttribute('marker-end', `url(#arrow-${f.from})`);
      svg.appendChild(line);

      // Partícula (dot) que viajará por la curva
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', DIMS_COLORS[f.to]);
      dot.style.opacity = '0';
      svg.appendChild(dot);

      paths.push({ path: d, dot, from: f.from, to: f.to, idx: fi });

      // Etiqueta
      const mid = { x: ctrl.x, y: ctrl.y };
      midPoints.push(mid);
    });

    // Nodos
    for (let d = 1; d <= 4; d++) {
      const p = POS[d];
      const g = document.createElementNS(NS, 'g');

      // Halo
      const halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y);
      halo.setAttribute('r', 40);
      halo.setAttribute('fill', DIMS_COLORS[d]);
      halo.setAttribute('fill-opacity', '0.10');
      halo.setAttribute('stroke', DIMS_COLORS[d]);
      halo.setAttribute('stroke-width', '2');
      g.appendChild(halo);

      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', p.x); label.setAttribute('y', p.y - 2);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', DIMS_COLORS[d]);
      label.setAttribute('font-size', '16');
      label.setAttribute('font-weight', '700');
      label.textContent = `${d}D`;
      g.appendChild(label);

      const sub = document.createElementNS(NS, 'text');
      sub.setAttribute('x', p.x); sub.setAttribute('y', p.y + 16);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', '#ffffff');
      sub.setAttribute('font-size', '9');
      sub.setAttribute('opacity', '0.85');
      sub.textContent = NAMES[d];
      g.appendChild(sub);

      svg.appendChild(g);
    }

    // Mostrar etiquetas de flujo en tooltip/leyenda inferior
    const legend = document.createElementNS(NS, 'g');
    FLOWS.forEach((f, i) => {
      const lx = 8 + (i % 2) * 200;
      const ly = 430 + Math.floor(i / 2) * 14;
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', lx); t.setAttribute('y', ly);
      t.setAttribute('fill', DIMS_COLORS[f.from]);
      t.setAttribute('font-size', '10');
      t.textContent = `${f.from}D→${f.to}D  ${f.label}`;
      legend.appendChild(t);
    });
    svg.appendChild(legend);

    holder.appendChild(svg);

    // ---------- Animación de partículas ----------
    function getPoint(path, frac) {
      // aproximamos muestreando la curva bezier cuadrática
      const parts = path.split(' '); // M x y Q cx cy x y
      const x0 = parseFloat(parts[1]), y0 = parseFloat(parts[2]);
      const cx = parseFloat(parts[4]), cy = parseFloat(parts[5]);
      const x1 = parseFloat(parts[6]), y1 = parseFloat(parts[7]);
      const t = frac;
      const mt = 1 - t;
      return {
        x: mt*mt*x0 + 2*mt*t*cx + t*t*x1,
        y: mt*mt*y0 + 2*mt*t*cy + t*t*y1
      };
    }

    function animate() {
      const now = performance.now() / 1000;
      paths.forEach((p, i) => {
        const speed = 0.08 + (i % 3) * 0.03;
        const pos = (now * speed + i * 0.17) % 1.0;
        const pt = getPoint(p.path, pos);
        p.dot.setAttribute('cx', pt.x);
        p.dot.setAttribute('cy', pt.y);
        p.dot.style.opacity = String(0.9 - 0.5 * Math.abs(pos - 0.5));
      });
      requestAnimationFrame(animate);
    }
    if (typeof window.matchMedia !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Sin animación si el usuario prefiere reducir movimiento
    } else {
      requestAnimationFrame(animate);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

})(window, document);
