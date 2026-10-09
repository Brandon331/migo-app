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
