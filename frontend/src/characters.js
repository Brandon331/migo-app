// Personajes pixel art que cada quien elige para su perfil — es lo que ven
// tus amigos en la sección de Amigos, separado del propio Migo (que sigue
// siendo el compañero violeta de siempre, no se elige).
export const CHARACTERS = [
  { id: 'rat', label: 'Rata', img: '/characters/rat.png' },
  { id: 'cat', label: 'Gato', img: '/characters/cat.png' },
  { id: 'dog', label: 'Perro', img: '/characters/dog.png' },
  { id: 'fox', label: 'Zorro', img: '/characters/fox.png' },
  { id: 'panda', label: 'Panda', img: '/characters/panda.png' },
  { id: 'owl', label: 'Búho', img: '/characters/owl.png' },
];

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || null;
}
