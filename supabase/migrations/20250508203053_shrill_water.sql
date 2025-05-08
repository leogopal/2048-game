/*
  # Create game settings and saved states tables

  1. New Tables
    - `game_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `default_game_mode` (text)
      - `sound_enabled` (boolean)
      - `animations_enabled` (boolean)
      - `hint_frequency` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
    - `saved_games`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `name` (text)
      - `game_state` (jsonb)
      - `game_mode` (text)
      - `score` (integer)
      - `moves` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their settings and saved games
*/

-- Game settings table
CREATE TABLE IF NOT EXISTS game_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  default_game_mode TEXT NOT NULL DEFAULT 'classic',
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  animations_enabled BOOLEAN NOT NULL DEFAULT true,
  hint_frequency INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saved games table for continue later functionality
CREATE TABLE IF NOT EXISTS saved_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Game',
  game_state JSONB NOT NULL,
  game_mode TEXT NOT NULL DEFAULT 'classic',
  score INTEGER NOT NULL DEFAULT 0,
  moves INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_games ENABLE ROW LEVEL SECURITY;

-- Policies for game settings
CREATE POLICY "Users can read own game settings"
  ON game_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own game settings"
  ON game_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game settings"
  ON game_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for saved games
CREATE POLICY "Users can read own saved games"
  ON saved_games
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved games"
  ON saved_games
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved games"
  ON saved_games
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved games"
  ON saved_games
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_game_settings_updated_at
BEFORE UPDATE ON game_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_games_updated_at
BEFORE UPDATE ON saved_games
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_saved_games_user_id ON saved_games(user_id);
CREATE INDEX idx_game_settings_user_id ON game_settings(user_id);

-- Function to initialize user settings
CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO game_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) 
  DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create settings entry on user creation
CREATE TRIGGER on_user_created_settings
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_settings();