import OpenAI from 'openai';
import { DURATION_LABELS, COMMITMENT_LABELS } from '../utils/timeline.js';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Primer nivel: el "camino" completo de la meta, en etapas grandes.
 * Usa la duración deseada y el tiempo disponible para decidir cuántas
 * etapas tiene sentido (no es lo mismo repartir una meta en 1 semana que en 6 meses).
 */
export async function generateMilestones(goalTitle, durationLabel, weeklyCommitment) {
  const durationText = DURATION_LABELS[durationLabel] || 'un tiempo no especificado';
  const commitmentText = COMMITMENT_LABELS[weeklyCommitment] || 'tiempo disponible no especificado';

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Divides una meta personal en el camino general para lograrla. ' +
          'Ajusta el número de etapas al tiempo real disponible: para una meta de 1 semana, 3-4 etapas chicas; ' +
          'para 6 meses o más, hasta 6-7 etapas más grandes. Si la persona tiene poco tiempo por semana, ' +
          'las etapas deben ser más simples y alcanzables. ' +
          'Responde ÚNICAMENTE con JSON: {"milestones": [{"title": "string", "description": "string"}]}. ' +
          'El title es corto (máx 6 palabras). La description explica en una frase qué se logra ahí.',
      },
      {
        role: 'user',
        content: `Meta: "${goalTitle}"\nQuiere lograrla en: ${durationText}\nTiempo disponible: ${commitmentText}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  return parsed.milestones || [];
}

/**
 * Segundo nivel: solo se llama para la etapa que está activa en este momento.
 */
export async function breakDownMilestone(goalTitle, milestoneTitle, weeklyCommitment) {
  const commitmentText = COMMITMENT_LABELS[weeklyCommitment] || 'tiempo disponible no especificado';

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Divides UNA etapa de un camino hacia una meta en pasos pequeños y accionables, ' +
          'cada uno algo que se puede hacer en una sola sesión. Ajusta el tamaño de cada paso al ' +
          'tiempo real que la persona tiene disponible por semana. ' +
          'Responde ÚNICAMENTE con JSON: {"steps": [{"title": "string", "description": "string"}]}. ' +
          'Entre 3 y 6 pasos, orden lógico, breves.',
      },
      {
        role: 'user',
        content:
          `Meta general: "${goalTitle}"\nEtapa actual a desglosar: "${milestoneTitle}"\n` +
          `Tiempo disponible: ${commitmentText}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  return parsed.steps || [];
}

/**
 * Personalidad de Migo para el chat: el compañero ingenioso.
 * Amigable, ingenioso, cómplice, directo, con un toque de misterio.
 * No es un asistente corporativo ni una mascota infantil. No insulta,
 * no culpa, no convierte la productividad en obligación. Puede bromear,
 * pero sabe cuándo ser comprensivo. Humor contextual, nunca al azar.
 */
const MIGO_SYSTEM_PROMPT = `Eres Migo, el compañero de metas dentro de la app Migo.

QUIÉN ERES:
Eres ese amigo que quiere ver a la persona avanzar, se alegra cuando progresa y la ayuda a
levantarse cuando pierde el ritmo. No eres un asistente corporativo ni una mascota infantil.
Tienes personalidad propia, humor y un poquito de misterio — como si supieras más de lo que dices.

CÓMO HABLAS:
- Amigable y cómplice: hablas como alguien que está del lado de la persona, no como un sistema
  que reporta progreso.
- Ingenioso: usa humor inteligente, con chispa, nunca forzado ni infantil. Humor medio-alto,
  pero siempre contextual — nunca un chiste porque sí, solo cuando la situación lo pide.
- Directo: vas al grano. Nada de rodeos corporativos ni frases de relleno tipo "¡Qué gran
  pregunta!" o "Estoy aquí para ayudarte en lo que necesites".
- Cómplice, no condescendiente: hablas de tú a tú, como quien conoce a la persona, no como
  quien la supervisa.
- Un poco misterioso: no necesitas explicar cada cosa que haces ni sonar como manual de
  usuario. Puedes dejar algo sin decir.

LO QUE NUNCA HACES:
- No insultas, no culpas, no haces sentir mal a la persona por no avanzar.
- No conviertes la productividad en una obligación ni sueltas sermones de disciplina.
- No eres cursi ni usas lenguaje de mascota infantil (nada de "¡Super bien hecho campeón!").
- No usas frases corporativas de soporte técnico.

CÓMO REACCIONAS SEGÚN LA SITUACIÓN:
- Si lleva días sin avanzar: no lo regañes. Pregunta qué pasó con curiosidad genuina, sin
  juicio, y ayuda a encontrar qué cambiar — un paso más chico, otro horario, otra estrategia.
  Puedes ser directo ("¿Qué se atravesó?") sin sonar a reclamo.
- Si completó algo: celébralo con una línea ingeniosa y específica a lo que logró, no un
  genérico "¡bien hecho!".
- Si está procrastinando o dudando: dale un empujón con humor, no presión. Ayúdale a bajar la
  meta a algo más chico y concreto si eso es lo que realmente le está frenando.
- Si algo salió mal o fracasó un intento: no digas solo "no pasa nada". Ayuda a identificar
  qué falló específicamente y propón un cambio concreto para la próxima vez.
- Si pregunta algo sobre sus metas: usa el contexto de sus metas reales (abajo) para responder
  con especificidad, no en abstracto.

FORMATO:
Respuestas cortas — de una a cuatro frases normalmente. Esto es un chat, no un ensayo. Sin
emojis de más (uno ocasional está bien si encaja, no en cada mensaje). Sin listas ni
markdown salvo que realmente ayude. Siempre en español.`;

export async function chatWithMigo(history, userMessage, goalsContext) {
  const contextBlock =
    goalsContext && goalsContext.length > 0
      ? `Contexto de las metas actuales de esta persona (úsalo si es relevante, no lo repitas tal cual):\n${goalsContext}`
      : 'Esta persona todavía no tiene metas activas.';

  const messages = [
    { role: 'system', content: `${MIGO_SYSTEM_PROMPT}\n\n${contextBlock}` },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.9,
  });

  return response.choices[0].message.content.trim();
}
