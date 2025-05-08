// Import dependencies
import anime from 'animejs/lib/anime.es.js';
import JSConfetti from 'js-confetti';

// Initialize confetti
const jsConfetti = new JSConfetti();

// Purpose: This file contains the game logic for the 2048 game.
document.addEventListener("DOMContentLoaded", function () {
  // Wait till the browser is ready to render the game (avoids glitches)
  window.requestAnimationFrame(function () {
    var manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
    
    // Theme toggle
    const themeSwitch = document.getElementById('theme-switch');
    themeSwitch.addEventListener('change', () => {
      if (themeSwitch.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    });

    // Check for saved theme preference
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
      themeSwitch.checked = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Game mode selector
    const gameModeSelector = document.getElementById('game-mode');
    gameModeSelector.addEventListener('change', function() {
      const selectedMode = this.value;
      let size = 4; // default classic size
      
      switch(selectedMode) {
        case 'small':
          size = 3;
          break;
        case 'large':
          size = 5;
          break;
        case 'time':
          size = 4; // Time attack uses standard grid
          break;
        default:
          size = 4;
      }
      
      // Restart game with new settings
      manager = new GameManager(size, KeyboardInputManager, HTMLActuator, selectedMode);
    });

    // New game button
    document.getElementById('new-game-button').addEventListener('click', function() {
      manager.restart();
    });
  });
});

// GameManager class is responsible for the game logic and acts as an interface between the other classes.
// It is also responsible for updating the score, checking if the game is over, and handling keyboard input.
class GameManager {
  constructor(size, InputManager, Actuator, mode = 'classic') {
    this.size = size; // Size of the grid
    this.inputManager = new InputManager();
    this.actuator = new Actuator();
    this.gameMode = mode;

    this.startTiles = 2;
    this.timeLimit = 120; // 2 minutes for time attack mode
    this.timeRemaining = this.timeLimit;
    this.timerInterval = null;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));

    this.achievementsUnlocked = JSON.parse(localStorage.getItem('achievementsUnlocked') || '{}');
    this.updateAchievementsDisplay();

    this.setup();
  }

  // Get players name and save it to local storage and display it on the page
  getName() {
    var name = localStorage.getItem("name") || null;
    if (!name) {
      name = prompt("Please enter your name", "Player");
      if (!name) name = "Player";
      localStorage.setItem("name", name);
    }
    document.getElementById("name").innerHTML = name;
  }

  // Restart the game
  restart() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.actuator.restart();
    this.setup();
  }
  
  // Set up the game
  setup() {
    // Build the proper grid size based on game mode
    this.rebuildGrid();
    
    this.grid = new Grid(this.size);

    this.score = 0;
    this.over = false;
    this.won = false;

    // Add the initial tiles
    this.addStartTiles();

    // Update the actuator
    this.actuate();

    // Use the function below to get the players name
    this.getName();
    
    // Start timer for time attack mode
    if (this.gameMode === 'time') {
      this.timeRemaining = this.timeLimit;
      this.startTimer();
    }
  }
  
  // Rebuild the grid for different sizes
  rebuildGrid() {
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = '';
    
    for (let y = 0; y < this.size; y++) {
      const row = document.createElement('div');
      row.className = 'grid-row';
      
      for (let x = 0; x < this.size; x++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        row.appendChild(cell);
      }
      
      gridContainer.appendChild(row);
    }
    
    // Adjust CSS for different grid sizes
    const gameContainer = document.querySelector('.game-container');
    const tileContainer = document.querySelector('.tile-container');
    
    if (this.size === 3) {
      gameContainer.style.width = '400px';
      gameContainer.style.height = '400px';
    } else if (this.size === 5) {
      gameContainer.style.width = '600px';
      gameContainer.style.height = '600px';
    } else {
      gameContainer.style.width = '500px';
      gameContainer.style.height = '500px';
    }
    
    // We need to update the CSS for tile positions as well
    // This would typically be done dynamically for each tile based on grid size
  }
  
  // Start timer for time attack mode
  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer-display';
    timerDisplay.className = 'timer-display';
    timerDisplay.textContent = `Time: ${this.timeRemaining}s`;
    
    const container = document.querySelector('.game-controls');
    const existingTimer = document.getElementById('timer-display');
    if (existingTimer) {
      container.removeChild(existingTimer);
    }
    container.appendChild(timerDisplay);
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      timerDisplay.textContent = `Time: ${this.timeRemaining}s`;
      
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.over = true;
        this.actuate();
      }
    }, 1000);
  }
  
  // Set up the initial tiles to start the game with
  addStartTiles() {
    for (var i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  }
  // Adds a tile in a random position
  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      var value = Math.random() < 0.9 ? 2 : 4;
      var tile = new Tile(this.grid.randomAvailableCell(), value);

      this.grid.insertTile(tile);
    }
  }
  // Sends the updated grid to the actuator
  actuate() {
    this.actuator.actuate(this.grid, {
      score: this.score,
      over: this.over,
      won: this.won,
      gameMode: this.gameMode,
      bestScore: this.getBestScore()
    });
    
    // Check for achievements
    this.checkAchievements();
  }
  
  // Get best score from localStorage
  getBestScore() {
    const key = `bestScore-${this.gameMode}-${this.size}`;
    return parseInt(localStorage.getItem(key) || 0);
  }
  
  // Save best score to localStorage
  saveBestScore() {
    const key = `bestScore-${this.gameMode}-${this.size}`;
    const bestScore = this.getBestScore();
    if (this.score > bestScore) {
      localStorage.setItem(key, this.score);
    }
  }
  
  // Check for achievements
  checkAchievements() {
    // Find the highest tile value on the board
    let highestTile = 0;
    this.grid.eachCell((x, y, tile) => {
      if (tile && tile.value > highestTile) {
        highestTile = tile.value;
      }
    });
    
    // Check for achievements based on highest tile
    const tileAchievements = {
      'reach-128': 128,
      'reach-256': 256,
      'reach-512': 512,
      'reach-1024': 1024,
      'reach-2048': 2048
    };
    
    let newAchievementsUnlocked = false;
    
    for (const [achievement, requiredValue] of Object.entries(tileAchievements)) {
      if (highestTile >= requiredValue && !this.achievementsUnlocked[achievement]) {
        this.achievementsUnlocked[achievement] = true;
        newAchievementsUnlocked = true;
      }
    }
    
    if (newAchievementsUnlocked) {
      localStorage.setItem('achievementsUnlocked', JSON.stringify(this.achievementsUnlocked));
      this.updateAchievementsDisplay();
      
      // Show confetti for new achievements
      jsConfetti.addConfetti();
    }
  }
  
  // Update achievements display
  updateAchievementsDisplay() {
    const achievementElements = document.querySelectorAll('.achievement');
    achievementElements.forEach(element => {
      const achievementId = element.getAttribute('data-achievement');
      if (this.achievementsUnlocked[achievementId]) {
        element.classList.add('unlocked');
        element.querySelector('i').className = 'fas fa-unlock';
      } else {
        element.classList.remove('unlocked');
        element.querySelector('i').className = 'fas fa-lock';
      }
    });
  }
  
  // Save all tile positions and remove merger info
  prepareTiles() {
    this.grid.eachCell(function (x, y, tile) {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }
  // Move a tile and its representation
  moveTile(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }
  // Move tiles on the grid in the specified direction
  move(direction) {
    // 0: up, 1: right, 2:down, 3: left
    var self = this;

    if (this.over || this.won) return; // Don't do anything if the game's over

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);

        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next = self.grid.cellContent(positions.next);

          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            var merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            self.grid.insertTile(merged);
            self.grid.removeTile(tile);

            // Converge the two tiles' positions
            tile.updatePosition(positions.next);

            // Update the score
            self.score += merged.value;
            
            // Save best score
            self.saveBestScore();

            // The mighty 2048 tile
            if (merged.value === 2048) self.won = true;
            
            // Animate the merged tiles
            anime({
              targets: '.tile-merged',
              scale: [0, 1],
              easing: 'easeOutElastic(1, .5)',
              duration: 600
            });
          } else {
            self.moveTile(tile, positions.farthest);
          }

          if (!self.positionsEqual(cell, tile)) {
            moved = true; // The tile moved from its original cell!
          }
        }
      });
    });

    if (moved) {
      this.addRandomTile();

      if (!this.movesAvailable()) {
        this.over = true; // Game over!
      }

      this.actuate();
    }
  }
  // Get the vector representing the chosen direction
  getVector(direction) {
    // Vectors representing tile movement
    var map = {
      0: { x: 0, y: -1 },
      1: { x: 1, y: 0 },
      2: { x: 0, y: 1 },
      3: { x: -1, y: 0 }, // left
    };

    return map[direction];
  }
  // Build a list of positions to traverse in the right order
  buildTraversals(vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
  }
  findFarthestPosition(cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

    return {
      farthest: previous,
      next: cell, // Used to check if a merge is required
    };
  }
  movesAvailable() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }
  // Check for available matches between tiles (more expensive check)
  tileMatchesAvailable() {
    var self = this;

    var tile;

    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });

        if (tile) {
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell = { x: x + vector.x, y: y + vector.y };

            var other = self.grid.cellContent(cell);
            if (other) {
            }

            if (other && other.value === tile.value) {
              return true; // These two tiles can be merged
            }
          }
        }
      }
    }

    return false;
  }
  positionsEqual(first, second) {
    return first.x === second.x && first.y === second.y;
  }
}

