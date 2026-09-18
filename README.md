# Dimensiones Anidadas — Modelo 1+2+3+4

Web scrollytelling que explica el modelo cosmológico de **dimensiones anidadas**: el universo como 10 dimensiones organizadas en 4 capas (**1D + 2D + 3D + 4D**) que vibran y se comunican entre sí.

## Descripción

- **1D** — La vibración original: una cuerda que genera todas las partículas.
- **2D** — La superficie (domain walls): materia oscura y energía oscura.
- **3D** — Nuestro universo: el único lugar donde la materia y la conciencia son estables.
- **4D** — El hiperespacio que proyecta el electromagnetismo y la gravedad.

## Visualización 3D Interactiva

La capa 3D (`layers3d.js`) muestra **todas las dimensiones anidadas simultáneamente**:
- 4D como cascarón externo transparente con rayos KK
- 3D como esfera interna con anillos de curvatura
- 2D como membrana circular con fluctuaciones de DM
- 1D como cuerda vibrante con modos armónicos
- **BH** marcando la interfaz donde la 2D se asoma al 3D
- **Slider de tiempo** (⏱) que controla R(t) = 2.0 + 1.5·tanh((t-5)/2)
- Flechas de proyección entre capas
- Rotación automática con velocidad ajustable
- Todas las capas son interactivas (drag para rotar, scroll para zoom)

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
