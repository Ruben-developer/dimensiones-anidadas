# Dimensiones Anidadas — Modelo 1+2+3+4

Web scrollytelling que explica el modelo cosmológico de **dimensiones anidadas**: el universo como 10 dimensiones organizadas en 4 capas (**1D + 2D + 3D + 4D**) que vibran y se comunican entre sí.

## Descripción

- **1D** — La vibración original: una cuerda que genera todas las partículas.
- **2D** — La superficie (domain walls): materia oscura y energía oscura.
- **3D** — Nuestro universo: el único lugar donde la materia y la conciencia son estables.
- **4D** — El hiperespacio que proyecta el electromagnetismo y la gravedad.

## Tecnologías

- HTML5 + CSS3 + JavaScript (sin build step, estático)
- [GSAP](https://gsap.com/) + ScrollTrigger — animaciones de scroll
- [Three.js](https://threejs.org/) — visualización 3D de las esferas anidadas
- [D3.js](https://d3js.org/) — gráfica de datos cosmológicos (energía oscura w(z))

## Desarrollo local

Solo necesitas un servidor estático (por CORS de fetch a JSON):

```bash
python3 -m http.server 8000
# o
npx serve .
```

Abre `http://localhost:8000`.

## Deploy

GitHub Actions deploya automáticamente a GitHub Pages al hacer `push` a `main`:

```
https://Ruben-developer.github.io/dimensiones-anidadas/
```

## Estructura

```
├── index.html
├── css/
│   ├── main.css
│   └── sections.css
├── js/
│   ├── main.js
│   ├── scroll.js
│   ├── layers3d.js
│   ├── communication.js
│   ├── data.js
│   └── consciousness.js
├── data/
│   └── cosmology.json
└── .github/workflows/deploy.yml
```

---

Contenido basado en el vault de ontología. Modelo especulativo con predicciones observables.