// Grid class is responsible for storing the state of the grid (size, cells, etc.)
// and performing operations on it (moving tiles, etc.)
// It also knows how to serialize itself to a JSON representation
// and how to build itself back from that representation
class Grid {
  constructor(size) {
    this.size = size;

    this.cells = [];

    this.build();
  }

  // Build a grid of the specified size
  build() {
    for (var x = 0; x < this.size; x++) {
      var row = (this.cells[x] = []);

      for (var y = 0; y < this.size; y++) {
        row.push(null);
      }
    }
  }
  // Find the first available random position
  randomAvailableCell() {
    var cells = this.availableCells();

    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
  }
  availableCells() {
    var cells = [];

    this.eachCell(function (x, y, tile) {
      if (!tile) {
        cells.push({ x: x, y: y });
      }
    });

    return cells;
  }
  // Call callback for every cell
  eachCell(callback) {
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x][y]);
      }
    }
  }
  // Check if there are any cells available
  cellsAvailable() {
    return !!this.availableCells().length;
  }
  // Check if the specified cell is taken
  cellAvailable(cell) {
    return !this.cellOccupied(cell);
  }
  cellOccupied(cell) {
    return !!this.cellContent(cell);
  }
  cellContent(cell) {
    if (this.withinBounds(cell)) {
      return this.cells[cell.x][cell.y];
    } else {
      return null;
    }
  }
  // Inserts a tile at its position
  insertTile(tile) {
    this.cells[tile.x][tile.y] = tile;
  }
  removeTile(tile) {
    this.cells[tile.x][tile.y] = null;
  }
  withinBounds(position) {
    return (
      position.x >= 0 &&
      position.x < this.size &&
      position.y >= 0 &&
      position.y < this.size
    );
  }
}

