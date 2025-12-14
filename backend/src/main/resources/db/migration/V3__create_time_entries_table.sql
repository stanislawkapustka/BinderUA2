-- Create time_entries table
CREATE TABLE time_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    subproject_id BIGINT,
    date DATE NOT NULL,
    hours_from TIME,
    hours_to TIME,
    total_hours NUMERIC(5,2) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'ZGLOSZONY',
    approved_by BIGINT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_date ON time_entries(user_id, date);
CREATE INDEX idx_project_date ON time_entries(project_id, date);
CREATE INDEX idx_status ON time_entries(status);
