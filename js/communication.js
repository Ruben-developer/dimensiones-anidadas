/* ============================================================
   Dimensiones Anidadas — communication.js
   Diagrama SVG animado de flujos bidireccionales entre capas
   ============================================================ */

(function (window, document) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const DIMS_COLORS = {
    1: '#8B5CF6', 2: '#3B82F6', 3: '#10B981', 4: '#F59E0B'
  };

  // Definición de flujos (de, a, etiqueta, color-emisor)
  const FLOWS = [
    { from: 1, to: 2, label: 'La cuerda vibra y barre una superficie' },
    { from: 2, to: 3, label: 'Fluctuaciones de domain walls → materia oscura' },
    { from: 3, to: 2, label: 'Un agujero negro colapsa información en su horizonte' },
    { from: 3, to: 4, label: 'La materia 3D curva el espacio 4D (backreaction)' },
    { from: 4, to: 3, label: 'Proyección Kaluza-Klein → electromagnetismo, dilatón' },
    { from: 4, to: 2, label: 'Separación de walls determina masas (Higgs geométrico)' },
    { from: 1, to: 3, label: 'Modos vibratorios acoplados al campo EM' }
  ];

  // Posiciones de los nodos (centro de pantalla 400x400)
  const POS = {
    1: { x: 200, y: 100 },
    2: { x: 200, y: 200 },
    3: { x: 200, y: 300 },
    4: { x: 200, y: 400 }
  };

  function build() {
    const holder = document.getElementById('comm-diagram');
    if (!holder) return;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 500');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Defs: flechas (markers)
    const defs = document.createElementNS(NS, 'defs');
    for (let d = 1; d <= 4; d++) {
      const marker = document.createElementNS(NS, 'marker');
      marker.setAttribute('id', `arrow-${d}`);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '6');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('orient', 'auto');
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      path.setAttribute('fill', DIMS_COLORS[d]);
      marker.appendChild(path);
      defs.appendChild(marker);
    }
    svg.appendChild(defs);

    // Curvas (flujos) — se dibujan debajo de los nodos
    FLOWS.forEach((f) => {
      const p1 = POS[f.from];
      const p2 = POS[f.to];
      // Curva con control offset horizontal (zigzag por gravedad)
      const dx = (f.from === 1 && f.to === 3) ? 70 : 50;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const midX = 200 + dx * dir;

      const d = `M ${p1.x} ${p1.y} Q ${midX} , ${(p1.y + p2.y) / 2} ${p2.x} , ${p2.y}`;
      const line = document.createElementNS(NS, 'path');
      line.setAttribute('d', d);
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', DIMS_COLORS[f.from]);
      line.setAttribute('stroke-width', '1.6');
      line.setAttribute('stroke-dasharray', '5 4');
      line.setAttribute('opacity', '0.7');
      line.setAttribute('marker-end', `url(#arrow-${f.from})`);
      svg.appendChild(line);

      // Etiqueta
      const midT = 0.5;
      const bx = midX * 0.92 + 200 * 0.08;
      const by = (p1.y + p2.y) / 2 + 10 * dir;
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', bx);
      text.setAttribute('y', by);
      text.setAttribute('text-anchor', f.from === 1 ? 'middle' : 'middle');
      text.setAttribute('font-size', '9');
      text.setAttribute('fill', DIMS_COLORS[f.from]);
      text.setAttribute('opacity', '0.75');
      text.textContent = f.label;
      svg.appendChild(text);
    });

    // Nodos (esferas dimensionales)
    for (let d = 1; d <= 4; d++) {
      const p = POS[d];
      const g = document.createElementNS(NS, 'g');
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('r', 34);
      circle.setAttribute('fill', DIMS_COLORS[d]);
      circle.setAttribute('fill-opacity', '0.15');
      circle.setAttribute('stroke', DIMS_COLORS[d]);
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);

      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', p.x);
      label.setAttribute('y', p.y - 5);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', DIMS_COLORS[d]);
      label.setAttribute('font-size', '11');
      label.setAttribute('font-weight', '600');
      label.textContent = `${d}D`;
      g.appendChild(label);

      const sub = document.createElementNS(NS, 'text');
      sub.setAttribute('x', p.x);
      sub.setAttribute('y', p.y + 12);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', '#ffffff');
      sub.setAttribute('font-size', '8');
      sub.setAttribute('opacity', '0.8');
      sub.textContent = { 1: 'vibración', 2: 'superficie', 3: 'volumen', 4: 'hiperespacio' }[d];
      g.appendChild(sub);

      svg.appendChild(g);
    }

    holder.appendChild(svg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

})(window, document);
