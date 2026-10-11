-- Personaje elegido (rata, gato, perro, zorro, panda, búho — ids que el
-- frontend mapea a su sprite pixel art).
ALTER TABLE users ADD COLUMN IF NOT EXISTS character TEXT;

-- Invitar amigos por código corto, en vez de requerir correo/notificaciones.
CREATE TABLE IF NOT EXISTS friend_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_friend_invites_code ON friend_invites(code);

-- Una fila por dirección (si A y B son amigos, hay (A,B) y (B,A)) para que
-- "mis amigos" sea una sola consulta simple por user_id.
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
