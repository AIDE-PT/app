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

    -- Validar se o Aider tem o cargo certo (Ajusta 'aider' se no teu DB estiver em PT como 'Cuidador')
    IF aider_type != 'aider' THEN
        RAISE EXCEPTION 'User assigned as user_id_aider must have the aider type';
    END IF;

    -- Validar se o Paciente tem o cargo certo
    IF patient_type != 'patient' AND patient_type != 'pacient' THEN
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