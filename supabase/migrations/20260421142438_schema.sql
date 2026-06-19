-- 1. Função para validar se os papéis estão corretos antes de criar a relação
CREATE OR REPLACE FUNCTION validate_care_relation_roles() 
RETURNS TRIGGER AS $$
DECLARE
    aider_type text;
    patient_type text;
BEGIN
    -- Procurar a designação do tipo do Aider
    SELECT ut.designation INTO aider_type 
    FROM users u 
    JOIN user_types ut ON u.user_type_id = ut.id 
    WHERE u.id = NEW.user_id_aider;

    -- Procurar a designação do tipo do Paciente
    SELECT ut.designation INTO patient_type 
    FROM users u 
    JOIN user_types ut ON u.user_type_id = ut.id 
    WHERE u.id = NEW.user_id_pacient;

    aider_type := lower(trim(coalesce(aider_type, '')));
    patient_type := lower(trim(coalesce(patient_type, '')));

    -- Validar se o Aider tem o cargo certo
    IF aider_type NOT IN ('aider') THEN
        RAISE EXCEPTION 'User assigned as user_id_aider must have the aider type';
    END IF;

    -- Validar se o Paciente tem o cargo certo
    IF patient_type NOT IN ('cuidado', 'patient', 'pacient', 'paciente') THEN
        RAISE EXCEPTION 'User assigned as user_id_pacient must have the patient type';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar o Trigger na tabela correta (care_relations)
-- Se o trigger já existir de uma tentativa falhada, removemos primeiro
DROP TRIGGER IF EXISTS trigger_validate_care_relation_roles ON care_relations;

CREATE TRIGGER trigger_validate_care_relation_roles
BEFORE INSERT OR UPDATE ON care_relations
FOR EACH ROW EXECUTE FUNCTION validate_care_relation_roles();

-- 3. Função de pesquisa de cuidados por email
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
    JOIN user_types ut ON ut.id = u.user_type_id
    WHERE lower(trim(u.email)) = lower(trim(p_email))
      AND lower(trim(ut.designation)) = 'cuidado'
    LIMIT 1;
END;
$$;

-- 3. Regra de Segurança (RLS): Aider só vê biometria de quem ele cuida
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aiders can view their patients biometrics" ON biometric_data;

CREATE POLICY "Aiders can view their patients biometrics"
ON biometric_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM care_relations
    WHERE care_relations.user_id_aider = auth.uid() 
    AND care_relations.user_id_pacient = biometric_data.patient_id
  )
  OR patient_id = auth.uid() -- O próprio paciente também pode ver os seus dados
);
