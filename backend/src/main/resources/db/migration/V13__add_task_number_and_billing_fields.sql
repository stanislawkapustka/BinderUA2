-- V13__add_task_number_and_billing_fields.sql
-- Purpose: Add per-task number linked to project prefix, and billing fields.

ALTER TABLE tasks ADD COLUMN number VARCHAR(32);
ALTER TABLE tasks ADD COLUMN billing_type VARCHAR(16) NOT NULL DEFAULT 'HOURLY';
ALTER TABLE tasks ADD COLUMN unit_price NUMERIC(10,2);
ALTER TABLE tasks ADD COLUMN unit_name VARCHAR(64);

-- Ensure per-project uniqueness for non-empty numbers
CREATE UNIQUE INDEX IF NOT EXISTS ux_tasks_project_number
  ON tasks(project_id, number)
  WHERE number IS NOT NULL AND number <> '';
