-- Soft delete: en vez de borrar la fila, la marcamos. Así /sync/pull puede
-- avisarle a otros dispositivos que la meta desapareció (si solo la
-- borráramos, el cliente nunca se enteraría y la seguiría mostrando local).
ALTER TABLE goals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
