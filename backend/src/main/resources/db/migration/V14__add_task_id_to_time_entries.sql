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
ALTER TABLE time_entries ADD CONSTRAINT fk_task_id FOREIGN KEY (task_id) REFERENCES tasks(id);
