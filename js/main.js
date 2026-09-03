/* ============================================================
   Dimensiones Anidadas — main.js
   Orquestador principal: inicializa todo cuando DOM está listo
   ============================================================ */

(function (window, document) {
  'use strict';

  // Asegura que los scripts de particle/3D tienen lo que necesitan
  // y revela la intro inicial

  function init() {
    // La intro se revela de inmediato
    const intro = document.querySelector('.intro-content');
    if (intro) {
      setTimeout(() => intro.classList.add('visible'), 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
