-- ============================================================
-- MIGRAÇÃO 4: Compatibilidade com Health Connect (Android)
-- Apenas ADD COLUMN — não altera nem remove nada existente.
-- ============================================================

-- Intervalo temporal (sono, passos, calorias, etc.)
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Valor secundário (ex: pressão arterial sistólica/diastólica)
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS value_secondary FLOAT;

-- App de origem por registo (ex: 'com.samsung.health', 'com.garmin.android.apps.connectmobile')
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS source_app TEXT;

-- ID externo do Health Connect (clientRecordId) — usado para evitar duplicados no sync
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Data de última modificação do registo no Health Connect
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ;

-- Índice único no external_id para garantir que não entram duplicados vindos do HC
CREATE UNIQUE INDEX IF NOT EXISTS biometric_data_external_id_idx
  ON biometric_data (external_id)
  WHERE external_id IS NOT NULL;