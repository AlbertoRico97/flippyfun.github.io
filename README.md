# Flippy fun - Juego Web

**Flippy fun** es mi propuesta individual para un juego web indie básico y minimalista en puro JavaScript** Flippy fun: controla un pez que vuela entre tuberías. ¡Sobrevive, suma puntos y bate tu record!

## Link del juego

Aqui pondre el link

## Características Minimalistas

- **Canvas puro**: 400x600px, 60FPS suaves con `requestAnimationFrame`.
- **Física realista**: Gravedad, salto, rotación por velocidad.
- **Procedimental**: Tuberías infinitas con gap variable (sin repetición).
- **Controles**: Click/Espacio (salto), R (reinicio).
- **Progreso**: LocalStorage para highscore.
- **Estilo indie**: Pixel art, neón (#0f0/#ff0), fondo degradado espacial.
- **Responsive**: Funciona en móvil/PC.

## Tech Stack

- **JS** + **HTML5 Canvas** (sin frameworks).
- **Despliegue**: GitHub.

## Cómo Funciona (Código Transparente)

| Componente | Descripción | Código Clave |
|------------|-------------|-------------|
| **Pez** | Círculo rotado con `ctx.rotate(vy * 0.1)`. | `vy += gravedad; y += vy` |
| **Tuberias** | Rects verdes, spawn cada 90 frames. | `if (frame % 90 === 0)` |
| **Colisiones** | AABB simple vs círculo. | `x + radio > t.x && ...` |
| **Puntuación** | +1 al pasar tubo. | `if (t.x + ancho < x && !pasado)` |

## Desarrollo y Despliegue

1. Clone este repo.
2. Edita index.html y javascript.js.
3. git add . && git commit -m "Update" && git push.
4. GitHub Pages auto-despliega.

## Mejoras Futuras (Roadmap Indie)

- Sonidos Web Audio API.
- Power-ups (salto doble).
- Multiplayer WebSockets.

## Propuesta Individual

- Objetivo: Demostrar en JS/Canvas para juegos web indie.
- Tiempo: 4 horas (minimalista).
- Personalización: Tema (neón xAI).
- Por qué minimalista: Un archivo y cero dependencias.

**Hecho por Luis Alberto Rico Jimenez.**
