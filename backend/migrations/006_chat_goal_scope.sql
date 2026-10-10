-- Los chats pueden ser generales (goal_id NULL) o estar atados a una meta específica.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chat_messages_goal_id ON chat_messages(goal_id, created_at);
