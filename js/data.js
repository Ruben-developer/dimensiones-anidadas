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
      ['svg-wa', 'svg-ok', 'svg-gw'].forEach((id) => {
        const holder = document.getElementById(id);
        if (holder) holder.innerHTML = '';
      });
      buildChart();
      buildChartOk();
      buildChartGw();
    }, 200);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      buildChart();
      buildChartOk();
      buildChartGw();
    });
  } else {
    buildChart();
    buildChartOk();
    buildChartGw();
  }

  // ============================================================
  // Gráfica Ω_k — curvatura cósmica
  // ============================================================
  function buildChartOk() {
    const holder = document.getElementById('svg-ok');
    if (!holder) return;
    const width = holder.clientWidth || 480;
    const height = 320;
    const margin = { top: 24, right: 28, bottom: 30, left: 30 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    holder.appendChild(svg);

    // Rango del eje: -0.1 a 0.2 (plano en 0, curva positiva hacia arriba)
    const xMin = -0.1, xMax = 0.2;
    const yC = margin.top + innerH / 2;
    const x = (v) => margin.left + ((v - xMin) / (xMax - xMin)) * innerW;

    // Cero (plano, ΛCDM flat)
    const zeroX = x(0);
    const zeroL = document.createElementNS(NS, 'line');
    zeroL.setAttribute('x1', zeroX); zeroL.setAttribute('y1', margin.top);
    zeroL.setAttribute('x2', zeroX); zeroL.setAttribute('y2', margin.top + innerH);
    zeroL.setAttribute('stroke', 'rgba(255,255,255,0.3)');
    zeroL.setAttribute('stroke-dasharray', '5 4');
    svg.appendChild(zeroL);

    const lbl0 = document.createElementNS(NS, 'text');
    lbl0.setAttribute('x', zeroX); lbl0.setAttribute('y', margin.top + innerH + 16);
    lbl0.setAttribute('text-anchor', 'middle');
    lbl0.setAttribute('fill', 'rgba(255,255,255,0.55)');
    lbl0.setAttribute('font-size', '11');
    lbl0.textContent = 'plano Ωk = 0';
    svg.appendChild(lbl0);

    // Banda de rango observado [0.045, 0.102]
    const rLo = x(0.045), rHi = x(0.102);
    const band = document.createElementNS(NS, 'rect');
    band.setAttribute('x', rLo);
    band.setAttribute('y', margin.top);
    band.setAttribute('width', rHi - rLo);
    band.setAttribute('height', innerH);
    band.setAttribute('fill', '#F59E0B');
    band.setAttribute('fill-opacity', '0.18');
    band.setAttribute('rx', '4');
    svg.appendChild(band);

    // Valor central
    const cX = x(0.073);
    const mark = document.createElementNS(NS, 'circle');
    mark.setAttribute('cx', cX); mark.setAttribute('cy', yC);
    mark.setAttribute('r', '7');
    mark.setAttribute('fill', '#F59E0B');
    mark.setAttribute('opacity', '0');
    svg.appendChild(mark);
    const hLine = document.createElementNS(NS, 'line');
    hLine.setAttribute('x1', margin.left); hLine.setAttribute('y1', yC);
    hLine.setAttribute('x2', margin.left + innerW); hLine.setAttribute('y2', yC);
    hLine.setAttribute('stroke', '#F59E0B');
    hLine.setAttribute('stroke-width', '2');
    hLine.setAttribute('opacity', '0');
    svg.appendChild(hLine);

    const val = document.createElementNS(NS, 'text');
    val.setAttribute('x', cX); val.setAttribute('y', margin.top + 16);
    val.setAttribute('text-anchor', 'middle');
    val.setAttribute('fill', '#F59E0B');
    val.setAttribute('font-weight', '700');
    val.setAttribute('font-size', '20');
    val.setAttribute('opacity', '0');
    val.textContent = 'Ωk ≈ +0.07';
    svg.appendChild(val);

    const sig = document.createElementNS(NS, 'text');
    sig.setAttribute('x', cX); sig.setAttribute('y', margin.top + 38);
    sig.setAttribute('text-anchor', 'middle');
    sig.setAttribute('fill', 'rgba(255,255,255,0.6)');
    sig.setAttribute('font-size', '12');
    sig.setAttribute('opacity', '0');
    sig.textContent = '~2.76σ vs ΛCDM plano';
    svg.appendChild(sig);

    // animación
    if (window.gsap) {
      window.gsap.to([mark, hLine, val, sig], { opacity: 1, duration: 1.2, stagger: 0.2, ease: 'power2.out' });
    } else {
      [mark, hLine, val, sig].forEach((el) => el.setAttribute('opacity', '1'));
    }
  }

  // ============================================================
  // Gráfica GW — oscilación del horizonte (GW250114)
  // ============================================================
  function buildChartGw() {
    const holder = document.getElementById('svg-gw');
    if (!holder) return;
    const width = holder.clientWidth || 820;
    const height = 240;
    const margin = { top: 16, right: 16, bottom: 30, left: 26 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    holder.appendChild(svg);

    // Señal: oscilación a ~2ΩH que decae según κ (exponencial)
    const x = (v) => margin.left + (v / 1) * innerW;
    const yMid = margin.top + innerH / 2;
    const amp = innerH * 0.36;
    const y = (v) => yMid - v * amp;

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);

    function render(t) {
      let d = '';
      const samples = 240;
      for (let i = 0; i <= samples; i++) {
        const ti = i / samples;
        const env = Math.exp(-ti * 2.2); // decaimiento κ
        const osc = Math.sin(ti * 8 * Math.PI + t * 2) * env; // ~2ΩH
        const px = x(ti);
        const py = y(osc);
        d += `${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)} `;
      }
      path.setAttribute('d', d);
      path.setAttribute('stroke', '#3B82F6');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('opacity', '0.9');
    }
    render(0);

    // Envolventes de decaimiento
    [-1, 1].forEach((sgn) => {
      const envP = document.createElementNS(NS, 'path');
      let d = '';
      for (let i = 0; i <= 60; i++) {
        const ti = i / 60;
        const px = x(ti);
        const py = y(sgn * Math.exp(-ti * 2.2));
        d += `${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)} `;
      }
      envP.setAttribute('d', d);
      envP.setAttribute('fill', 'none');
      envP.setAttribute('stroke', 'rgba(59,130,246,0.3)');
      envP.setAttribute('stroke-dasharray', '3 4');
      svg.appendChild(envP);
    });

    // Eje
    const axis = document.createElementNS(NS, 'line');
    axis.setAttribute('x1', margin.left); axis.setAttribute('y1', yMid);
    axis.setAttribute('x2', margin.left + innerW); axis.setAttribute('y2', yMid);
    axis.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    svg.appendChild(axis);

    const lbl = document.createElementNS(NS, 'text');
    lbl.setAttribute('x', margin.left + innerW); lbl.setAttribute('y', yMid + 18);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('fill', 'rgba(255,255,255,0.5)');
    lbl.setAttribute('font-size', '11');
    lbl.textContent = 'tiempo →  (oscilación ~2ΩH, decaimiento κ)';
    svg.appendChild(lbl);
  }

})(window, document);