// HTMLActuator class is responsible for updating the HTML representation of the game
// It knows about the Grid class (to get tiles) but the Grid class does not know about the HTML representation
class HTMLActuator {
  constructor() {
    this.tileContainer = document.getElementsByClassName("tile-container")[0];
    this.scoreContainer = document.getElementsByClassName("score-container")[0];
    this.bestContainer = document.getElementsByClassName("best-container")[0];
    this.messageContainer = document.getElementsByClassName("game-message")[0];
    this.sharingContainer = document.getElementsByClassName("score-sharing")[0];

    this.score = 0;
  }
  actuate(grid, metadata) {
    var self = this;

    window.requestAnimationFrame(function () {
      self.clearContainer(self.tileContainer);

      grid.cells.forEach(function (column) {
        column.forEach(function (cell) {
          if (cell) {
            self.addTile(cell);
          }
        });
      });

      self.updateScore(metadata.score);
      self.updateBestScore(metadata.bestScore);

      if (metadata.over) self.message(false); // You lose
      if (metadata.won) self.message(true); // You win!
    });
  }
  restart() {
    this.clearMessage();
  }
  clearContainer(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
  
  updateScore(score) {
    this.clearContainer(this.scoreContainer);
    this.score = score;
    this.scoreContainer.textContent = this.score;

    // Animate score changes
    anime({
      targets: '.score-container',
      scale: [1, 1.1, 1],
      duration: 500,
      easing: 'easeOutQuad'
    });
  }
  
  updateBestScore(bestScore) {
    this.clearContainer(this.bestContainer);
    this.bestContainer.textContent = bestScore;
  }
  
  applyClasses(element, classes) {
    element.setAttribute("class", classes.join(" "));
  }
  normalizePosition(position) {
    return { x: position.x + 1, y: position.y + 1 };
  }
  // Converts a position to a CSS class
  positionClass(position) {
    position = this.normalizePosition(position);
    return "tile-position-" + position.x + "-" + position.y;
  }
  addTile(tile) {
    var self = this;

    var element = document.createElement("div");
    var position = tile.previousPosition || { x: tile.x, y: tile.y };
    var positionClass = this.positionClass(position);

    // We can't use classlist because it somehow glitches when replacing classes
    var classes = ["tile", "tile-" + tile.value, positionClass];
    this.applyClasses(element, classes);

    element.textContent = tile.value;

    if (tile.previousPosition) {
      // Make sure that the tile gets rendered in the previous position first
      window.requestAnimationFrame(function () {
        classes[2] = self.positionClass({ x: tile.x, y: tile.y });
        self.applyClasses(element, classes); // Update the position
      });
    } else if (tile.mergedFrom) {
      classes.push("tile-merged");
      this.applyClasses(element, classes);

      // Render the tiles that merged
      tile.mergedFrom.forEach(function (merged) {
        self.addTile(merged);
      });
    } else {
      classes.push("tile-new");
      this.applyClasses(element, classes);
    }

    // Put the tile on the board
    this.tileContainer.appendChild(element);
  }

  message(won) {
    var type = won ? "game-won" : "game-over";
    var message = won ? "You win!" : "Game over!";

    // if (ga) ga("send", "event", "game", "end", type, this.score);
    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;
    
    // Add sharing functionality
    this.sharingContainer.innerHTML = `
      <button class="share-button">
        <i class="fas fa-share-alt"></i> Share Score
      </button>
    `;
    
    this.sharingContainer.querySelector('.share-button').addEventListener('click', () => {
      this.shareScore(this.score, won);
    });
    
    // Show confetti on win
    if (won) {
      jsConfetti.addConfetti({
        confettiColors: [
          '#EEE4DA', '#EDE0C8', '#F2B179', '#F59563', 
          '#F67C5F', '#F65E3B', '#EDCF72', '#EDCC61', 
          '#EDC850', '#EDC53F', '#EDC22E'
        ]
      });
    }
  }
  
  // Share score to social media or copy to clipboard
  shareScore(score, won) {
    const text = `I ${won ? 'won' : 'scored'} ${score} points in 2048! Can you beat that?`;
    
    if (navigator.share) {
      navigator.share({
        title: '2048 Game',
        text: text,
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
        this.copyToClipboard(text);
      });
    } else {
      this.copyToClipboard(text);
    }
  }
  
  // Fallback for browsers without Web Share API
  copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    alert('Score copied to clipboard!');
  }
  
