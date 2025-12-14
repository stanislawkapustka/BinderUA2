-- Seed test users
-- Password for all: admin123
-- BCrypt hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyg0LhJQmhye
INSERT INTO users (username, email, first_name, last_name, password, role, contract_type, uop_gross_rate, b2b_hourly_net_rate, language)
VALUES
  ('admin', 'admin@binderua.com', 'Admin', 'User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyg0LhJQmhye', 'DYREKTOR', 'UOP', 8000.00, NULL, 'PL'),
  ('manager', 'manager@binderua.com', 'Manager', 'User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyg0LhJQmhye', 'MANAGER', 'UOP', 6000.00, NULL, 'EN'),
  ('employee', 'employee@binderua.com', 'Employee', 'User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyg0LhJQmhye', 'PRACOWNIK', 'B2B', NULL, 120.00, 'UA');

-- Seed test projects
INSERT INTO projects (name, description, manager_id, active)
VALUES
  ('Alpha Project', 'B2B Development Project', 2, TRUE),
  ('Bravo Project', 'UoP Design Project', 2, TRUE);

-- Seed test time entries for December 2025
INSERT INTO time_entries (user_id, project_id, date, total_hours, description, status, approved_by, approved_at)
VALUES
  (3, 1, '2025-12-01', 8.00, 'Backend development', 'ZATWIERDZONY', 2, CURRENT_TIMESTAMP),
  (3, 1, '2025-12-02', 7.50, 'API integration', 'ZATWIERDZONY', 2, CURRENT_TIMESTAMP),
  (3, 2, '2025-12-03', 6.00, 'UI design review', 'ZGLOSZONY', NULL, NULL),
  (3, 1, '2025-12-04', 8.00, 'Database optimization', 'ZATWIERDZONY', 2, CURRENT_TIMESTAMP),
  (3, 1, '2025-12-05', 5.50, 'Testing and QA', 'ZGLOSZONY', NULL, NULL);
