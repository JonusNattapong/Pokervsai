document.addEventListener('DOMContentLoaded', function() {
    // Game state
    let sessionId = generateSessionId();
    let gameState = {
        board: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        playerTurn: true,
        gameOver: false,
        winner: null,
        aiMode: 0 // Default: Minimax
    };
    
    // DOM elements
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameBoard = document.getElementById('game-board');
    const startGameBtn = document.getElementById('start-game-btn');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const showResultsBtn = document.getElementById('show-results-btn');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const resultText = document.getElementById('result-text');
    const resultAccentBar = document.getElementById('result-accent-bar');
    const playAgainBtn = document.getElementById('play-again-btn');
    const overlayMenuBtn = document.getElementById('overlay-menu-btn');
    const currentAiMode = document.getElementById('current-ai-mode');
    
    // Stats elements
    const totalGamesElement = document.getElementById('total-games');
    const playerWinsElement = document.getElementById('player-wins');
    const winRateElement = document.getElementById('win-rate');
    const modeGamesElement = document.getElementById('mode-games');
    const modePlayerWinsElement = document.getElementById('mode-player-wins');
    const modeAiWinsElement = document.getElementById('mode-ai-wins');
    const modeDrawsElement = document.getElementById('mode-draws');
    
    // Initialize game board
    function initializeBoard() {
        gameBoard.innerHTML = '';
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => handleCellClick(row, col));
                gameBoard.appendChild(cell);
            }
        }
    }
    
    // Update board display based on game state
    function updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Clear existing classes
            cell.classList.remove('x', 'o');
            
            // Add appropriate class based on board state
            if (gameState.board[row][col] === 'X') {
                cell.classList.add('x');
            } else if (gameState.board[row][col] === 'O') {
                cell.classList.add('o');
            }
        });
    }
    
    // Handle cell click
    async function handleCellClick(row, col) {
        // Check if valid move
        if (!gameState.playerTurn || gameState.gameOver || gameState.board[row][col] !== null) {
            return;
        }
        
        try {
            const response = await fetch('/api/make_move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    row: row,
                    col: col
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }
            
            // Update game state with server response
            gameState.board = data.board;
            gameState.playerTurn = data.player_turn;
            gameState.gameOver = data.game_over;
            gameState.winner = data.winner;
            
            // Update board display
            updateBoard();
            
            // Automatically show the results overlay if game is over
            if (gameState.gameOver) {
                // Enable show results button
                showResultsBtn.disabled = false;
                
                // Short delay before showing results to allow player to see the final move
                setTimeout(() => {
                    showGameOverOverlay();
                }, 500);
            }
        } catch (error) {
            console.error('Error making move:', error);
        }
    }
    
    // Show game over overlay
    function showGameOverOverlay() {
        if (!gameState.gameOver) {
            return;
        }
        
        // Set result text and color
        if (gameState.winner === 'O') {
            resultText.textContent = 'You Win!';
            resultAccentBar.style.backgroundColor = 'var(--success)';
        } else if (gameState.winner === 'X') {
            resultText.textContent = 'AI Wins!';
            resultAccentBar.style.backgroundColor = 'var(--danger)';
        } else {
            resultText.textContent = "It's a Draw!";
            resultAccentBar.style.backgroundColor = 'var(--warning)';
        }
        
        // Show overlay with animation
        gameOverOverlay.classList.remove('hidden');
        
        // Add scale-in animation for card
        const resultCard = document.querySelector('.result-card');
        resultCard.style.animation = 'scaleIn 0.3s ease-out';
    }
    
    // Hide game over overlay
    function hideGameOverOverlay() {
        gameOverOverlay.classList.add('hidden');
        // Reset animation
        const resultCard = document.querySelector('.result-card');
        resultCard.style.animation = '';
    }
    
    // Start new game
    async function startNewGame() {
        try {
            const response = await fetch('/api/new_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    ai_mode: gameState.aiMode
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }
            
            // Update game state with server response
            gameState.board = data.board;
            gameState.playerTurn = data.player_turn;
            gameState.gameOver = data.game_over;
            gameState.winner = data.winner;
            
            // Disable show results button
            showResultsBtn.disabled = true;
            
            // Hide overlay if visible
            hideGameOverOverlay();
            
            // Update board display
            updateBoard();
            
            // Update game mode display
            currentAiMode.textContent = gameState.aiMode === 0 ? 'Minimax' : 'Pattern Recognition';
            
            // Update stats
            loadStats();
        } catch (error) {
            console.error('Error starting new game:', error);
        }
    }
    
    // Reset current game
    async function resetGame() {
        try {
            const response = await fetch('/api/reset_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }
            
            // Update game state with server response
            gameState.board = data.board;
            gameState.playerTurn = data.player_turn;
            gameState.gameOver = data.game_over;
            gameState.winner = data.winner;
            
            // Disable show results button
            showResultsBtn.disabled = true;
            
            // Hide overlay if visible
            hideGameOverOverlay();
            
            // Update board display
            updateBoard();
        } catch (error) {
            console.error('Error resetting game:', error);
        }
    }
    
    // Change AI mode
    async function changeAiMode(mode) {
        try {
            const response = await fetch('/api/change_ai_mode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    ai_mode: mode
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }
            
            gameState.aiMode = mode;
            
            // Update UI
            currentAiMode.textContent = mode === 0 ? 'Minimax' : 'Pattern Recognition';
            
            // Update AI mode buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.toggle('selected', parseInt(btn.dataset.mode) === mode);
            });
            
            document.querySelectorAll('.ai-btn').forEach(btn => {
                btn.classList.toggle('selected', parseInt(btn.dataset.mode) === mode);
            });
            
            // Update stats
            loadStats();
        } catch (error) {
            console.error('Error changing AI mode:', error);
        }
    }
    
    // Load game statistics
    async function loadStats() {
        try {
            const response = await fetch('/api/get_stats');
            const stats = await response.json();
            
            // Update welcome screen stats
            totalGamesElement.textContent = stats.total_games;
            playerWinsElement.textContent = stats.player_wins;
            winRateElement.textContent = stats.win_rate + '%';
            
            // Update game screen stats for current mode
            const modeString = gameState.aiMode === 0 ? 'Minimax' : 'Pattern Recognition';
            const modeStats = stats.ai_mode_stats[modeString] || { wins: 0, losses: 0, draws: 0 };
            
            const totalModeGames = modeStats.wins + modeStats.losses + modeStats.draws;
            modeGamesElement.textContent = totalModeGames;
            modePlayerWinsElement.textContent = modeStats.losses; // Player wins are AI losses
            modeAiWinsElement.textContent = modeStats.wins;
            modeDrawsElement.textContent = modeStats.draws;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    // Generate a random session ID
    function generateSessionId() {
        return 'user_' + Math.random().toString(36).substring(2, 10);
    }
    
    // Event listeners
    startGameBtn.addEventListener('click', () => {
        welcomeScreen.classList.remove('active');
        gameScreen.classList.add('active');
        startNewGame();
    });
    
    backToMenuBtn.addEventListener('click', () => {
        gameScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
        loadStats();
    });
    
    showResultsBtn.addEventListener('click', () => {
        showGameOverOverlay();
    });
    
    playAgainBtn.addEventListener('click', () => {
        resetGame();
    });
    
    overlayMenuBtn.addEventListener('click', () => {
        hideGameOverOverlay();
        gameScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
        loadStats();
    });
    
    // AI Mode selection on welcome screen
    document.querySelectorAll('.ai-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = parseInt(btn.dataset.mode);
            gameState.aiMode = mode;
            
            document.querySelectorAll('.ai-btn').forEach(b => {
                b.classList.toggle('selected', b === btn);
            });
            
            document.querySelectorAll('.mode-btn').forEach(b => {
                b.classList.toggle('selected', parseInt(b.dataset.mode) === mode);
            });
        });
    });
    
    // AI Mode selection on game screen
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = parseInt(btn.dataset.mode);
            changeAiMode(mode);
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (gameScreen.classList.contains('active')) {
            if (e.key === 'r' || e.key === 'R') {
                resetGame();
            } else if (e.key === 'Escape') {
                hideGameOverOverlay();
                gameScreen.classList.remove('active');
                welcomeScreen.classList.add('active');
                loadStats();
            }
        }
    });
    
    // Initialize board
    initializeBoard();
    
    // Load initial stats
    loadStats();
});
