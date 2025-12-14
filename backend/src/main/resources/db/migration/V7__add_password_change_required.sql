-- Add password change required flag

ALTER TABLE users ADD COLUMN password_change_required BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to not require password change (they already have passwords set)
UPDATE users SET password_change_required = false WHERE password_change_required IS NULL;
