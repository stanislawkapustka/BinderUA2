-- V12__update_seed_password_hashes.sql
-- Purpose: Update seed user passwords to a working BCrypt hash for 'admin123' (cost 10)
-- Note: Existing migrations remain immutable; this adjusts data in a new version.

-- Known-good BCrypt hash for 'admin123' generated with BCryptPasswordEncoder(10)
-- $2a$10$SjENJstx7XGzG7b8ALKG7uSHJncUjcoj9Ttpx7wzLHRWLFXlVGcpK

UPDATE users
SET password = '$2a$10$SjENJstx7XGzG7b8ALKG7uSHJncUjcoj9Ttpx7wzLHRWLFXlVGcpK'
WHERE username IN ('admin','manager','employee');
