-- Update passwords with correct BCrypt hash for "admin123"
-- Hash generated with BCryptPasswordEncoder(10)
UPDATE users 
SET password = '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG13AO5j6kMARp9.Cy'
WHERE username IN ('admin', 'manager', 'employee');
