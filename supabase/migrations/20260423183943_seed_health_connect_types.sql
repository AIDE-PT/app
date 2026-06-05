-- ============================================================
-- MIGRAÇÃO: Tipos de biometria para o Health Connect
-- Nomes em inglês conforme usados no healthBackgroundSync.ts
-- Idempotente: pode correr múltiplas vezes sem duplicar dados.
-- ============================================================

INSERT INTO biometric_data_types (name, unit, description)
SELECT v.name, v.unit, v.description FROM (VALUES
  ('heart_rate',            'bpm',   'Heart rate from Health Connect'),
  ('steps',                 'steps', 'Step count from Health Connect'),
  ('sleep',                 'hours', 'Sleep duration from Health Connect'),
  ('blood_pressure',        'mmHg',  'Blood pressure from Health Connect'),
  ('body_temperature',      '°C',    'Body temperature from Health Connect'),
  ('oxygen_saturation',     '%',     'Oxygen saturation from Health Connect'),
  ('total_calories_burned', 'kcal',  'Calories burned from Health Connect')
) AS v(name, unit, description)
WHERE NOT EXISTS (
  SELECT 1 FROM biometric_data_types WHERE biometric_data_types.name = v.name
);