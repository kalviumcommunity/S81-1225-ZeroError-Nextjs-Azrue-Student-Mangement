-- Initialize the database schema for Student Task Manager
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_student_id ON tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);

-- Insert sample data for testing
INSERT INTO students (name, email, student_id) VALUES
    ('John Doe', 'john.doe@example.com', 'STU001'),
    ('Jane Smith', 'jane.smith@example.com', 'STU002'),
    ('Bob Johnson', 'bob.johnson@example.com', 'STU003')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (student_id, title, description, status, priority, due_date) VALUES
    (1, 'Complete Docker Assignment', 'Set up Docker and Docker Compose for the project', 'in_progress', 'high', NOW() + INTERVAL '7 days'),
    (1, 'Study for Database Exam', 'Review PostgreSQL concepts and practice queries', 'pending', 'high', NOW() + INTERVAL '14 days'),
    (2, 'Build REST API', 'Create RESTful API endpoints for task management', 'in_progress', 'medium', NOW() + INTERVAL '10 days'),
    (2, 'Write Unit Tests', 'Add test coverage for all API endpoints', 'pending', 'medium', NOW() + INTERVAL '12 days'),
    (3, 'Deploy to Azure', 'Deploy the application to Azure cloud platform', 'pending', 'high', NOW() + INTERVAL '21 days')
ON CONFLICT DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
