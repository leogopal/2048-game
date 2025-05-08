import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User authentication functions
export const signUp = async (email, password, username) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  });
  
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user, error };
};

// Game session functions
export const startGameSession = async (userId, gameMode, gridSize) => {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      user_id: userId,
      game_mode: gameMode,
      grid_size: gridSize
    })
    .select()
    .single();
  
  return { data, error };
};

export const updateGameSession = async (sessionId, updateData) => {
  const { data, error } = await supabase
    .from('game_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();
  
  return { data, error };
};

export const completeGameSession = async (sessionId, score, highestTile, movesCount, durationSeconds) => {
  const { data, error } = await supabase
    .from('game_sessions')
    .update({
      score,
      highest_tile: highestTile,
      moves_count: movesCount,
      duration_seconds: durationSeconds,
      completed: true
    })
    .eq('id', sessionId)
    .select()
    .single();
  
  return { data, error };
};

// Leaderboard functions
export const getLeaderboard = async (gameMode = 'classic', gridSize = 4, limit = 10) => {
  const { data, error } = await supabase
    .rpc('get_leaderboard', {
      game_mode_param: gameMode,
      grid_size_param: gridSize,
      limit_param: limit
    });
  
  return { data, error };
};

// Achievements functions
export const getUserAchievements = async (userId) => {
  const { data, error } = await supabase
    .rpc('get_user_achievements', {
      user_id_param: userId
    });
  
  return { data, error };
};

// Game state functions
export const saveGameState = async (userId, gameState, name, gameMode, score, moves) => {
  const { data, error } = await supabase
    .from('saved_games')
    .insert({
      user_id: userId,
      name,
      game_state: gameState,
      game_mode: gameMode,
      score,
      moves
    })
    .select()
    .single();
  
  return { data, error };
};

export const loadSavedGames = async (userId) => {
  const { data, error } = await supabase
    .from('saved_games')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const deleteSavedGame = async (savedGameId) => {
  const { error } = await supabase
    .from('saved_games')
    .delete()
    .eq('id', savedGameId);
  
  return { error };
};

// User settings functions
export const getUserSettings = async (userId) => {
  const { data, error } = await supabase
    .from('game_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
};

export const updateUserSettings = async (userId, settings) => {
  const { data, error } = await supabase
    .from('game_settings')
    .update(settings)
    .eq('user_id', userId)
    .select()
    .single();
  
  return { data, error };
};

// User profile functions
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

export const updateUserProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};

// Player stats functions
export const getPlayerStats = async (userId) => {
  const { data, error } = await supabase
    .rpc('get_player_stats', {
      user_id_param: userId
    });
  
  return { data, error };
};

// Subscribe to real-time updates for leaderboard
export const subscribeToLeaderboard = (gameMode, callback) => {
  const channel = supabase
    .channel('public:game_sessions')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'game_sessions',
        filter: `game_mode=eq.${gameMode}`
      }, 
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return channel;
};

// Subscribe to real-time updates for user achievements
export const subscribeToUserAchievements = (userId, callback) => {
  const channel = supabase
    .channel(`public:user_achievements:user_id=eq.${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_achievements',
        filter: `user_id=eq.${userId}`
      }, 
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return channel;
};