-- Add manager fields to projects
ALTER TABLE projects ADD COLUMN manager_mggp VARCHAR(30);
ALTER TABLE projects ADD COLUMN manager_ua_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_projects_manager_ua_id ON projects(manager_ua_id);
