import { 
  getCurrentUser, 
  startGameSession, 
  completeGameSession, 
  saveGameState,
  getUserAchievements
} from '../lib/supabase';

// Enhanced GameManager class with Supabase integration
export default class GameManager {
  constructor(size, InputManager, Actuator, mode = 'classic') {
    this.size = size; 
    this.inputManager = new InputManager();
    this.actuator = new Actuator();
    this.gameMode = mode;

    this.startTiles = 2;
    this.timeLimit = 120; // 2 minutes for time attack mode
    this.timeRemaining = this.timeLimit;
    this.timerInterval = null;
    this.gameSessionId = null;
    this.userId = null;
    this.startTime = null;
    this.moveCount = 0;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));

    this.achievementsUnlocked = JSON.parse(localStorage.getItem('achievementsUnlocked') || '{}');
    
    // Check if user is logged in and initialize
    this.initUser();
    
    this.setup();
  }

  // Initialize user and load achievements if logged in
  async initUser() {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        this.userId = user.id;
        this.loadUserAchievements();
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
    }
  }

  // Load user achievements from Supabase
  async loadUserAchievements() {
    if (!this.userId) return;
    
    try {
      const { data } = await getUserAchievements(this.userId);
      if (data) {
        const unlockedAchievements = {};
        data.forEach(achievement => {
          if (achievement.unlocked_at) {
            unlockedAchievements[`reach-${achievement.threshold}`] = true;
          }
        });
        
        this.achievementsUnlocked = unlockedAchievements;
        localStorage.setItem('achievementsUnlocked', JSON.stringify(unlockedAchievements));
        this.updateAchievementsDisplay();
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  }

  // Start a new game session in Supabase
  async startGameSession() {
    if (!this.userId) return;
    
    try {
      const { data, error } = await startGameSession(this.userId, this.gameMode, this.size);
      if (data && !error) {
        this.gameSessionId = data.id;
        this.startTime = new Date();
      }
    } catch (error) {
      console.error('Failed to start game session:', error);
    }
  }

  // Complete the game session in Supabase
  async completeGameSession() {
    if (!this.userId || !this.gameSessionId) return;
    
    try {
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime - this.startTime) / 1000);
      
      let highestTile = 0;
      this.grid.eachCell((x, y, tile) => {
        if (tile && tile.value > highestTile) {
          highestTile = tile.value;
        }
      });
      
      await completeGameSession(
        this.gameSessionId,
        this.score,
        highestTile,
        this.moveCount,
        durationSeconds
      );
    } catch (error) {
      console.error('Failed to complete game session:', error);
    }
  }

  // Save the current game state
  async saveGame(name = 'Quick Save') {
    if (!this.userId) return;
    
    try {
      const gameState = {
        grid: this.grid.serialize(),
        score: this.score,
        over: this.over,
        won: this.won,
        size: this.size
      };
      
      await saveGameState(
        this.userId,
        gameState,
        name,
        this.gameMode,
        this.score,
        this.moveCount
      );
      
      alert('Game saved successfully!');
    } catch (error) {
      console.error('Failed to save game:', error);
      alert('Failed to save game. Please try again.');
    }
  }

  // Rest of the GameManager methods...
  // (The same as in your existing GameManager class)
  
  // Override the move method to track move count
  move(direction) {
    // Original move logic...
    // Then add:
    if (/* move was valid */) {
      this.moveCount++;
    }
  }
  
  // Override the setup method to start a new game session
  setup() {
    // Original setup logic...
    
    // Start a new game session in Supabase
    this.startGameSession();
  }
  
  // Override the game over logic to complete the session
  gameIsOver() {
    // Complete the game session in Supabase
    this.completeGameSession();
    
    // Original game over logic...
  }
}