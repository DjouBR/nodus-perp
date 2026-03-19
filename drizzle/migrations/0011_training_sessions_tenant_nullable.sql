-- Migração: permite tenant_id NULL em training_sessions
-- Necessário para coaches independentes (role = 'coach') que não possuem tenant_id
-- Rodar com: npx drizzle-kit push  OU aplicar manualmente

ALTER TABLE `training_sessions`
  MODIFY COLUMN `tenant_id` VARCHAR(36) NULL;
