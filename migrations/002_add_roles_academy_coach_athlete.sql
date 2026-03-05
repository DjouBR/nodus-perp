-- ============================================================
-- Migration 002 — Adiciona roles academy_coach e academy_athlete
-- Executar no MySQL Workbench ou via terminal:
--   mysql -u root -p nodus_db < migrations/002_add_roles_academy_coach_athlete.sql
-- ============================================================

-- 1. Altera o ENUM de role adicionando os dois novos valores
ALTER TABLE users
  MODIFY COLUMN role ENUM(
    'super_admin',
    'tenant_admin',
    'academy_coach',
    'coach',
    'receptionist',
    'academy_athlete',
    'athlete'
  ) NOT NULL DEFAULT 'academy_athlete';

-- 2. Corrige registros antigos que foram inseridos com 'academy_coach' antes da migration
--    (podem ter ficado com valor inválido truncado)
UPDATE users SET role = 'academy_coach' WHERE role = '' AND tenant_id IS NOT NULL;

-- 3. Verifica o resultado
SELECT role, COUNT(*) as total FROM users GROUP BY role;
