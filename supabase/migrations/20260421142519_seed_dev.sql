-- ============================================================
-- MIGRAÇÃO 3: Dados de desenvolvimento/teste
-- Idempotente: pode correr múltiplas vezes sem duplicar dados.
-- ⚠️  NÃO CORRER EM PRODUÇÃO
-- ============================================================

-- UTILIZADORES DE TESTE
INSERT INTO users (name, email, user_type_id, age)
SELECT v.name, v.email, ut.id, v.age
FROM (VALUES
  ('Léo Paciente',    'leo@paciente.com',    'Cuidado', 30),
  ('Joana Cuidadora', 'joana@cuidadora.com', 'Aider',   45)
) AS v(name, email, type_name, age)
JOIN user_types ut ON ut.designation = v.type_name
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.email = v.email);

-- RELAÇÃO DE CUIDADO (Joana cuida de Léo)
INSERT INTO care_relations (user_id_pacient, user_id_aider)
SELECT p.id, a.id
FROM users p, users a
WHERE p.email = 'leo@paciente.com'
  AND a.email = 'joana@cuidadora.com'
  AND NOT EXISTS (
    SELECT 1 FROM care_relations
    WHERE user_id_pacient = p.id AND user_id_aider = a.id
  );

-- NOTAS
INSERT INTO notes (patient_id, creator_id, title, description, reference_date)
SELECT p.id, a.id, 'Observação Diária', 'O paciente apresentou bons níveis de energia hoje.', CURRENT_DATE
FROM users p, users a
WHERE p.email = 'leo@paciente.com'
  AND a.email = 'joana@cuidadora.com'
  AND NOT EXISTS (
    SELECT 1 FROM notes
    WHERE patient_id = p.id AND title = 'Observação Diária'
  );

-- CONDIÇÕES DO PACIENTE
INSERT INTO patient_conditions (patient_id, condition_id, diagnosed_at)
SELECT u.id, c.id, '2024-01-15'
FROM users u, conditions c
WHERE u.email = 'leo@paciente.com'
  AND c.name = 'Hipertensão'
  AND NOT EXISTS (
    SELECT 1 FROM patient_conditions
    WHERE patient_id = u.id AND condition_id = c.id
  );

-- DISPOSITIVO DO PACIENTE
INSERT INTO patient_devices (patient_id, device_id)
SELECT u.id, d.id
FROM users u, devices d
WHERE u.email = 'leo@paciente.com'
  AND d.device_model = 'Apple Watch Series 9'
  AND NOT EXISTS (
    SELECT 1 FROM patient_devices
    WHERE patient_id = u.id AND device_id = d.id
  );

-- DADOS BIOMÉTRICOS DE TESTE
INSERT INTO biometric_data (patient_id, biometric_data_type_id, device_id, value, measured_at)
SELECT u.id, bdt.id, d.id, v.value, NOW() - v.offset_interval
FROM users u
JOIN devices d ON d.device_model = 'Apple Watch Series 9'
JOIN (VALUES
  ('Batimento Cardíaco', 72.5, '2 hours'::interval),
  ('Batimento Cardíaco', 68.0, '1 day'::interval),
  ('Saturação de Oxigénio', 98.0, '2 hours'::interval)
) AS v(bio_name, value, offset_interval) ON true
JOIN biometric_data_types bdt ON bdt.name = v.bio_name
WHERE u.email = 'leo@paciente.com'
  AND NOT EXISTS (
    SELECT 1 FROM biometric_data bd
    WHERE bd.patient_id = u.id
      AND bd.biometric_data_type_id = bdt.id
      AND bd.value = v.value
  );

-- NOTIFICAÇÕES DE TESTE
INSERT INTO notifications (user_id, type, title, content)
SELECT u.id, v.type, v.title, v.content
FROM users u
JOIN (VALUES
  ('info',  'Bem-vindo',          'A tua conta foi configurada com sucesso.'),
  ('alert', 'Lembrete de medição','Ainda não registaste a tua pressão arterial hoje.')
) AS v(type, title, content) ON true
WHERE u.email = 'leo@paciente.com'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = v.title
  );