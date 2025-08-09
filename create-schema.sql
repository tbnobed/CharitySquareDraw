-- Chicken Poop Bingo Database Schema Creation
-- This will create all necessary tables if they don't exist

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if they exist (to force recreation)
DROP TABLE IF EXISTS squares CASCADE;
DROP TABLE IF EXISTS participants CASCADE; 
DROP TABLE IF EXISTS game_rounds CASCADE;
DROP TABLE IF EXISTS health_check CASCADE;

-- Create game_rounds table
CREATE TABLE game_rounds (
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

-- Create participants table
CREATE TABLE participants (
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

-- Create squares table
CREATE TABLE squares (
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

-- Create indexes
CREATE INDEX idx_game_rounds_status ON game_rounds(status);
CREATE INDEX idx_participants_game_round ON participants(game_round_id);
CREATE INDEX idx_squares_game_round ON squares(game_round_id);
CREATE INDEX idx_squares_participant ON squares(participant_id);
CREATE INDEX idx_squares_number_game ON squares(number, game_round_id);

-- Create health check table
CREATE TABLE health_check (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'healthy',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert health check record
INSERT INTO health_check (status) VALUES ('schema_created');

-- Grant permissions to app_user
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Show created tables
SELECT 'Tables created successfully:' as message;
\dt