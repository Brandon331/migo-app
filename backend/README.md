# Migo — backend

## Instalación

```bash
npm install
cp .env.example .env
# llena DATABASE_URL y OPENAI_API_KEY en .env
npm run migrate   # corre 001 a 006 en orden
npm run dev
```

## Última versión: chat por meta

- Migración `006_chat_goal_scope.sql` agrega `goal_id` (nullable) a `chat_messages`. Si es
  `NULL`, es el chat general; si tiene valor, es el hilo de esa meta específica.
- `GET /chat?goalId=<uuid>` — historial de ese hilo. Sin `goalId`, historial del chat
  general.
- `POST /chat` ahora recibe `{ message, goalId? }`. Si viene `goalId`, el contexto que se le
  pasa a la IA es solo de esa meta (su camino completo, etapas, pasos de la etapa activa) en
  vez del resumen de todas las metas — Migo responde enfocado en esa meta, no mezclando las
  demás.
- `GET /chat/threads` — lista las metas que ya tienen al menos un mensaje (con la fecha del
  último), por si se quiere armar un índice de conversaciones en el frontend más adelante.
  La versión actual del frontend arma ese índice directo de las metas activas, así que este
  endpoint es opcional.

## Versión anterior: chat con Migo

- Nuevo: `POST /chat` y `GET /chat` (migración `005_chat.sql`, tabla `chat_messages`).
  Requieren `Authorization` como el resto.
- `GET /chat` regresa el historial del usuario (hasta 200 mensajes, orden cronológico).
- `POST /chat` recibe `{ message }`, guarda el mensaje del usuario, arma el contexto de sus
  metas actuales (título, status, etapa activa, fecha objetivo) y le pide a la IA una
  respuesta con la personalidad de Migo (`chatWithMigo` en `src/services/ai.service.js`,
  que usa `MIGO_SYSTEM_PROMPT`: amigable, ingenioso, cómplice, directo, con humor
  contextual — nunca corporativo ni infantil, nunca culpa ni sermonea). Guarda y regresa
  tanto el mensaje del usuario como la respuesta.
- El chat no es offline-first como el resto de la app: necesita conexión porque cada
  respuesta pasa por el modelo. El frontend solo cachea el historial para verlo sin
  conexión.

## Versión anterior: duración, fechas y pacing

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

### Chat
- `GET /chat` — historial de mensajes con Migo
- `POST /chat` — `{ message }`, regresa `{ userMessage, reply }`
