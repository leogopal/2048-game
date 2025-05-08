import { useState, useEffect } from 'react';
import { loadSavedGames, deleteSavedGame } from '../lib/supabase';

export default function SavedGames({ userId, onLoadGame }) {
  const [savedGames, setSavedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!userId) {
      setSavedGames([]);
      setLoading(false);
      return;
    }
    
    const fetchSavedGames = async () => {
      try {
        setLoading(true);
        const { data, error } = await loadSavedGames(userId);
        
        if (error) throw error;
        setSavedGames(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedGames();
  }, [userId]);
  
  const handleDeleteGame = async (id) => {
    if (window.confirm('Are you sure you want to delete this saved game?')) {
      try {
        const { error } = await deleteSavedGame(id);
        if (error) throw error;
        
        // Update the saved games list after deletion
        setSavedGames(savedGames.filter(game => game.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };
  
  if (!userId) {
    return (
      <div className="saved-games-container">
        <h2>Saved Games</h2>
        <p>Please sign in to save and load games.</p>
      </div>
    );
  }
  
  if (loading) {
    return <div className="saved-games-container"><p>Loading saved games...</p></div>;
  }
  
  if (error) {
    return <div className="saved-games-container"><p>Error: {error}</p></div>;
  }
  
  return (
    <div className="saved-games-container">
      <h2>Saved Games</h2>
      
      {savedGames.length === 0 ? (
        <p>No saved games found. Play a game and save your progress!</p>
      ) : (
        <div className="saved-games-list">
          {savedGames.map(game => (
            <div key={game.id} className="saved-game-card">
              <div className="saved-game-info">
                <h3>{game.name}</h3>
                <p>Score: {game.score}</p>
                <p>Mode: {game.game_mode}</p>
                <p>Saved: {new Date(game.created_at).toLocaleString()}</p>
              </div>
              <div className="saved-game-actions">
                <button 
                  onClick={() => onLoadGame(game)}
                  className="control-button"
                >
                  Load
                </button>
                <button 
                  onClick={() => handleDeleteGame(game.id)}
                  className="control-button danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}