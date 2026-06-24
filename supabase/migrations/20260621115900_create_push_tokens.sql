-- ============================================================
-- Store Expo push tokens per user/device.
-- Must exist before notification dispatch functions reference it.
-- ============================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  device_platform text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, expo_push_token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens: ver os proprios tokens" ON push_tokens;
CREATE POLICY "push_tokens: ver os proprios tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens: criar o proprio token" ON push_tokens;
CREATE POLICY "push_tokens: criar o proprio token"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens: atualizar o proprio token" ON push_tokens;
CREATE POLICY "push_tokens: atualizar o proprio token"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens: apagar o proprio token" ON push_tokens;
CREATE POLICY "push_tokens: apagar o proprio token"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);
