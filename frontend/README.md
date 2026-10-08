# Migo — frontend (offline-first)

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## Qué cambió en esta versión

**Rediseño completo de identidad:** paleta vibrante (violeta/coral/amarillo), tipografía
Baloo 2 (display, redondeada) + Inter, mascota animada (`Mascot.jsx`) con mensajes según tu
progreso, modo oscuro completo.

**Nuevo modelo: camino en dos niveles.** Antes la IA generaba todos los pasos de golpe. Ahora:

1. Al crear una meta, la IA genera el **camino completo** — 4 a 7 **etapas** grandes
   (`milestones`), solo títulos y descripción corta. Eso es lo que se ve como el sendero
   (`PathView.jsx`): nodos conectados, bloqueados (🔒) excepto el primero.
2. Solo la etapa **activa** se desglosa en **pasos chicos** (`substeps`) — eso es lo único
   que puedes tachar en cada momento.
3. Al completar todos los pasos chicos de la etapa activa, se marca como completada, se
   desbloquea la siguiente, y el backend le pide a la IA su propio desglose automáticamente.
   Si no hay siguiente etapa, la meta completa queda "completed".

**Racha / progreso por día:** `StreakStrip.jsx` calcula, completamente local (desde
IndexedDB, sin pedir nada al servidor), los últimos 7 días con actividad y la racha actual.

## Cómo funciona el modo offline

Sin cambios de fondo respecto a la versión anterior: todo vive espejado en IndexedDB
(`src/db.js`, ahora con tablas `milestones` y `substeps` en vez de `steps`), cada acción se
guarda local primero y se sincroniza vía `src/hooks/useSync.js` en cuanto hay conexión.

Una diferencia: cuando marcas el último paso de una etapa sin conexión, el frontend avanza
la etapa de forma optimista (localmente), pero quien realmente desbloquea y desglosa la
siguiente etapa con IA es el backend — eso solo pasa al sincronizar.

## Para probar el modo offline de verdad

```bash
npm run build && npm run preview
```
(`npm run dev` no activa bien el service worker)

## Requiere

El backend actualizado (ver su propio README) — cambia el modelo de datos de `steps` a
`milestones` + `substeps`, así que necesitas correr `npm run migrate` ahí también.
