-- ============================================================
-- Debug: verifica se o email Dhjuf@hutd.com foi cadastrado
-- e qual é o estado do registro
-- ============================================================

-- Busca o usuário pelo email (case-insensitive)
SELECT 
  id, name, email, role, is_active, tenant_id,
  created_at
FROM users
WHERE LOWER(email) = LOWER('Dhjuf@hutd.com');

-- Verifica se tem athlete_profile associado
SELECT 
  u.id, u.name, u.email, u.role, u.is_active,
  ap.status as profile_status,
  ap.enrollment_date
FROM users u
LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
WHERE LOWER(u.email) = LOWER('Dhjuf@hutd.com');

-- Conta todos os atletas no banco para conferência
SELECT role, COUNT(*) as total FROM users 
WHERE role IN ('athlete', 'academy_athlete') 
GROUP BY role;
