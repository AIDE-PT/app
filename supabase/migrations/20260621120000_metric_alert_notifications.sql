-- ============================================================
-- Persist metric alerts for the care account and associated aiders.
-- Also returns aider push tokens so the app can send Expo pushes.
-- ============================================================

DROP FUNCTION IF EXISTS dispatch_metric_alert_notification(uuid, text, text, text);

CREATE OR REPLACE FUNCTION dispatch_metric_alert_notification(
  p_patient_id uuid,
  p_type text,
  p_title text,
  p_content text
)
RETURNS TABLE (
  aider_id uuid,
  expo_push_token text,
  push_title text,
  push_body text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilizador nao autenticado';
  END IF;

  IF auth.uid() <> p_patient_id THEN
    RAISE EXCEPTION 'Apenas o proprio cuidado pode criar alertas de metricas';
  END IF;

  INSERT INTO notifications (user_id, type, title, content)
  SELECT target.user_id, p_type, p_title, p_content
  FROM (
    SELECT p_patient_id AS user_id
    UNION
    SELECT cr.user_id_aider AS user_id
    FROM care_relations cr
    WHERE cr.user_id_pacient = p_patient_id
  ) target;

  RETURN QUERY
  SELECT
    cr.user_id_aider AS aider_id,
    pt.expo_push_token,
    p_title AS push_title,
    p_content AS push_body
  FROM care_relations cr
  LEFT JOIN push_tokens pt
    ON pt.user_id = cr.user_id_aider
  WHERE cr.user_id_pacient = p_patient_id;
END;
$$;
