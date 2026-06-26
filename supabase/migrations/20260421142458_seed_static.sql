-- ============================================================
-- MIGRAÇÃO 2: Dados estáticos (listas do sistema)
-- Idempotente: pode correr múltiplas vezes sem duplicar dados.
-- ============================================================

-- TIPOS DE UTILIZADOR
INSERT INTO user_types (designation)
SELECT v.designation FROM (VALUES ('Aider'), ('Cuidado')) AS v(designation)
WHERE NOT EXISTS (SELECT 1 FROM user_types WHERE user_types.designation = v.designation);

-- TIPOS DE DISPOSITIVO
INSERT INTO device_types (designation)
SELECT v.designation FROM (VALUES ('Smartwatch'), ('Tensiómetro'), ('Glucómetro')) AS v(designation)
WHERE NOT EXISTS (SELECT 1 FROM device_types WHERE device_types.designation = v.designation);

-- TIPOS DE BIOMETRIA
INSERT INTO biometric_data_types (name, unit, description)
SELECT v.name, v.unit, v.description FROM (VALUES
  ('Pressão Arterial', 'mmHg', 'Pressão exercida pelo sangue nas paredes das artérias'),
  ('Batimento Cardíaco', 'bpm', 'Número de batimentos cardíacos por minuto'),
  ('Glicemia', 'mg/dL', 'Concentração de glicose no sangue'),
  ('Saturação de Oxigénio', '%', 'Percentagem de hemoglobina saturada com oxigénio'),
  ('Temperatura Corporal', '°C', 'Temperatura do corpo humano')
) AS v(name, unit, description)
WHERE NOT EXISTS (SELECT 1 FROM biometric_data_types WHERE biometric_data_types.name = v.name);

-- CONDIÇÕES MÉDICAS
INSERT INTO conditions (name, description)
SELECT v.name, v.description FROM (VALUES
  ('Hipertensão', 'Pressão arterial elevada de forma persistente'),
  ('Diabetes Tipo 2', 'Distúrbio metabólico com níveis elevados de glicose no sangue'),
  ('Insuficiência Cardíaca', 'O coração não bombeia sangue de forma eficiente')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM conditions WHERE conditions.name = v.name);

-- DISPOSITIVOS
INSERT INTO devices (device_type_id, device_model, source_platform)
SELECT dt.id, v.model, v.platform
FROM (VALUES
  ('Smartwatch', 'Apple Watch Series 9', 'iOS'),
  ('Smartwatch', 'Samsung Galaxy Watch 6', 'Android'),
  ('Tensiómetro', 'Omron M7 Intelli IT', 'Bluetooth')
) AS v(type_name, model, platform)
JOIN device_types dt ON dt.designation = v.type_name
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE devices.device_model = v.model);

-- BIOMETRIAS RECOMENDADAS POR CONDIÇÃO
INSERT INTO condition_recommended_biometrics (condition_id, biometric_data_type_id)
SELECT c.id, bdt.id
FROM (VALUES
  ('Hipertensão', 'Pressão Arterial'),
  ('Hipertensão', 'Batimento Cardíaco'),
  ('Diabetes Tipo 2', 'Glicemia'),
  ('Diabetes Tipo 2', 'Saturação de Oxigénio'),
  ('Insuficiência Cardíaca', 'Batimento Cardíaco'),
  ('Insuficiência Cardíaca', 'Saturação de Oxigénio')
) AS v(cond_name, bio_name)
JOIN conditions c ON c.name = v.cond_name
JOIN biometric_data_types bdt ON bdt.name = v.bio_name
WHERE NOT EXISTS (
  SELECT 1 FROM condition_recommended_biometrics crb
  WHERE crb.condition_id = c.id AND crb.biometric_data_type_id = bdt.id
);

-- BIOMETRIAS SUPORTADAS POR DISPOSITIVO
INSERT INTO device_supported_biometrics (device_id, biometric_data_type_id)
SELECT d.id, bdt.id
FROM (VALUES
  ('Apple Watch Series 9', 'Batimento Cardíaco'),
  ('Apple Watch Series 9', 'Saturação de Oxigénio'),
  ('Apple Watch Series 9', 'Temperatura Corporal'),
  ('Samsung Galaxy Watch 6', 'Batimento Cardíaco'),
  ('Samsung Galaxy Watch 6', 'Saturação de Oxigénio'),
  ('Omron M7 Intelli IT', 'Pressão Arterial')
) AS v(dev_model, bio_name)
JOIN devices d ON d.device_model = v.dev_model
JOIN biometric_data_types bdt ON bdt.name = v.bio_name
WHERE NOT EXISTS (
  SELECT 1 FROM device_supported_biometrics dsb
  WHERE dsb.device_id = d.id AND dsb.biometric_data_type_id = bdt.id
);