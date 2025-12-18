-- V14__add_task_id_to_time_entries.sql
-- Purpose: Add task_id and quantity columns to time_entries table for task-based time tracking
-- Updates indexes to use task_id instead of project_id

-- Add new columns
ALTER TABLE time_entries ADD COLUMN task_id BIGINT NOT NULL DEFAULT 1;
ALTER TABLE time_entries ADD COLUMN quantity NUMERIC(10, 2);

-- Make project_id optional
ALTER TABLE time_entries ALTER COLUMN project_id DROP NOT NULL;

-- Remove old hours_from and hours_to columns if they exist
ALTER TABLE time_entries DROP COLUMN IF EXISTS hours_from;
ALTER TABLE time_entries DROP COLUMN IF EXISTS hours_to;

-- Update total_hours to be optional (for unit-based tasks)
ALTER TABLE time_entries ALTER COLUMN total_hours DROP NOT NULL;

-- Drop old index and create new one
DROP INDEX IF EXISTS idx_project_date;
CREATE INDEX idx_task_date ON time_entries(task_id, date);

-- Add foreign key constraint for task_id
-- Ensure a default task with id=1 exists so existing rows with default 1 satisfy the FK
INSERT INTO tasks (id, title, description, project_id, active, created_at, updated_at)
SELECT 1, 'General', 'Default task created by migration V14', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE id = 1);

-- Make sure the tasks sequence is at least the max id to avoid duplicate key on further inserts
SELECT setval(pg_get_serial_sequence('tasks', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM tasks), 1));

ALTER TABLE time_entries ADD CONSTRAINT fk_task_id FOREIGN KEY (task_id) REFERENCES tasks(id);
