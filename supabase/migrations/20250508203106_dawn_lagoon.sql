/*
  # Create leaderboard function and realtime publication

  1. New Functions
    - `get_leaderboard` - Function to retrieve leaderboard data
    
  2. New Publications
    - Enable realtime for leaderboards and achievements
*/

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard(
  game_mode_param TEXT DEFAULT 'classic',
  grid_size_param INTEGER DEFAULT 4,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  score INTEGER,
  highest_tile INTEGER,
  date_achieved TIMESTAMPTZ
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY gs.score DESC) as rank,
    p.id as user_id,
    p.username,
    p.avatar_url,
    gs.score,
    gs.highest_tile,
    gs.created_at as date_achieved
  FROM
    game_sessions gs
    JOIN profiles p ON gs.user_id = p.id
  WHERE
    gs.completed = true AND
    gs.game_mode = game_mode_param AND
    gs.grid_size = grid_size_param
  ORDER BY
    gs.score DESC
  LIMIT limit_param;
$$;

-- Function to get user achievements
CREATE OR REPLACE FUNCTION get_user_achievements(user_id_param UUID)
RETURNS TABLE (
  achievement_id UUID,
  name TEXT,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMPTZ
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    a.id as achievement_id,
    a.name,
    a.description,
    a.icon,
    ua.unlocked_at
  FROM
    achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = user_id_param
  ORDER BY
    CASE WHEN ua.unlocked_at IS NOT NULL THEN 0 ELSE 1 END,
    a.threshold ASC;
$$;

-- Function to get player stats
CREATE OR REPLACE FUNCTION get_player_stats(user_id_param UUID)
RETURNS TABLE (
  username TEXT,
  avatar_url TEXT,
  games_played INTEGER,
  games_won INTEGER,
  win_rate NUMERIC,
  highest_score INTEGER,
  highest_tile INTEGER,
  total_play_time TEXT,
  favorite_game_mode TEXT,
  achievements_count BIGINT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    p.username,
    p.avatar_url,
    gs.games_played,
    gs.games_won,
    CASE 
      WHEN gs.games_played > 0 THEN (gs.games_won::NUMERIC / gs.games_played) * 100
      ELSE 0
    END as win_rate,
    gs.highest_score,
    gs.highest_tile,
    (gs.total_play_time_seconds / 3600) || 'h ' || ((gs.total_play_time_seconds % 3600) / 60) || 'm' as total_play_time,
    gs.favorite_game_mode,
    COUNT(ua.id) as achievements_count
  FROM
    profiles p
    JOIN game_stats gs ON p.id = gs.user_id
    LEFT JOIN user_achievements ua ON p.id = ua.user_id
  WHERE
    p.id = user_id_param
  GROUP BY
    p.username, p.avatar_url, gs.games_played, gs.games_won, 
    gs.highest_score, gs.highest_tile, gs.total_play_time_seconds, gs.favorite_game_mode;
$$;

-- Enable realtime for leaderboards
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;