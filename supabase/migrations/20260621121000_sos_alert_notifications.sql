-- ============================================================
-- Persist SOS alerts for associated aiders and return push tokens.
-- ============================================================

DROP FUNCTION IF EXISTS dispatch_sos_alert();

CREATE OR REPLACE FUNCTION dispatch_sos_alert()
RETURNS TABLE (
  aider_id uuid,
  expo_push_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  patient_id uuid := auth.uid();
  sos_title text := 'SOS ativado';
  sos_content text := 'Um cuidado associado ativou o pedido de socorro.';
BEGIN
  IF patient_id IS NULL THEN
    RAISE EXCEPTION 'Utilizador nao autenticado';
  END IF;

  INSERT INTO notifications (user_id, type, title, content)
  SELECT target.user_id, 'sos', sos_title, sos_content
  FROM (
    SELECT patient_id AS user_id
    UNION
    SELECT cr.user_id_aider AS user_id
    FROM care_relations cr
    WHERE cr.user_id_pacient = patient_id
      AND cr.user_id_aider IS NOT NULL
  ) target;

  RETURN QUERY
  SELECT
    cr.user_id_aider AS aider_id,
    pt.expo_push_token
  FROM care_relations cr
  LEFT JOIN push_tokens pt
    ON pt.user_id = cr.user_id_aider
  WHERE cr.user_id_pacient = patient_id
    AND cr.user_id_aider IS NOT NULL;
END;
$$;
