-- Guarda las respuestas del asistente inicial (duración deseada y tiempo
-- disponible por semana) y las fechas que se calculan a partir de ellas.
ALTER TABLE goals ADD COLUMN IF NOT EXISTS duration_label TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS weekly_commitment TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE;

-- Fecha límite de cada etapa, repartida proporcionalmente sobre la duración total.
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS due_date DATE;
