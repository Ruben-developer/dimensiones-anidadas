/* ============================================================
   Dimensiones Anidadas — data.js
   Carga de datos cosmológicos y gráfica interactiva w(z) con D3
   ============================================================ */

(function (window, document) {
  'use strict';

  const COLORS = {
    1: '#8B5CF6', 2: '#3B82F6', 3: '#10B981', 4: '#F59E0B'
  };

  // Datos de la gráfica w(z): reconstrucción ilustrativa basada en DESI DR2
  // (w > -1 a z bajo, w < -1 a z ~0.75)
  function makeWData() {
    // Modelo aproximado CPL con w0=-0.9, wa=0.2 → shape cualitativo
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const z = i / 40 * 1.5;
      const w = -0.9 + 0.2 * (z / (1 + z));
      pts.push({ z, w });
    }
    return pts;
  }

  // Puntos "observados" ilustrativos (basados en bins de DESI)
  const OBS = [
    { z: 0.05, w: -0.88, err: 0.10 },
    { z: 0.25, w: -0.92, err: 0.09 },
    { z: 0.5,  w: -1.02, err: 0.11 },
    { z: 0.75, w: -1.10, err: 0.12 },
    { z: 1.0,  w: -1.05, err: 0.13 },
    { z: 1.25, w: -0.99, err: 0.14 },
    { z: 1.5,  w: -0.97, err: 0.16 }
  ];

  function buildChart() {
    const holder = document.getElementById('svg-wa');
    if (!holder) return;

    const width = holder.clientWidth || 760;
    const height = 320;
    const margin = { top: 24, right: 24, bottom: 40, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const data = makeWData();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    holder.appendChild(svg);

    // Escalas
    const x = (v) => margin.left + (v / 1.5) * innerW;
    const yMin = -1.35, yMax = -0.6;
    const y = (v) => margin.top + ((yMax - v) / (yMax - yMin)) * innerH;

    const NS = 'http://www.w3.org/2000/svg';

    // Marco
    const frame = document.createElementNS(NS, 'rect');
    frame.setAttribute('x', margin.left - 8);
    frame.setAttribute('y', margin.top - 8);
    frame.setAttribute('width', innerW + 16);
    frame.setAttribute('height', innerH + 16);
    frame.setAttribute('fill', 'rgba(10,10,26,0.3)');
    frame.setAttribute('rx', '8');
    svg.appendChild(frame);

    // Línea w = -1 (ΛCDM)
    const lambdaY = y(-1);
    const lineCDM = document.createElementNS(NS, 'line');
    lineCDM.setAttribute('x1', margin.left);
    lineCDM.setAttribute('x2', margin.left + innerW);
    lineCDM.setAttribute('y1', lambdaY);
    lineCDM.setAttribute('y2', lambdaY);
    lineCDM.setAttribute('stroke', 'rgba(255,255,255,0.25)');
    lineCDM.setAttribute('stroke-dasharray', '6 4');
    lineCDM.setAttribute('stroke-width', '1');
    svg.appendChild(lineCDM);

    // Etiqueta w=-1
    const lblCDM = document.createElementNS(NS, 'text');
    lblCDM.setAttribute('x', margin.left + innerW - 6);
    lblCDM.setAttribute('y', lambdaY - 6);
    lblCDM.setAttribute('text-anchor', 'end');
    lblCDM.setAttribute('fill', 'rgba(255,255,255,0.4)');
    lblCDM.setAttribute('font-size', '11');
    lblCDM.textContent = 'ΛCDM (w = −1)';
    svg.appendChild(lblCDM);

    // Curva w(z)
    function tracePath() {
      let d = '';
      data.forEach((p, i) => {
        d += `${i === 0 ? 'M' : 'L'} ${x(p.z)} , ${y(p.w)} `;
      });
      return d;
    }

    const curve = document.createElementNS(NS, 'path');
    curve.setAttribute('d', tracePath());
    curve.setAttribute('fill', 'none');
    curve.setAttribute('stroke', COLORS['3']);
    curve.setAttribute('stroke-width', '2.5');
    curve.setAttribute('opacity', '0');
    svg.appendChild(curve);

    // Puntos observados con barras de error
    OBS.forEach((o) => {
      const cx = x(o.z);
      const cy = y(o.w);
      const g = document.createElementNS(NS, 'g');

      const bar = document.createElementNS(NS, 'line');
      bar.setAttribute('x1', cx);
      bar.setAttribute('x2', cx);
      bar.setAttribute('y1', y(o.w - o.err));
      bar.setAttribute('y2', y(o.w + o.err));
      bar.setAttribute('stroke', 'rgba(245,158,11,0.6)');
      bar.setAttribute('stroke-width', '2');
      g.appendChild(bar);

      const p = document.createElementNS(NS, 'circle');
      p.setAttribute('cx', cx);
      p.setAttribute('cy', cy);
      p.setAttribute('r', '4');
      p.setAttribute('fill', COLORS['4']);
      p.setAttribute('opacity', '0.9');
      g.appendChild(p);

      svg.appendChild(g);
    });

    // Ejes
    const axisX = document.createElementNS(NS, 'g');
    [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5].forEach((v) => {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', x(v));
      t.setAttribute('y', height - 14);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', 'rgba(255,255,255,0.5)');
      t.setAttribute('font-size', '11');
      t.textContent = v.toFixed(2);
      axisX.appendChild(t);
    });
    svg.appendChild(axisX);

    const lblX = document.createElementNS(NS, 'text');
    lblX.setAttribute('x', margin.left + innerW / 2);
    lblX.setAttribute('y', height - 1);
    lblX.setAttribute('text-anchor', 'middle');
    lblX.setAttribute('fill', 'rgba(255,255,255,0.6)');
    lblX.setAttribute('font-size', '12');
    lblX.textContent = 'redshift z';
    svg.appendChild(lblX);

    const axisY = document.createElementNS(NS, 'g');
    [-1.3, -1.2, -1.1, -1.0, -0.9, -0.8, -0.7].forEach((v) => {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', margin.left - 10);
      t.setAttribute('y', y(v) + 4);
      t.setAttribute('text-anchor', 'end');
      t.setAttribute('fill', 'rgba(255,255,255,0.5)');
      t.setAttribute('font-size', '11');
      t.textContent = v.toFixed(1);
      axisY.appendChild(t);
    });
    svg.appendChild(axisY);

    // Animación de aparición
    if (typeof window.gsap !== 'undefined') {
      window.gsap.to(curve, { opacity: 1, duration: 1.4, ease: 'power2.out' });
    } else {
      curve.setAttribute('opacity', '1');
    }
  }

  // Reconstruir al redimensionar
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const holder = document.getElementById('svg-wa');
      if (holder) holder.innerHTML = '';
      buildChart();
    }, 200);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildChart);
  } else {
    buildChart();
  }

})(window, document);
