import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getCharacterLocal, setCharacterLocal } from '../db.js';
import { api } from '../api.js';
import { useOnlineStatus } from './useOnlineStatus.js';

// Migo se ve distinto según el personaje que cada quien eligió en Perfil
// (rata/gato/perro/zorro/panda/búho) — este hook es la única fuente de
// verdad para eso, en cualquier pantalla. Se lee local primero (vía
// useLiveQuery, así que reacciona solo cuando Perfil lo cambia) y se
// refresca del servidor cuando hay conexión, por si se cambió desde otro
// dispositivo.
export function useCompanionCharacter() {
  const isOnline = useOnlineStatus();
  const [synced, setSynced] = useState(false);

  const character = useLiveQuery(() => getCharacterLocal(), []);

  useEffect(() => {
    if (!isOnline || synced) return;
    api
      .fetchMe()
      .then((me) => {
        setSynced(true);
        if (me && me.character !== undefined) {
          setCharacterLocal(me.character || null);
        }
      })
      .catch(() => {
        // sin conexión real o el endpoint falló — nos quedamos con lo local
        setSynced(true);
      });
  }, [isOnline, synced]);

  return character ?? null;
}
