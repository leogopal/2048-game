import { useState, useEffect } from 'react';
import { getLeaderboard, subscribeToLeaderboard } from '../lib/supabase';

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameMode, setGameMode] = useState('classic');
  const [gridSize, setGridSize] = useState(4);
  
  useEffect(() => {
    let mounted = true;
    
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const { data, error } = await getLeaderboard(gameMode, gridSize);
        
        if (error) throw error;
        if (mounted) {
          setLeaderboardData(data || []);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    
    loadLeaderboard();
    
    // Subscribe to realtime updates
    const channel = subscribeToLeaderboard(gameMode, (newEntry) => {
      // When new game session is completed, reload the leaderboard
      if (newEntry.completed && newEntry.game_mode === gameMode && newEntry.grid_size === gridSize) {
        loadLeaderboard();
      }
    });
    
    return () => {
      mounted = false;
      // Unsubscribe from the channel when component unmounts
      if (channel) channel.unsubscribe();
    };
  }, [gameMode, gridSize]);
  
  const handleGameModeChange = (e) => {
    setGameMode(e.target.value);
  };
  
  const handleGridSizeChange = (e) => {
    setGridSize(parseInt(e.target.value));
  };
  
  if (loading) {
    return <div className="leaderboard-container"><p>Loading leaderboard...</p></div>;
  }
  
  if (error) {
    return <div className="leaderboard-container"><p>Error: {error}</p></div>;
  }
  
  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      
      <div className="leaderboard-filters">
        <div className="filter-group">
          <label htmlFor="game-mode">Game Mode:</label>
          <select 
            id="game-mode" 
            value={gameMode} 
            onChange={handleGameModeChange}
            className="control-button"
          >
            <option value="classic">Classic</option>
            <option value="time">Time Attack</option>
            <option value="small">Small (3×3)</option>
            <option value="large">Large (5×5)</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="grid-size">Grid Size:</label>
          <select 
            id="grid-size" 
            value={gridSize} 
            onChange={handleGridSizeChange}
            className="control-button"
          >
            <option value="3">3×3</option>
            <option value="4">4×4</option>
            <option value="5">5×5</option>
          </select>
        </div>
      </div>
      
      {leaderboardData.length === 0 ? (
        <p>No scores yet for this game mode and grid size!</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Highest Tile</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry, index) => (
              <tr key={index}>
                <td>{entry.rank}</td>
                <td>
                  <div className="player-info">
                    {entry.avatar_url && (
                      <img 
                        src={entry.avatar_url} 
                        alt={entry.username} 
                        className="player-avatar" 
                      />
                    )}
                    <span>{entry.username}</span>
                  </div>
                </td>
                <td>{entry.score.toLocaleString()}</td>
                <td>{entry.highest_tile}</td>
                <td>{new Date(entry.date_achieved).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}