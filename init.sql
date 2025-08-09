-- Database initialization script for Chicken Poop Bingo
-- This will run when the PostgreSQL container starts for the first time

-- Create extensions first
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions to app_user
GRANT ALL ON SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO app_user;

-- Create game_rounds table (matching exact schema from shared/schema.ts)
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    price_per_square INTEGER NOT NULL DEFAULT 10,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    winner_square INTEGER,
    total_revenue INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participants table (matching exact schema from shared/schema.ts)
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    game_round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    squares JSONB NOT NULL,
    total_amount INTEGER NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create squares table (matching exact schema from shared/schema.ts)
CREATE TABLE IF NOT EXISTS squares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL,
    game_round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'available',
    reserved_at TIMESTAMP WITH TIME ZONE,
    sold_at TIMESTAMP WITH TIME ZONE,
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

-- Create health check table
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'healthy',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions again after table creation
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app_user;

INSERT INTO health_check (status) VALUES ('initialized') ON CONFLICT DO NOTHING;

\echo 'Database initialization completed successfully!'