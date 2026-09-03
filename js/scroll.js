/* ============================================================
   Dimensiones Anidadas — scroll.js
   Sistema de scrollytelling con GSAP + ScrollTrigger
   ============================================================ */

(function (window, document) {
  'use strict';

  const isGsap = typeof window.gsap !== 'undefined';
  const isTrigger = typeof window.ScrollTrigger !== 'undefined';

  const DIMS = { 1: '#dim1', 2: '#dim2', 3: '#dim3', 4: '#dim4' };
  const SECTIONS = [
    '#intro', '#dim1', '#dim2', '#dim3', '#dim4',
    '#dim5', '#dim6', '#dim7', '#dim8', '#dim9'
  ];

  let currentSection = 'intro';

  // ---------- Revelar contenido al entrar en sección ----------
  function setupReveals() {
    const targets = document.querySelectorAll('.layer-content, .comm-header, .outro-content, .intro-content');
    targets.forEach((el) => {
      el.classList.remove('visible');
    });
  }

  // Activa la visibilidad según la sección activa
  function activateSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const content = target.querySelector('.layer-content, .comm-header, .outro-content, .intro-content');
    if (content) {
      // Revela el contenido de la sección activa
      content.classList.add('visible');
    }
  }

  function deactivateOthers(activeId) {
    SECTIONS.forEach((sel) => {
      if (sel === `#${activeId}`) return;
      const el = document.querySelector(sel);
      if (!el) return;
      const content = el.querySelector('.layer-content, .comm-header, .outro-content, .intro-content');
      if (content) content.classList.remove('visible');
    });
  }

  // ---------- Barra de progreso ----------
  function setupProgress() {
    const bar = document.getElementById('progress');
    if (!bar) return;

    const update = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      bar.style.width = `${Math.min(100, pct)}%`;
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---------- Navegación por botones de capa ----------
  function setupNav() {
    const btns = document.querySelectorAll('.dim-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const dim = btn.getAttribute('data-dim');
        const target = DIMS[dim];
        if (!target) return;
        document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Actualizar botón activo según scroll
    const onScrollNav = () => {
      const y = window.scrollY + window.innerHeight * 0.4;
      let active = null;
      SECTIONS.forEach((sel, i) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        if (y >= top) active = String(i); // no depende del dim directamente
      });

      // mapear sección -> dim activo
      let dimActive = null;
      if (['#dim1'].includes(SECTIONS[active])) dimActive = '1';
      else if (['#dim2'].includes(SECTIONS[active])) dimActive = '2';
      else if (['#dim3'].includes(SECTIONS[active])) dimActive = '3';
      else if (['#dim4'].includes(SECTIONS[active])) dimActive = '4';

      btns.forEach((b) => b.classList.remove('active'));
      if (dimActive) {
        btns.forEach((b) => {
          if (b.getAttribute('data-dim') === dimActive) b.classList.add('active');
        });
      }
    };

    window.addEventListener('scroll', onScrollNav, { passive: true });
    onScrollNav();
  }

  // ---------- Entrada por sección (IntersectionObserver) ----------
  function setupSectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) {
            currentSection = id;
            deactivateOthers(id);
            activateSection(id);
            // dispatch para capas 3D / otros
            window.dispatchEvent(new CustomEvent('sectionchange', { detail: { id } }));
          }
        }
      });
    }, { threshold: 0.5 });

    SECTIONS.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) observer.observe(el);
    });

    // Activar inicial
    activateSection('intro');
  }

  // ---------- Inicialización ----------
  function init() {
    setupProgress();
    setupNav();
    setupSectionObserver();
    setupReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
