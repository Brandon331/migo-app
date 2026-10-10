# Migo — frontend (offline-first)

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## Última versión: chat con Migo, paleta nueva y personalidad

- **Nueva pestaña "Migo" (chat):** `ChatPage.jsx` — habla con Migo sobre tus metas, pide
  consejo, o pregúntale por qué algo no avanza. Usa el contexto real de tus metas (lo arma
  el backend). Requiere conexión para responder — sin conexión ves tu historial pero no
  puedes mandar mensajes nuevos (`chat-offline-note`). El historial se cachea en IndexedDB
  (`db.chatMessages`) para que se vea de inmediato la próxima vez que abres la app.
- **Paleta "AI Companion":** toda la app cambió del tono crema anterior a
  `#625BFF` (violeta, color principal) / `#17172B` (oscuro, texto y modo oscuro) /
  `#83F0C4` (menta, logros y progreso) / `#F7F7FC` (fondo claro). Incluye el ícono de la
  PWA, el `theme-color`, y el degradado de `Mascot.jsx`.
- **Personalidad de Migo:** todos los textos de la app (login, mensajes de la mascota,
  banners, el asistente de preguntas, estados vacíos) se reescribieron con la voz de
  Migo — directo, cómplice, con humor, nunca corporativo ni infantil. La misma
  personalidad vive en el backend para el chat (`MIGO_SYSTEM_PROMPT`).
- **Fix:** al completar todos los pasos de una etapa activa, antes desaparecían — ya no.
  `PathView.jsx` sigue mostrando los pasos de una etapa completada (ahora deshabilitados,
  para que se vea lo que ya lograste).

## Versión anterior: asistente de preguntas, fechas y secciones

- **Nueva meta = asistente animado** (`GoalWizard.jsx`): meta → duración (opción múltiple) →
  tiempo disponible por semana (opción múltiple) → círculo de carga. Una pregunta a la vez,
  con transición. El botón "+ Nueva meta" lo abre.
- **Fechas reales:** cada meta tiene `targetDate` y cada etapa activa `dueDate`, calculados
  por el backend a partir de tus respuestas. `PathView.jsx` muestra "X días restantes" o
  "Atrasado" — como se calcula contra la fecha de hoy en cada render, si abres la app dos
  días después se ve actualizado solo, sin que nada lo "empuje".
- **App dividida en secciones** (`BottomNav.jsx` + `App.jsx`): Camino (lo de siempre),
  Progreso (`ProgressPage.jsx`: racha actual, racha más larga, pasos completados, gráfica de
  los últimos 14 días, % de avance por meta), Perfil (`ProfilePage.jsx`: correo, cerrar
  sesión).
- `src/wizardOptions.js` tiene las opciones del asistente — sus `value` deben coincidir con
  las que espera el backend (`src/utils/timeline.js` ahí).

## Qué cambió en la versión anterior

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
