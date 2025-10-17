-- Add winner_percentage column to game_rounds table
ALTER TABLE "game_rounds" ADD COLUMN IF NOT EXISTS "winner_percentage" integer DEFAULT 50 NOT NULL;
