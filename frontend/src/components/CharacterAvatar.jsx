import { getCharacter } from '../characters.js';

export function CharacterAvatar({ characterId, size = 'md' }) {
  const character = getCharacter(characterId);

  return (
    <div className={`char-avatar char-avatar-${size} ${!character ? 'is-empty' : ''}`}>
      {character ? (
        <img src={character.img} alt={character.label} draggable={false} />
      ) : (
        <span className="char-avatar-placeholder">?</span>
      )}
    </div>
  );
}
