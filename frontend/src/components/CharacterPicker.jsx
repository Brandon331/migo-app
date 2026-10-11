import { CHARACTERS } from '../characters.js';
import { CharacterAvatar } from './CharacterAvatar.jsx';

export function CharacterPicker({ value, onSelect, disabled }) {
  return (
    <div className="char-picker">
      {CHARACTERS.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`char-picker-item ${value === c.id ? 'is-selected' : ''}`}
          onClick={() => onSelect(c.id)}
          disabled={disabled}
        >
          <CharacterAvatar characterId={c.id} size="md" />
          <span className="char-picker-label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