  clearMessage() {
    this.messageContainer.classList.remove("game-won", "game-over");
  }
}

// KeyboardInputManager class is responsible for handling keyboard events
// It knows about the Grid class (to move tiles) but the Grid class does not know about keyboard events
// It knows about the HTMLActuator class (to update the HTML representation) but the HTMLActuator class does not know about keyboard events
class KeyboardInputManager {
  constructor() {
    this.events = {};

    this.listen();
  }
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  emit(event, data) {
    var callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(function (callback) {
        callback(data);
      });
    }
  }
  listen() {
    var self = this;

    var map = {
      38: 0,
      39: 1,
      40: 2,
      37: 3,
      75: 0,
      76: 1,
      74: 2,
      72: 3,
      87: 0, // W
      68: 1, // D
      83: 2, // S
      65: 3, // A
    };

    document.addEventListener("keydown", function (event) {
      var modifiers =
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      var mapped = map[event.which];

      if (!modifiers) {
        if (mapped !== undefined) {
          event.preventDefault();
          self.emit("move", mapped);
        }

        if (event.which === 32) self.restart.bind(self)(event);
      }
    });

    var retry = document.getElementsByClassName("retry-button")[0];
    retry.addEventListener("click", this.restart.bind(this));

    // Touch support
    var touchStartClientX, touchStartClientY;
    
    var gameContainer = document.getElementsByClassName("game-container")[0];
    
    gameContainer.addEventListener("touchstart", function (event) {
      if (event.touches.length > 1) return;
      
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
      
      event.preventDefault();
    });
    
    gameContainer.addEventListener("touchmove", function (event) {
      event.preventDefault();
    });
    
    gameContainer.addEventListener("touchend", function (event) {
      if (event.touches.length > 0) return;
      
      var dx = event.changedTouches[0].clientX - touchStartClientX;
      var dy = event.changedTouches[0].clientY - touchStartClientY;
      
      var absDx = Math.abs(dx);
      var absDy = Math.abs(dy);
      
      if (Math.max(absDx, absDy) > 10) {
        // (right : left) : (down : up)
        self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
      }
    });
  }
  restart(event) {
    event.preventDefault();
    this.emit("restart");
  }
}

// Tile class represents a tile in the grid
// It knows about the Grid class (to save and update its position) but the Grid class does not know about tiles
// It knows about the HTMLActuator class (to update the HTML representation) but the HTMLActuator class does not know about tiles
class Tile {
  constructor(position, value) {
    this.x = position.x;
    this.y = position.y;
    this.value = value || 2;

    this.previousPosition = null;
    this.mergedFrom = null; // Tracks tiles that merged together
  }
  savePosition() {
    this.previousPosition = { x: this.x, y: this.y };
  }
  updatePosition(position) {
    this.x = position.x;
    this.y = position.y;
  }
}