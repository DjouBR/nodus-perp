-- ============================================================
-- Migration 007 — Heart Rate Series & Session Check-in
-- NODUS — Fase 7.2
--
-- O quê cria/altera:
--   1. Cria tabela session_hr_series
--      Série temporal de FC gravada pelo ant-server (~5s/leitura)
--      Permite gráficos de FC do início ao fim da aula.
--
--   2. Altera tabela session_athletes
--      + checkin_at  DATETIME  (momento do check-in)
--      + checkout_at DATETIME  (momento da saída, opcional)
--      ~ calories    INT → DECIMAL(10,2)
--
-- IMPORTANTE sobre sensors.athlete_id:
--   O campo athlete_id em sensors não é removido — ele serve como
--   referência histórica do último atleta que usou o sensor.
--   O vínculo REAL por aula é feito via session_athletes.sensor_id
--   no momento do check-in. O mesmo atleta pode usar sensores
--   diferentes em aulas diferentes.
-- ============================================================

START TRANSACTION;

-- ────────────────────────────────────────────────────────────
-- 1. SESSION_HR_SERIES
-- Série temporal de FC por atleta por sessão
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_hr_series (
  id           CHAR(36)       NOT NULL,
  session_id   CHAR(36)       NOT NULL,   -- FK training_sessions.id
  athlete_id   CHAR(36)       NOT NULL,   -- FK users.id
  sensor_id    CHAR(36)       NULL,       -- FK sensors.id (qual sensor gravou)
  `timestamp`  DATETIME       NOT NULL,   -- momento da leitura
  hr_bpm       INT            NOT NULL,   -- FC em bpm
  hr_zone      TINYINT        NULL,       -- zona calculada (1-5)
  calories_acc DECIMAL(10,2)  NULL,       -- calorias acumuladas até este ponto
  block_type   VARCHAR(30)    NULL,       -- ex: 'warmup', 'main', 'cooldown'

  PRIMARY KEY (id),
  INDEX idx_hrs_session_athlete   (session_id, athlete_id),
  INDEX idx_hrs_athlete_time      (athlete_id, `timestamp`),
  INDEX idx_hrs_session_time      (session_id, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 2. SESSION_ATHLETES — adiciona colunas de check-in
-- Verifica antes de adicionar para tornar a migration reentrant
-- ────────────────────────────────────────────────────────────

-- checkin_at
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'session_athletes'
    AND COLUMN_NAME  = 'checkin_at'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE session_athletes ADD COLUMN checkin_at DATETIME NULL AFTER checked_in',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- checkout_at
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'session_athletes'
    AND COLUMN_NAME  = 'checkout_at'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE session_athletes ADD COLUMN checkout_at DATETIME NULL AFTER checkin_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- calories: INT → DECIMAL(10,2) se ainda for INT
SET @col_type = (
  SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'session_athletes'
    AND COLUMN_NAME  = 'calories'
);

SET @sql = IF(@col_type = 'int',
  'ALTER TABLE session_athletes MODIFY COLUMN calories DECIMAL(10,2) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;

-- ============================================================
-- Verificação pós-migration
-- ============================================================
SELECT 'session_hr_series' AS tabela, COUNT(*) AS colunas
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'session_hr_series'
UNION ALL
SELECT 'session_athletes (checkin_at)', COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME  = 'session_athletes'
    AND COLUMN_NAME = 'checkin_at';
