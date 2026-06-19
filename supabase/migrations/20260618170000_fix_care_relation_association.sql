-- ============================================================
-- MIGRATION: fix care relation association flow
-- Corrige o trigger de roles, a pesquisa por email e o seed de notas.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Trigger permissivo para validar roles nas relações
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_validate_care_relation_roles ON care_relations;
DROP FUNCTION IF EXISTS validate_care_relation_roles();

CREATE OR REPLACE FUNCTION validate_care_relation_roles()
RETURNS TRIGGER AS $$
DECLARE
    aider_type text;
    patient_type text;
BEGIN
    SELECT lower(trim(ut.designation)) INTO aider_type
    FROM users u
    JOIN user_types ut ON u.user_type_id = ut.id
    WHERE u.id = NEW.user_id_aider;

    SELECT lower(trim(ut.designation)) INTO patient_type
    FROM users u
    JOIN user_types ut ON u.user_type_id = ut.id
    WHERE u.id = NEW.user_id_pacient;

    -- Só valida se os tipos estiverem definidos
    IF aider_type IS NOT NULL AND aider_type != 'aider' THEN
        RAISE EXCEPTION 'O utilizador aider não tem o tipo correto';
    END IF;

    IF patient_type IS NOT NULL
       AND patient_type NOT IN ('cuidado', 'patient', 'paciente') THEN
        RAISE EXCEPTION 'O utilizador paciente não tem o tipo correto';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_care_relation_roles
BEFORE INSERT OR UPDATE ON care_relations
FOR EACH ROW EXECUTE FUNCTION validate_care_relation_roles();

-- ------------------------------------------------------------
-- 2) Pesquisa por email sem bloquear utilizadores sem tipo
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION find_care_by_email(p_email text)
RETURNS TABLE (
    id uuid,
    email text,
    user_type_id uuid,
    name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.user_type_id,
        u.name
    FROM users u
    WHERE lower(trim(u.email)) = lower(trim(p_email))
    LIMIT 1;
END;
$$;

-- ------------------------------------------------------------
-- 3) Corrigir seed de notas para usar content
-- ------------------------------------------------------------
INSERT INTO notes (patient_id, creator_id, title, content, reference_date)
SELECT p.id, a.id, 'Observação Diária', 'O paciente apresentou bons níveis de energia hoje.', CURRENT_DATE
FROM users p, users a
WHERE p.email = 'leo@paciente.com'
  AND a.email = 'joana@cuidadora.com'
  AND NOT EXISTS (
    SELECT 1 FROM notes
    WHERE patient_id = p.id AND title = 'Observação Diária'
  );
