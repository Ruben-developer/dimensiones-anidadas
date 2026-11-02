# Terceros — Dimensiones Anidadas

Todo el código de terceros está **vendorizado** en `js/` o `css/fonts/`. No se
carga nada desde una CDN en tiempo de ejecución.

| Archivo | Proyecto | Versión | Licencia |
| --- | --- | --- | --- |
| `js/three.min.js` | Three.js | r128 | MIT |
| `js/d3.min.js` | D3 | 7.9.0 | ISC |
| `js/gsap.min.js` | GSAP | 3.x | GSAP Standard License (uso gratuito) |
| `js/ScrollTrigger.min.js` | GSAP ScrollTrigger | 3.x | GSAP Standard License (uso gratuito) |
| `css/fonts/*.woff2` | Inter | — | SIL OFL 1.1 |
| `css/fonts/*.woff2` | Space Grotesk | — | SIL OFL 1.1 |

## Textos

- **Three.js** — MIT. Cabecera de licencia incluida en el propio `three.min.js`.
- **D3** — ISC. Cabecera incluida en `d3.min.js`.
- **GSAP / ScrollTrigger** — licencia estándar de GSAP:
  <https://gsap.com/standard-license>. Se usa la versión gratuita; no se
  modificó el código de la librería.
- **Inter** y **Space Grotesk** — SIL Open Font License 1.1. Textos completos en
  `css/fonts/OFL-inter.txt` y `css/fonts/OFL-space-grotesk.txt`.
