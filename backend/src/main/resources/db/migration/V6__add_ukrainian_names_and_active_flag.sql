-- Add Ukrainian name fields and active flag to users table

ALTER TABLE users ADD COLUMN first_name_ua VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name_ua VARCHAR(100);
ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to be active by default
UPDATE users SET active = true WHERE active IS NULL;
