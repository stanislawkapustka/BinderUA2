-- Add project number column
ALTER TABLE projects ADD COLUMN number VARCHAR(12) NOT NULL DEFAULT '';

-- If you want number to be unique, uncomment the next line
-- CREATE UNIQUE INDEX idx_projects_number ON projects(number);
