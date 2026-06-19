-- ============================================================
-- MIGRATION: fix RLS on users table for aider-patient visibility
-- Allows an aider to read the profile of any user they have
-- a care_relation with, regardless of that user's type.
-- Without this, the dashboard query returns empty because the
-- existing "ver contas de cuidado" policy only matches users
-- whose user_type_id maps to 'cuidado' — users inserted via
-- the auto-signup trigger have user_type_id = NULL and are invisible.
-- ============================================================

CREATE POLICY "users: aider pode ver pacientes associados"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM care_relations cr
      WHERE cr.user_id_pacient = users.id
        AND cr.user_id_aider = auth.uid()
    )
  );
