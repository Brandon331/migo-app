# Migo — backend

## Instalación

```bash
npm install
cp .env.example .env
# llena DATABASE_URL y OPENAI_API_KEY en .env
npm run migrate   # corre 001, 002, 003 y 004 en orden
npm run dev
```

## Última versión: duración, fechas y pacing

- `POST /goals` ahora recibe también `durationLabel` (`1_week` | `1_month` | `3_months` |
  `6_months_plus`) y `weeklyCommitment` (`low` | `medium` | `high`) — las respuestas del
  asistente de preguntas del frontend.
- Con eso se calcula `target_date` en la meta, y `due_date` en cada etapa (repartiendo la
  duración total proporcionalmente). Ver `src/utils/timeline.js`.
- Los prompts de IA (`src/services/ai.service.js`) usan esas respuestas para decidir cuántas
  etapas generar y qué tan grandes son los pasos — no es lo mismo una meta a 1 semana que a
  6 meses, ni alguien con 1 hora libre que alguien con 6.
- Las claves de `durationLabel`/`weeklyCommitment` deben coincidir exactamente con las que
  usa el frontend en `src/wizardOptions.js` — si agregas una opción nueva, actualiza ambos.

## Qué cambió en esta versión

Nuevo modelo de datos en dos niveles: **metas → etapas (milestones) → pasos chicos
(substeps)**, en vez de metas → pasos directo.

- `POST /goals` ya no genera pasos de una vez: genera el **camino completo** (etapas) vía
  `generateMilestones()`, y solo desglosa la **primera** etapa en pasos chicos vía
  `breakDownMilestone()`. Las demás etapas quedan `status: 'locked'`.
- `POST /goals/:id/retry-path` — reintenta generar el camino si falló (solo si la meta
  todavía no tiene ninguna etapa).
- `POST /milestones/:id/retry-breakdown` — reintenta el desglose de pasos chicos de una
  etapa activa si se quedó atorada.
- `/sync/push` ahora recibe `entity_type: "substep"` (antes era `"step"`). Al completarse
  el último substep pendiente de una etapa, el servidor automáticamente: marca la etapa
  `completed`, activa la siguiente, y le pide a la IA su desglose — todo dentro de
  `advanceMilestoneIfComplete()` en `src/services/milestone.service.js`.
- `/sync/pull` ahora regresa `goals`, `milestones` y `substeps` por separado (antes era
  `goals` y `steps`).

La tabla vieja `steps` (de la versión anterior) se queda en la base sin usarse — no afecta
nada, pero si quieres limpiar puedes borrarla tú mismo con `DROP TABLE steps;` una vez que
confirmes que ya no la necesitas.

## Endpoints

### Auth
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`

### Metas (requieren `Authorization: Bearer <accessToken>`)
- `GET /goals` — con `milestones` anidados, y dentro `substeps`
- `POST /goals` — `{ title }`
- `POST /goals/:id/retry-path`
- `PATCH /goals/:id` — `{ status }`
- `DELETE /goals/:id`

### Etapas
- `POST /milestones/:id/retry-breakdown`

### Sincronización
- `POST /sync/push` — `entity_type`: `"substep"` o `"goal"`
- `GET /sync/pull?since=<ISO date>`
