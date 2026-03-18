-- Migração: adiciona campos de recorrência à tabela training_sessions
-- Rodar com: npx drizzle-kit push   (ou aplicar manualmente no MySQL)

ALTER TABLE `training_sessions`
  ADD COLUMN `recurrence_group_id` VARCHAR(36) NULL AFTER `notes`,
  ADD COLUMN `recurrence_rule`     VARCHAR(50) NULL AFTER `recurrence_group_id`,
  ADD COLUMN `recurrence_end_date` DATE        NULL AFTER `recurrence_rule`;

-- Índice para buscar todas as ocorrências de um grupo rapidamente
CREATE INDEX `idx_recurrence_group` ON `training_sessions` (`recurrence_group_id`);
