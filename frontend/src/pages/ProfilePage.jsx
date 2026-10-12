import { useState } from 'react';
import { Mascot } from '../components/Mascot.jsx';
import { MigoStoryScreen } from './MigoStoryScreen.jsx';
import { CharacterAvatar } from '../components/CharacterAvatar.jsx';
import { CharacterPicker } from '../components/CharacterPicker.jsx';
import { api } from '../api.js';
import { setCharacterLocal } from '../db.js';
import { useCompanionCharacter } from '../hooks/useCompanionCharacter.js';

export function ProfilePage({ session, onLogout, isOnline }) {
  const [storyOpen, setStoryOpen] = useState(false);
  const character = useCompanionCharacter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handlePick(id) {
    setSaving(true);
    try {
      const updated = await api.updateCharacter(id);
      // Se cachea local de una vez — así Migo cambia de cara en Inicio y Chat
      // sin esperar al siguiente fetchMe.
      await setCharacterLocal(updated.character || null);
      setPickerOpen(false);
    } catch {
      // si falla, se queda como estaba — no hay nada local que desincronizar
    } finally {
      setSaving(false);
    }
  }

  if (storyOpen) {
    return <MigoStoryScreen onBack={() => setStoryOpen(false)} />;
  }

  return (
    <div>
      <h1>Perfil</h1>
      <Mascot message="Aquí está lo tuyo. Sin sorpresas." character={character} />

      <div className="profile-card">
        <span className="profile-label">Cuenta</span>
        <span className="profile-email">{session?.email || 'Sesión activa'}</span>
      </div>

      <div className="profile-card profile-character-card">
        <div className="profile-character-row">
          <CharacterAvatar characterId={character} size="lg" />
          <div className="profile-character-text">
            <span className="profile-label">Tu personaje</span>
            <span className="profile-character-sub">
              {character ? 'Esto es lo que ven tus amigos' : 'Todavía no eliges uno'}
            </span>
          </div>
        </div>
        <button
          className="secondary"
          onClick={() => setPickerOpen((v) => !v)}
          disabled={!isOnline}
        >
          {character ? 'Cambiar personaje' : 'Elegir personaje'}
        </button>
        {!isOnline && <p className="profile-character-offline">Necesitas conexión para esto.</p>}
        {pickerOpen && (
          <CharacterPicker value={character} onSelect={handlePick} disabled={saving} />
        )}
      </div>

      <button className="secondary profile-story-button" onClick={() => setStoryOpen(true)}>
        📖 Ver la historia de Migo
      </button>

      <button className="secondary" style={{ width: '100%', marginTop: '0.6rem' }} onClick={onLogout}>
        Cerrar sesión
      </button>

      <p className="profile-footnote">
        Uso el tema claro u oscuro de tu dispositivo, sin preguntarte. Tus metas viven aquí
        primero y se sincronizan solas en cuanto hay señal.
      </p>
    </div>
  );
}
