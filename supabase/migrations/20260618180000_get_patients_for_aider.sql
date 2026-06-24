-- ============================================================
-- MIGRATION: SECURITY DEFINER function to fetch patients for an aider
-- Bypasses RLS entirely — eliminates the chain of failing policies
-- that caused NotesDashboard/report to return empty patient lists.
-- ============================================================

CREATE OR REPLACE FUNCTION get_patients_for_aider(p_aider_id uuid)
RETURNS TABLE (id uuid, name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email
  FROM care_relations cr
  JOIN users u ON u.id = cr.user_id_pacient
  WHERE cr.user_id_aider = p_aider_id;
END;
$$;
