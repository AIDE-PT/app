-- ============================================================
-- MIGRAÇÃO 4: Row Level Security (RLS)
-- Garante que cada utilizador só acede aos seus próprios dados.
-- ============================================================

-- -----------------------------------------------
-- Ativar RLS em todas as tabelas com dados de utilizador
-- -----------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tabelas estáticas/públicas: sem RLS (qualquer utilizador autenticado pode ler)
-- user_types, conditions, biometric_data_types, device_types, devices,
-- condition_recommended_biometrics, device_supported_biometrics

-- -----------------------------------------------
-- USERS
-- Cada utilizador só vê e edita o seu próprio perfil.
-- -----------------------------------------------
CREATE POLICY "users: ver o próprio perfil"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: ver contas de cuidado"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_types ut
      WHERE ut.id = users.user_type_id
        AND lower(trim(ut.designation)) = 'cuidado'
    )
  );

CREATE POLICY "users: editar o próprio perfil"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users: criar o próprio perfil"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------
-- CARE_RELATIONS
-- Paciente e cuidador veem as relações em que participam.
-- -----------------------------------------------
CREATE POLICY "care_relations: ver as próprias relações"
  ON care_relations FOR SELECT
  USING (
    auth.uid() = user_id_pacient OR
    auth.uid() = user_id_aider
  );

CREATE POLICY "care_relations: cuidador pode criar relação"
  ON care_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id_aider);

CREATE POLICY "care_relations: cuidador pode apagar relação"
  ON care_relations FOR DELETE
  USING (auth.uid() = user_id_aider);

-- -----------------------------------------------
-- NOTES
-- Paciente e criador da nota podem ver.
-- Só o criador pode editar ou apagar.x
-- -----------------------------------------------
CREATE POLICY "notes: ver notas do próprio paciente ou criadas por mim"
  ON notes FOR SELECT
  USING (
    auth.uid() = patient_id OR
    auth.uid() = creator_id
  );

CREATE POLICY "notes: criar nota"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "notes: editar a própria nota"
  ON notes FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "notes: apagar a própria nota"
  ON notes FOR DELETE
  USING (auth.uid() = creator_id);

-- -----------------------------------------------
-- PATIENT_CONDITIONS
-- Paciente vê as suas condições.
-- Cuidadores com relação ativa também podem ver.
-- -----------------------------------------------
CREATE POLICY "patient_conditions: paciente vê as suas condições"
  ON patient_conditions FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM care_relations
      WHERE user_id_pacient = patient_conditions.patient_id
        AND user_id_aider = auth.uid()
    )
  );

CREATE POLICY "patient_conditions: inserir condição"
  ON patient_conditions FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- -----------------------------------------------
-- PATIENT_DEVICES
-- Paciente vê e gere os seus dispositivos.
-- -----------------------------------------------
CREATE POLICY "patient_devices: ver dispositivos próprios"
  ON patient_devices FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "patient_devices: adicionar dispositivo"
  ON patient_devices FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "patient_devices: remover dispositivo"
  ON patient_devices FOR DELETE
  USING (auth.uid() = patient_id);

-- -----------------------------------------------
-- BIOMETRIC_DATA
-- Paciente vê os seus dados.
-- Cuidadores veem se shared = TRUE.
-- -----------------------------------------------
CREATE POLICY "biometric_data: paciente vê os seus dados"
  ON biometric_data FOR SELECT
  USING (
    auth.uid() = patient_id OR
    (
      shared = TRUE AND
      EXISTS (
        SELECT 1 FROM care_relations
        WHERE user_id_pacient = biometric_data.patient_id
          AND user_id_aider = auth.uid()
      )
    )
  );

CREATE POLICY "biometric_data: paciente insere os seus dados"
  ON biometric_data FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "biometric_data: paciente edita os seus dados"
  ON biometric_data FOR UPDATE
  USING (auth.uid() = patient_id);

-- -----------------------------------------------
-- NOTIFICATIONS
-- Cada utilizador só vê as suas próprias notificações.
-- -----------------------------------------------
CREATE POLICY "notifications: ver as próprias notificações"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: marcar como lida"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aiders can view their care receivers"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM connections
    WHERE connections.aider_id = auth.uid() 
    AND connections.care_receiver_id = profiles.id
  )
  OR id = auth.uid() -- Can always see own profile
);
