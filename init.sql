-- Database initialization script for Chicken Poop Bingo
-- This will run when the PostgreSQL container starts for the first time

-- Create the application database (if not exists)
-- Note: The database is already created by POSTGRES_DB env var, but this ensures it exists
SELECT 'CREATE DATABASE chicken_poop_bingo'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chicken_poop_bingo')\gexec

-- Connect to the application database
\c chicken_poop_bingo;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app user with necessary permissions (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'app_user') THEN
        CREATE USER app_user WITH PASSWORD 'secure_password_123';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE chicken_poop_bingo TO app_user;
GRANT ALL ON SCHEMA public TO app_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO app_user;

-- Create tables (these will be created by Drizzle migrations in the app, but we can prepare the schema)
-- The actual table creation will be handled by the application's migration system

-- Log successful initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;

-- Create a basic health check table
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'healthy',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO health_check (status) VALUES ('initialized') ON CONFLICT DO NOTHING;

-- Output success message
\echo 'Database initialization completed successfully!'