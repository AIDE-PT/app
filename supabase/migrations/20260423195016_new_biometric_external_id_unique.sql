-- ============================================================
-- MIGRAÇÃO: Constraint UNIQUE em biometric_data.external_id
-- Necessária para o upsert com onConflict: "external_id"
-- ============================================================
 
-- Remove o índice parcial anterior se existir
DROP INDEX IF EXISTS biometric_data_external_id_idx;
 
-- Adiciona constraint UNIQUE (reconhecida pelo Supabase para upsert)
ALTER TABLE biometric_data
ADD CONSTRAINT biometric_data_external_id_unique
UNIQUE (external_id);
 