# Seguridad — Dimensiones Anidadas

Aplicación estática (HTML + JS) que corre entera en el navegador. No hay
backend, ni cuentas, ni peticiones de red.

## Cómo reportar

Escribe a **antarquia@riseup.net** con la URL, qué ocurre y cómo reproducirlo.

Si el fallo permite ejecutar código en el navegador de otra persona, no abras un
issue público: manda el correo primero.

## Medidas vigentes

- **Sin terceros en runtime**: Three.js, D3 y GSAP están vendorizados en `js/`;
  las tipografías, en `css/fonts/`. No se carga ninguna CDN.
- **CSP** en `index.html` y `capas/index.html` con `connect-src 'none'`: la
  página no puede enviar datos a ningún sitio, ni siquiera si se inyectara código.
- **`referrer`** limitado a `strict-origin-when-cross-origin`.
- **CI** (`.github/workflows/ci.yml`): valida el HTML, comprueba que no se
  reintroduzcan CDNs y escanea secretos con gitleaks.
- Sin `eval`, `new Function` ni manejadores `on*=` inline.

## Pendiente conocido

La CSP necesita `'unsafe-inline'` para el script y los estilos embebidos de
`capas/index.html`. Mover ese código a archivos aparte permitiría
`script-src 'self'` estricto.

## Alcance

Entra: XSS, dependencias vendorizadas manipuladas o desactualizadas, fugas de
datos por red.
No entra: resultados matemáticos o visuales incorrectos, ataques que requieran
control del dispositivo de la víctima.
