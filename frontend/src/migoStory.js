// La historia de Migo — tono de libro de encantamientos, pero sin perder su
// voz: cómplice, con humor, nunca cursi. Se arma con o sin el nombre que la
// persona elija. Cada página trae su propia "escena" (glyph) y acento de
// color, para que la pantalla cambie de ánimo conforme avanza la historia.
export function buildMigoStory(name) {
  const who = name ? name : 'alguien';

  return [
    {
      title: name ? `La historia de ${name} y Migo` : 'La historia de Migo',
      text: 'Hace mucho — en ningún lugar y en todos a la vez — existía una criatura pequeña, violeta y demasiado curiosa para quedarse quieta.',
      glyph: '🔮',
      accent: 'violet',
    },
    {
      text: 'No tenía mapa ni horario. Iba de sueño en sueño, ahí donde alguien se quedaba mirando algo enorme sin saber por dónde empezar.',
      glyph: '🌙',
      accent: 'violet',
    },
    {
      text: 'Y ahí fue donde aprendió su primer secreto: los sueños grandes no asustan por ser grandes. Asustan por no tener un primer paso.',
      glyph: '🗝️',
      accent: 'yellow',
    },
    {
      text: 'Así que empezó a partirlos. Un sueño enorme, en un camino. Un camino, en etapas. Una etapa, en un paso tan chico que sí se puede hacer hoy mismo.',
      glyph: '🧭',
      accent: 'mint',
    },
    {
      text: `Un día, sin mucho anuncio, llegó hasta donde estaba ${who}. Vio una meta ahí parada, esperando, y decidió quedarse.`,
      glyph: '⭐',
      accent: 'coral',
    },
    {
      text: 'No vino a mandar ni a juzgar los días en que no avanzas. Vino a caminar al lado, con memoria de todo lo que ya lograste, y con el humor justo para los días difíciles.',
      glyph: '🫂',
      accent: 'mint',
    },
    {
      title: 'Y hasta aquí la historia conocida…',
      text: 'El resto todavía no está escrito. Ese lo escriben entre los dos, un paso a la vez.',
      glyph: '📖',
      accent: 'violet',
      isLast: true,
    },
  ];
}
