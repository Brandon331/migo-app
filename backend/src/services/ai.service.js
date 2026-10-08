import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Primer nivel: el "camino" completo de la meta, en etapas grandes.
 * Todavía no son accionables paso a paso — son el mapa general.
 */
export async function generateMilestones(goalTitle) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Divides una meta personal en el camino general para lograrla: de 4 a 7 etapas ' +
          'grandes, en orden lógico, cada una un hito real (no una tarea de 5 minutos). ' +
          'Responde ÚNICAMENTE con JSON: {"milestones": [{"title": "string", "description": "string"}]}. ' +
          'El title es corto (máx 6 palabras). La description explica en una frase qué se logra ahí.',
      },
      { role: 'user', content: `Meta: "${goalTitle}"` },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  return parsed.milestones || [];
}

/**
 * Segundo nivel: solo se llama para la etapa que está activa en este momento.
 * Aquí sí son pasos chicos y concretos que se pueden tachar en uno o dos días.
 */
export async function breakDownMilestone(goalTitle, milestoneTitle) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Divides UNA etapa de un camino hacia una meta en pasos pequeños y accionables, ' +
          'cada uno algo que se puede hacer en una sola sesión (minutos a un par de horas). ' +
          'Responde ÚNICAMENTE con JSON: {"steps": [{"title": "string", "description": "string"}]}. ' +
          'Entre 3 y 6 pasos, orden lógico, breves.',
      },
      {
        role: 'user',
        content: `Meta general: "${goalTitle}"\nEtapa actual a desglosar: "${milestoneTitle}"`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  return parsed.steps || [];
}
