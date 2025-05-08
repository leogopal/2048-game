import { useState, useEffect } from 'react';
import { getPlayerStats, getUserAchievements } from '../lib/supabase';

export default function PlayerStats({ userId }) {
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!userId) {
      setStats(null);
      setAchievements([]);
      setLoading(false);
      return;
    }
    
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        
        // Fetch player statistics
        const { data: statsData, error: statsError } = await getPlayerStats(userId);
        if (statsError) throw statsError;
        
        // Fetch player achievements
        const { data: achievementsData, error: achievementsError } = await getUserAchievements(userId);
        if (achievementsError) throw achievementsError;
        
        setStats(statsData && statsData.length > 0 ? statsData[0] : null);
        setAchievements(achievementsData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayerData();
  }, [userId]);
  
  if (!userId) {
    return (
      <div className="player-stats-container">
        <h2>Player Statistics</h2>
        <p>Please sign in to view your statistics.</p>
      </div>
    );
  }
  
  if (loading) {
    return <div className="player-stats-container"><p>Loading statistics...</p></div>;
  }
  
  if (error) {
    return <div className="player-stats-container"><p>Error: {error}</p></div>;
  }
  
  if (!stats) {
    return (
      <div className="player-stats-container">
        <h2>Player Statistics</h2>
        <p>No statistics found. Play some games to see your stats!</p>
      </div>
    );
  }
  
  return (
    <div className="player-stats-container">
      <div className="player-profile">
        <div className="player-header">
          {stats.avatar_url && (
            <img 
              src={stats.avatar_url} 
              alt={stats.username} 
              className="player-avatar-large" 
            />
          )}
          <h2>{stats.username}</h2>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Games</h3>
          <p className="stat-value">{stats.games_played}</p>
          <p className="stat-label">Played</p>
        </div>
        
        <div className="stat-card">
          <h3>Wins</h3>
          <p className="stat-value">{stats.games_won}</p>
          <p className="stat-label">({stats.win_rate.toFixed(1)}%)</p>
        </div>
        
        <div className="stat-card">
          <h3>High Score</h3>
          <p className="stat-value">{stats.highest_score.toLocaleString()}</p>
        </div>
        
        <div className="stat-card">
          <h3>Highest Tile</h3>
          <p className="stat-value">{stats.highest_tile}</p>
        </div>
      </div>
      
      <div className="player-details">
        <p><strong>Total Play Time:</strong> {stats.total_play_time}</p>
        <p><strong>Favorite Mode:</strong> {stats.favorite_game_mode || 'None'}</p>
        <p><strong>Achievements:</strong> {stats.achievements_count} unlocked</p>
      </div>
      
      <div className="achievements-section">
        <h3>Achievements</h3>
        <div className="achievements-grid">
          {achievements.map(achievement => (
            <div 
              key={achievement.achievement_id}
              className={`achievement-card ${achievement.unlocked_at ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">
                <i className={achievement.icon}></i>
              </div>
              <div className="achievement-details">
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>
                {achievement.unlocked_at && (
                  <p className="unlock-date">
                    Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}