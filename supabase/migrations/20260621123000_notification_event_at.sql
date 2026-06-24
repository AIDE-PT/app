-- ============================================================
-- Store the real event time for notifications.
-- For metric alerts, this is the Health Connect measurement time,
-- not the moment the notification row was created.
-- ============================================================

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS event_at timestamptz;

DROP FUNCTION IF EXISTS dispatch_metric_alert_notification(uuid, text, text, text);
DROP FUNCTION IF EXISTS dispatch_metric_alert_notification(uuid, text, text, text, timestamptz);

CREATE OR REPLACE FUNCTION dispatch_metric_alert_notification(
  p_patient_id uuid,
  p_type text,
  p_title text,
  p_content text,
  p_event_at timestamptz DEFAULT now()
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

  INSERT INTO notifications (user_id, type, title, content, event_at)
  SELECT target.user_id, p_type, p_title, p_content, p_event_at
  FROM (
    SELECT p_patient_id AS user_id
    UNION
    SELECT cr.user_id_aider AS user_id
    FROM care_relations cr
    WHERE cr.user_id_pacient = p_patient_id
      AND cr.user_id_aider IS NOT NULL
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
  WHERE cr.user_id_pacient = p_patient_id
    AND cr.user_id_aider IS NOT NULL;
END;
$$;
