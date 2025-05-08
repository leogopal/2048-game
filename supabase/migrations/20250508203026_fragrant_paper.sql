/*
  # Create achievements tables

  1. New Tables
    - `achievements`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `requirement` (text)
      - `threshold` (integer)
      - `created_at` (timestamp)
  
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `achievement_id` (uuid, foreign key to achievements)
      - `unlocked_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for proper data access
*/

-- Achievements table (global achievements anyone can earn)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User achievements (junction table showing which users have earned which achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are public and can be viewed by anyone
CREATE POLICY "Anyone can view achievements"
  ON achievements
  FOR SELECT
  TO anon
  USING (true);

-- Users can see their own achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Public can view unlocked achievements for leaderboards/profiles
CREATE POLICY "Public can view unlocked achievements"
  ON user_achievements
  FOR SELECT
  TO anon
  USING (true);

-- Users can unlock achievements (system managed)
CREATE POLICY "Users can unlock achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement, threshold) VALUES
  ('Beginner', 'Reach the 128 tile', 'fas fa-award', 'highest_tile', 128),
  ('Intermediate', 'Reach the 256 tile', 'fas fa-medal', 'highest_tile', 256),
  ('Advanced', 'Reach the 512 tile', 'fas fa-trophy', 'highest_tile', 512),
  ('Expert', 'Reach the 1024 tile', 'fas fa-crown', 'highest_tile', 1024),
  ('Master', 'Reach the 2048 tile', 'fas fa-star', 'highest_tile', 2048),
  ('Score Chaser', 'Score 10,000 points', 'fas fa-chart-line', 'score', 10000),
  ('Score Master', 'Score 25,000 points', 'fas fa-chart-line', 'score', 25000),
  ('First Victory', 'Complete one game', 'fas fa-flag-checkered', 'games_completed', 1),
  ('Dedicated Player', 'Complete 10 games', 'fas fa-gamepad', 'games_completed', 10),
  ('2048 Addict', 'Complete 50 games', 'fas fa-fire', 'games_completed', 50);