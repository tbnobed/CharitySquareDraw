-- Database initialization script for Chicken Poop Bingo
-- This will run when the PostgreSQL container starts for the first time

-- We're already connected to chicken_poop_bingo database via POSTGRES_DB
-- No need to create or connect to database

-- Create extensions if needed (use pgcrypto instead of uuid-ossp for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- The app_user is already created by POSTGRES_USER env var
-- Grant additional permissions to ensure everything works
GRANT ALL ON SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO app_user;

-- Create the application tables directly since we're not using migrations in Docker
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    price_per_square INTEGER NOT NULL DEFAULT 1000,
    total_revenue INTEGER NOT NULL DEFAULT 0,
    winner_square INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS squares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL,
    game_round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    reserved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(number, game_round_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_rounds_status ON game_rounds(status);
CREATE INDEX IF NOT EXISTS idx_participants_game_round ON participants(game_round_id);
CREATE INDEX IF NOT EXISTS idx_squares_game_round ON squares(game_round_id);
CREATE INDEX IF NOT EXISTS idx_squares_participant ON squares(participant_id);
CREATE INDEX IF NOT EXISTS idx_squares_number_game ON squares(number, game_round_id);

-- Log successful initialization (optional pg_stat_statements optimization)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pg_stat_statements_info') THEN
        INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Create a basic health check table
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'healthy',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO health_check (status) VALUES ('initialized') ON CONFLICT DO NOTHING;

-- Output success message
\echo 'Database initialization completed successfully!'