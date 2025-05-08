// The entry file of your AssemblyScript module
export function calculateMoveScore(value: i32): i32 {
  return value;
}

// Check if a move is valid (at least one tile can move)
export function isValidMove(board: Int32Array, size: i32, direction: i32): boolean {
  // Clone the board so we don't modify the original
  const boardCopy = board.slice(0);
  
  // Perform the move on the copy
  const moved = performMove(boardCopy, size, direction);
  
  // If the board changed, the move is valid
  return moved;
}

// Perform a move on the board and return whether anything changed
export function performMove(board: Int32Array, size: i32, direction: i32): boolean {
  let moved = false;
  
  // 0: up, 1: right, 2: down, 3: left
  switch (direction) {
    case 0: // up
      moved = moveUp(board, size);
      break;
    case 1: // right
      moved = moveRight(board, size);
      break;
    case 2: // down
      moved = moveDown(board, size);
      break;
    case 3: // left
      moved = moveLeft(board, size);
      break;
  }
  
  return moved;
}

// Helper functions for each direction
function moveUp(board: Int32Array, size: i32): boolean {
  let moved = false;
  
  for (let x = 0; x < size; x++) {
    for (let y = 1; y < size; y++) {
      if (board[y * size + x] !== 0) {
        let row = y;
        while (row > 0) {
          const currentIdx = row * size + x;
          const targetIdx = (row - 1) * size + x;
          
          if (board[targetIdx] === 0) {
            // Move to empty space
            board[targetIdx] = board[currentIdx];
            board[currentIdx] = 0;
            row--;
            moved = true;
          } else if (board[targetIdx] === board[currentIdx]) {
            // Merge tiles
            board[targetIdx] *= 2;
            board[currentIdx] = 0;
            moved = true;
            break;
          } else {
            // Can't move further
            break;
          }
        }
      }
    }
  }
  
  return moved;
}

function moveRight(board: Int32Array, size: i32): boolean {
  let moved = false;
  
  for (let y = 0; y < size; y++) {
    for (let x = size - 2; x >= 0; x--) {
      if (board[y * size + x] !== 0) {
        let col = x;
        while (col < size - 1) {
          const currentIdx = y * size + col;
          const targetIdx = y * size + col + 1;
          
          if (board[targetIdx] === 0) {
            // Move to empty space
            board[targetIdx] = board[currentIdx];
            board[currentIdx] = 0;
            col++;
            moved = true;
          } else if (board[targetIdx] === board[currentIdx]) {
            // Merge tiles
            board[targetIdx] *= 2;
            board[currentIdx] = 0;
            moved = true;
            break;
          } else {
            // Can't move further
            break;
          }
        }
      }
    }
  }
  
  return moved;
}

function moveDown(board: Int32Array, size: i32): boolean {
  let moved = false;
  
  for (let x = 0; x < size; x++) {
    for (let y = size - 2; y >= 0; y--) {
      if (board[y * size + x] !== 0) {
        let row = y;
        while (row < size - 1) {
          const currentIdx = row * size + x;
          const targetIdx = (row + 1) * size + x;
          
          if (board[targetIdx] === 0) {
            // Move to empty space
            board[targetIdx] = board[currentIdx];
            board[currentIdx] = 0;
            row++;
            moved = true;
          } else if (board[targetIdx] === board[currentIdx]) {
            // Merge tiles
            board[targetIdx] *= 2;
            board[currentIdx] = 0;
            moved = true;
            break;
          } else {
            // Can't move further
            break;
          }
        }
      }
    }
  }
  
  return moved;
}

function moveLeft(board: Int32Array, size: i32): boolean {
  let moved = false;
  
  for (let y = 0; y < size; y++) {
    for (let x = 1; x < size; x++) {
      if (board[y * size + x] !== 0) {
        let col = x;
        while (col > 0) {
          const currentIdx = y * size + col;
          const targetIdx = y * size + col - 1;
          
          if (board[targetIdx] === 0) {
            // Move to empty space
            board[targetIdx] = board[currentIdx];
            board[currentIdx] = 0;
            col--;
            moved = true;
          } else if (board[targetIdx] === board[currentIdx]) {
            // Merge tiles
            board[targetIdx] *= 2;
            board[currentIdx] = 0;
            moved = true;
            break;
          } else {
            // Can't move further
            break;
          }
        }
      }
    }
  }
  
  return moved;
}

// Generate AI hint for best move
export function getAIHint(board: Int32Array, size: i32): i32 {
  let bestScore = -1;
  let bestDirection = -1;
  
  // Try all directions and see which one results in the best score
  for (let direction = 0; direction < 4; direction++) {
    // Clone the board
    const boardCopy = board.slice(0);
    
    // Perform the move
    const moved = performMove(boardCopy, size, direction);
    
    // If the move is valid
    if (moved) {
      // Calculate the score of the resulting board
      const score = evaluateBoard(boardCopy, size);
      
      // Update the best direction if this score is better
      if (score > bestScore) {
        bestScore = score;
        bestDirection = direction;
      }
    }
  }
  
  return bestDirection;
}

// Evaluate a board state for AI
function evaluateBoard(board: Int32Array, size: i32): i32 {
  let score = 0;
  
  // Score based on empty cells (more is better)
  let emptyCells = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) {
      emptyCells++;
    }
  }
  score += emptyCells * 10;
  
  // Score based on tile values (higher values are better)
  for (let i = 0; i < board.length; i++) {
    score += board[i];
  }
  
  // Score based on monotonicity (tiles increasing in a direction)
  // For simplicity, we'll check rows and columns
  let monotonicity = 0;
  
  // Check rows
  for (let y = 0; y < size; y++) {
    let rowMonotonicity = 0;
    for (let x = 1; x < size; x++) {
      const prev = board[y * size + x - 1];
      const current = board[y * size + x];
      
      if (prev <= current) {
        rowMonotonicity++;
      }
    }
    monotonicity += rowMonotonicity;
  }
  
  // Check columns
  for (let x = 0; x < size; x++) {
    let colMonotonicity = 0;
    for (let y = 1; y < size; y++) {
      const prev = board[(y - 1) * size + x];
      const current = board[y * size + x];
      
      if (prev <= current) {
        colMonotonicity++;
      }
    }
    monotonicity += colMonotonicity;
  }
  
  score += monotonicity * 5;
  
  return score;
}