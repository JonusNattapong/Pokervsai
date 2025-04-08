// JavaScript สำหรับเกม Poker

// สถานะเกม
let gameState = {
    sessionId: null,
    pot: 0,
    currentBet: 0,
    gameStage: "pre_flop",
    communityCards: [],
    players: [],
    currentPlayer: "",
    winner: null,
    aiMode: 0,
    betAmount: 10,
    soundEnabled: true,
    betHistory: [],
    handDescriptions: {
        'high_card': 'High Card',
        'pair': 'Pair',
        'two_pair': 'Two Pair',
        'three_of_a_kind': 'Three of a Kind',
        'straight': 'Straight',
        'flush': 'Flush',
        'full_house': 'Full House',
        'four_of_a_kind': 'Four of a Kind',
        'straight_flush': 'Straight Flush',
        'royal_flush': 'Royal Flush'
    },
    sounds: {
        deal: null,
        chip: null,
        fold: null,
        check: null,
        win: null,
        lose: null
    },
    isLoading: false,
    errorMessage: null,
    lastAction: null,
    animationsEnabled: true
};

// DOM element references - cached for performance
const communityCardsDiv = document.getElementById('community-cards');
const playerHandDiv = document.getElementById('player-hand');
const aiHandDiv = document.getElementById('ai-hand');
const aiModeSelect = document.getElementById('ai-mode');
const potAmountElement = document.getElementById('pot-amount');
const gameStageElement = document.getElementById('game-stage');
const betHistoryElement = document.getElementById('bet-history');
const playerBalanceElement = document.getElementById('player-balance');
const aiBalanceElement = document.getElementById('ai-balance');
const actionButtons = document.querySelectorAll('#action-buttons button');
const gameLogElement = document.getElementById('game-log');
const animationToggle = document.getElementById('animation-toggle');
const betSlider = document.getElementById('bet-slider');
const currentBetElement = document.getElementById('current-bet');
const statsElements = {
    totalGames: document.getElementById('total-games'),
    playerWins: document.getElementById('player-wins'),
    aiWins: document.getElementById('ai-wins'),
    draws: document.getElementById('draws'),
    winRate: document.getElementById('win-rate')
};

// Initialize the game
function initGame() {
    // Wrap in try/catch for error handling
    try {
        // Generate session ID
        gameState.sessionId = generateSessionId();
        
        // Set AI mode from URL parameters if provided
        const urlParams = new URLSearchParams(window.location.search);
        const aiParam = urlParams.get('ai');
        if (aiParam !== null) {
            gameState.aiMode = parseInt(aiParam);
            if (aiModeSelect) aiModeSelect.value = aiParam;
        }
        
        // Check for animation preference in localStorage
        if (localStorage.getItem('pokerAnimationsEnabled') !== null) {
            gameState.animationsEnabled = localStorage.getItem('pokerAnimationsEnabled') === 'true';
        }
        
        // Load sound preferences
        if (localStorage.getItem('pokerSoundEnabled') !== null) {
            gameState.soundEnabled = localStorage.getItem('pokerSoundEnabled') === 'true';
        }
        
        // Start a new game
        startNewGame();
        
        // Load game statistics
        loadGameStats();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize sounds - lazy load
        loadSounds();
        
        // Update UI based on game state
        updateUI();
        
        console.log('Poker game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
        showErrorMessage('เกิดข้อผิดพลาดในการโหลดเกม โปรดรีเฟรชหน้า');
    }
}

// Load sound effects - lazy loading
function loadSounds() {
    // Only load sounds if enabled
    if (!gameState.soundEnabled) return;
    
    // Use promises to track loading status
    const soundPromises = [];
    
    // Define sound paths
    const soundPaths = {
        deal: '/static/sounds/Audio/deal.mp3',
        chip: '/static/sounds/Audio/bet.mp3',
        fold: '/static/sounds/Audio/fold.mp3',
        check: '/static/sounds/Audio/check.mp3',
        win: '/static/sounds/Audio/win.mp3',
        lose: '/static/sounds/Audio/lose.mp3'
    };
    
    // Load each sound
    for (const [key, path] of Object.entries(soundPaths)) {
        const soundPromise = new Promise((resolve, reject) => {
            gameState.sounds[key] = new Audio(path);
            gameState.sounds[key].addEventListener('canplaythrough', resolve);
            gameState.sounds[key].addEventListener('error', reject);
        });
        soundPromises.push(soundPromise);
    }
    
    // Handle all sound loading
    Promise.allSettled(soundPromises).then(results => {
        const failedSounds = results.filter(r => r.status === 'rejected').length;
        if (failedSounds > 0) {
            console.warn(`${failedSounds} sounds failed to load`);
        }
    });
}

// Toggle sound on/off
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    }
    // Save preference to localStorage
    localStorage.setItem('pokerSoundEnabled', gameState.soundEnabled.toString());
}

// Toggle animations on/off
function toggleAnimations() {
    gameState.animationsEnabled = !gameState.animationsEnabled;
    if (animationToggle) {
        animationToggle.textContent = gameState.animationsEnabled ? '✨ เอฟเฟกต์: เปิด' : '✨ เอฟเฟกต์: ปิด';
    }
    document.body.classList.toggle('animations-disabled', !gameState.animationsEnabled);
    // Save preference to localStorage
    localStorage.setItem('pokerAnimationsEnabled', gameState.animationsEnabled.toString());
}

// Play a sound if sound is enabled with error handling
function playSound(soundName) {
    try {
        if (gameState.soundEnabled && gameState.sounds[soundName]) {
            // Reset sound to beginning if already playing
            gameState.sounds[soundName].currentTime = 0;
            const playPromise = gameState.sounds[soundName].play();
            
            // Handle play promise to avoid Uncaught DOMException
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Sound play error: ${error}`);
                });
            }
        }
    } catch (error) {
        console.warn(`Error playing sound ${soundName}:`, error);
    }
}

// Show error message to user
function showErrorMessage(message) {
    gameState.errorMessage = message;
    
    // Check if error element exists, if not create one
    let errorElement = document.getElementById('game-error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'game-error-message';
        errorElement.className = 'bg-red-500 text-white p-3 rounded-lg fixed top-4 right-4 z-50 shadow-lg';
        document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Generate session ID with improved randomness
function generateSessionId() {
    const timestamp = new Date().getTime().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}`;
}

// Start a new poker game
function startNewGame() {
    try {
        // แสดงสถานะการโหลด
        gameState.isLoading = true;
        updateLoadingState(true);
        
        // ส่งคำขอ API เพื่อเริ่มเกมใหม่
        fetch('/api/poker/new-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: gameState.sessionId,
                aiMode: gameState.aiMode
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // อัปเดตข้อมูลเกม
            gameState.pot = data.pot || 0;
            gameState.currentBet = data.currentBet || 0;
            gameState.gameStage = data.gameStage || 'pre_flop';
            gameState.communityCards = data.communityCards || [];
            gameState.players = data.players || [];
            gameState.currentPlayer = data.currentPlayer || 'player';
            gameState.winner = data.winner || null;
            gameState.betHistory = data.betHistory || [];
            
            // อัปเดต UI
            updateUI();
            updateBetHistory();
            
            // เล่นเสียงแจกไพ่
            playSound('deal');
            
            // เคลียร์ข้อความผิดพลาด
            gameState.errorMessage = null;
        })
        .catch(error => {
            console.error('Error starting new game:', error);
            showErrorMessage('ไม่สามารถเริ่มเกมใหม่ได้ โปรดลองอีกครั้ง');
        })
        .finally(() => {
            // ซ่อนสถานะการโหลด
            gameState.isLoading = false;
            updateLoadingState(false);
        });
    } catch (error) {
        console.error('Error in startNewGame:', error);
        gameState.isLoading = false;
        updateLoadingState(false);
        showErrorMessage('เกิดข้อผิดพลาดในการเริ่มเกมใหม่');
    }
}

// แสดง/ซ่อนสถานะการโหลด
function updateLoadingState(isLoading) {
    // สร้างหรือปรับปรุงตัวแสดงสถานะการโหลด
    let loaderElement = document.getElementById('game-loader');
    
    if (isLoading) {
        if (!loaderElement) {
            loaderElement = document.createElement('div');
            loaderElement.id = 'game-loader';
            loaderElement.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            loaderElement.innerHTML = `
                <div class="bg-dark-secondary p-4 rounded-lg shadow-lg flex flex-col items-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p class="mt-2 text-white">กำลังโหลด...</p>
                </div>
            `;
            document.body.appendChild(loaderElement);
        } else {
            loaderElement.style.display = 'flex';
        }
    } else if (loaderElement) {
        loaderElement.style.display = 'none';
    }
}

// Handle player actions with improved error handling and feedback
function handlePlayerAction(action, betAmount = 0) {
    try {
        // Disable action buttons during API call
        toggleActionButtons(false);
        
        // Set loading state
        gameState.isLoading = true;
        
        // Save current action for potential retry
        gameState.lastAction = { action, betAmount };
        
        // Display loading indicator for the current action
        const actionButton = document.getElementById(`btn-${action}`);
        if (actionButton) {
            const originalText = actionButton.textContent;
            actionButton.innerHTML = `<span class="animate-pulse">⏳</span> ${originalText}`;
        }
        
        // Play appropriate sound
        playSound(action === 'raise' ? 'chip' : action);
        
        // Make API call
        fetch('/api/poker/action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: gameState.sessionId,
                action: action,
                amount: betAmount,
                aiMode: gameState.aiMode
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Update game state with new data
            updateGameStateFromResponse(data);
            
            // Apply animations for cards if enabled
            if (gameState.animationsEnabled) {
                animateGameUpdate(data.updatedElements || []);
            }
            
            // If AI should move next, trigger AI move
            if (data.currentPlayer === 'ai' && !data.gameOver) {
                setTimeout(() => aiMove(), 1000); // Delay AI move for better UX
            }
            
            // Restore action button text
            if (actionButton) {
                actionButton.textContent = originalText;
            }
        })
        .catch(error => {
            console.error(`Error during ${action} action:`, error);
            showErrorMessage(`การดำเนินการ ${action} ล้มเหลว: ${error.message}`);
            
            // Add retry button for failed actions
            showRetryButton();
        })
        .finally(() => {
            // Reset loading state
            gameState.isLoading = false;
            toggleActionButtons(true);
            updateUI();
        });
    } catch (error) {
        console.error('Error in handlePlayerAction:', error);
        gameState.isLoading = false;
        toggleActionButtons(true);
        showErrorMessage('เกิดข้อผิดพลาดระหว่างการดำเนินการ');
    }
}

// Show retry button for failed actions
function showRetryButton() {
    if (!gameState.lastAction) return;
    
    const retryContainer = document.createElement('div');
    retryContainer.id = 'retry-action';
    retryContainer.className = 'fixed bottom-4 right-4 bg-yellow-600 p-3 rounded-lg shadow-lg z-50';
    retryContainer.innerHTML = `
        <p class="mb-2">เกิดข้อผิดพลาด ต้องการลองใหม่หรือไม่?</p>
        <button id="retry-button" class="bg-white text-yellow-800 px-4 py-2 rounded">ลองใหม่</button>
        <button id="cancel-retry" class="bg-gray-800 text-white px-4 py-2 rounded ml-2">ยกเลิก</button>
    `;
    
    document.body.appendChild(retryContainer);
    
    // Add event listeners
    document.getElementById('retry-button').addEventListener('click', () => {
        const { action, betAmount } = gameState.lastAction;
        document.body.removeChild(retryContainer);
        handlePlayerAction(action, betAmount);
    });
    
    document.getElementById('cancel-retry').addEventListener('click', () => {
        document.body.removeChild(retryContainer);
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.getElementById('retry-action')) {
            document.body.removeChild(retryContainer);
        }
    }, 10000);
}

// Animate game elements that have been updated
function animateGameUpdate(updatedElements) {
    if (!gameState.animationsEnabled) return;
    
    updatedElements.forEach(element => {
        // Find the DOM element
        let targetElement;
        
        switch (element.type) {
            case 'community_card':
                targetElement = document.querySelector(`#community-cards .card[data-position="${element.position}"]`);
                break;
            case 'player_card':
                targetElement = document.querySelector(`#player-hand .card[data-position="${element.position}"]`);
                break;
            case 'ai_card':
                targetElement = document.querySelector(`#ai-hand .card[data-position="${element.position}"]`);
                break;
            case 'pot':
                targetElement = potAmountElement;
                break;
            case 'player_balance':
                targetElement = playerBalanceElement;
                break;
            case 'ai_balance':
                targetElement = aiBalanceElement;
                break;
        }
        
        // Apply animation
        if (targetElement) {
            targetElement.classList.add('element-updated');
            setTimeout(() => {
                targetElement.classList.remove('element-updated');
            }, 1000);
        }
    });
}

// Toggle action buttons enable/disable state
function toggleActionButtons(enabled) {
    actionButtons.forEach(button => {
        if (enabled) {
            // Only enable buttons that should be enabled based on current game state
            updateActionButtons();
        } else {
            button.disabled = true;
        }
    });
}

// Update game state from API response
function updateGameStateFromResponse(data) {
    // Update core game state properties
    gameState.pot = data.pot || gameState.pot;
    gameState.currentBet = data.currentBet || gameState.currentBet;
    gameState.gameStage = data.gameStage || gameState.gameStage;
    gameState.communityCards = data.communityCards || gameState.communityCards;
    gameState.players = data.players || gameState.players;
    gameState.currentPlayer = data.currentPlayer || gameState.currentPlayer;
    gameState.winner = data.winner || gameState.winner;
    gameState.betHistory = data.betHistory || gameState.betHistory;
    
    // If game is over, show result
    if (data.gameOver) {
        showGameResult();
    }
}

// Update the UI based on current game state
function updateUI() {
    try {
        // Update game stage display
        if (gameStageElement) {
            gameStageElement.textContent = formatGameStage(gameState.gameStage);
        }
        
        // Update pot amount
        if (potAmountElement) {
            potAmountElement.textContent = gameState.pot;
        }
        
        // Update player and AI hands
        updatePlayerHand();
        updateAIHand();
        
        // Update community cards
        updateCommunityCards();
        
        // Update bet history
        updateBetHistory();
        
        // Update action buttons availability
        updateActionButtons();
        
        // Update player and AI balances
        updateBalances();
        
        // Update AI thinking indicator
        updateAIThinking();
        
        // Update animations toggle button
        if (animationToggle) {
            animationToggle.textContent = gameState.animationsEnabled ? '✨ เอฟเฟกต์: เปิด' : '✨ เอฟเฟกต์: ปิด';
        }
        
        // Update sound toggle button
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.textContent = gameState.soundEnabled ? '🔊' : '🔇';
        }
        
        // Update bet slider if present
        updateBetSlider();
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Update bet slider value and display
function updateBetSlider() {
    if (!betSlider || !currentBetElement) return;
    
    // Find player object
    const player = gameState.players.find(p => p.name === 'player');
    if (!player) return;
    
    // Set max value to player balance
    betSlider.max = player.balance;
    
    // Ensure current value doesn't exceed balance
    if (parseInt(betSlider.value) > player.balance) {
        betSlider.value = player.balance;
    }
    
    // Update displayed value
    currentBetElement.textContent = betSlider.value;
    
    // Disable slider if not player's turn or game is over
    betSlider.disabled = gameState.currentPlayer !== 'player' || gameState.gameOver;
}

// Update player and AI balances
function updateBalances() {
    // Find player and AI objects
    const player = gameState.players.find(p => p.name === 'player');
    const ai = gameState.players.find(p => p.name === 'ai');
    
    // Update player balance
    if (player && playerBalanceElement) {
        playerBalanceElement.textContent = player.balance;
    }
    
    // Update AI balance
    if (ai && aiBalanceElement) {
        aiBalanceElement.textContent = ai.balance;
    }
}

// Update the player's hand
function updatePlayerHand() {
    playerHandDiv.innerHTML = '';
    
    const player = gameState.players.find(p => p.name === 'Player');
    if (player && player.hand) {
        player.hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.suit}`;
            cardElement.innerHTML = `
                <div class="rank">${card.rank}</div>
                <div class="suit">${SUIT_SYMBOLS[card.suit]}</div>
                <div class="center-symbol">${SUIT_SYMBOLS[card.suit]}</div>
            `;
            
            // Add animation class with delay based on index
            cardElement.style.animationDelay = `${index * 0.2}s`;
            cardElement.classList.add('deal-animation');
            
            playerHandDiv.appendChild(cardElement);
        });
    }
}

// Update the AI's hand
function updateAIHand() {
    aiHandDiv.innerHTML = '';
    
    const ai = gameState.players.find(p => p.name === 'AI');
    if (ai) {
        // If showdown or game over with winner, show AI cards
        if (gameState.gameStage === 'showdown' || gameState.winner) {
            ai.hand.forEach((card, index) => {
                const cardElement = document.createElement('div');
                cardElement.className = `card ${card.suit}`;
                cardElement.innerHTML = `
                    <div class="rank">${card.rank}</div>
                    <div class="suit">${SUIT_SYMBOLS[card.suit]}</div>
                    <div class="center-symbol">${SUIT_SYMBOLS[card.suit]}</div>
                `;
                
                // Add animation class with delay
                cardElement.style.animationDelay = `${index * 0.2}s`;
                cardElement.classList.add('deal-animation');
                
                aiHandDiv.appendChild(cardElement);
            });
        } else {
            // If not showdown, show back of cards
            for (let i = 0; i < 2; i++) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card back';
                
                // Add animation class with delay
                cardElement.style.animationDelay = `${i * 0.2}s`;
                cardElement.classList.add('deal-animation');
                
                aiHandDiv.appendChild(cardElement);
            }
        }
    }
}

// Update the community cards
function updateCommunityCards() {
    communityCardsDiv.innerHTML = '';
    
    if (gameState.communityCards && gameState.communityCards.length > 0) {
        gameState.communityCards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.suit}`;
            cardElement.innerHTML = `
                <div class="rank">${card.rank}</div>
                <div class="suit">${SUIT_SYMBOLS[card.suit]}</div>
                <div class="center-symbol">${SUIT_SYMBOLS[card.suit]}</div>
            `;
            
            // Add animation class with delay based on index
            cardElement.style.animationDelay = `${index * 0.2}s`;
            cardElement.classList.add('deal-animation');
            
            communityCardsDiv.appendChild(cardElement);
        });
    }
}

// Show the game result
function showGameResult() {
    if (gameState.winner) {
        winnerText.textContent = `${gameState.winner} Wins!`;
        
        // Play appropriate sound
        if (gameState.winner === 'Player') {
            playSound('win');
        } else {
            playSound('lose');
        }
        
        // Find the player or AI object
        const winningPlayer = gameState.players.find(p => p.name === gameState.winner);
        
        // Show hand description if available
        if (winningPlayer && winningPlayer.best_hand_name) {
            const handName = gameState.handDescriptions[winningPlayer.best_hand_name] || winningPlayer.best_hand_name;
            handDescription.textContent = `Winning Hand: ${handName}`;
            handDescription.classList.add('animate-text');
        } else {
            handDescription.textContent = '';
        }
        
        winnerOverlay.classList.add('active');
    }
}

// Handle player actions
function handlePlayerAction(action, betAmount = 0) {
    // Add to bet history
    const player = gameState.players.find(p => p.name === 'Player');
    
    if (player) {
        gameState.betHistory.push({
            player: 'Player',
            action: action,
            amount: action === 'raise' || action === 'call' ? betAmount : 0,
            gameStage: gameState.gameStage
        });
    }
    
    // Play corresponding sound
    switch(action) {
        case 'fold':
            playSound('fold');
            break;
        case 'check':
            playSound('check');
            break;
        case 'call':
        case 'raise':
            playSound('chip');
            break;
    }
    
    // Send action to server
    fetch('/api/poker_action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: gameState.sessionId,
            action: action,
            bet_amount: betAmount
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error processing action:', data.error);
            return;
        }
        
        // Update game state
        updateGameState(data);
    })
    .catch(error => {
        console.error('Error processing action:', error);
    });
}

// AI move function
function aiMove() {
    // If it's not AI's turn, return
    if (gameState.currentPlayer !== 'AI') return;
    
    // Simulate thinking time for AI
    setTimeout(() => {
        // If the AI makes a betting action, play the chip sound
        const aiAction = gameState.nextAIAction || 'check';
        
        // Add to bet history
        const ai = gameState.players.find(p => p.name === 'AI');
        if (ai) {
            gameState.betHistory.push({
                player: 'AI',
                action: aiAction,
                amount: aiAction === 'raise' || aiAction === 'call' ? (gameState.currentBet - ai.current_bet) : 0,
                gameStage: gameState.gameStage
            });
        }
        
        // Play sound based on action
        switch(aiAction) {
            case 'fold':
                playSound('fold');
                break;
            case 'check':
                playSound('check');
                break;
            case 'call':
            case 'raise':
                playSound('chip');
                break;
        }
        
        // Send AI action to server
        fetch('/api/poker_action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: gameState.sessionId,
                action: aiAction,
                bet_amount: gameState.nextAIBet || 0
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error processing AI action:', data.error);
                return;
            }
            
            // Update game state
            updateGameState(data);
        })
        .catch(error => {
            console.error('Error processing AI action:', error);
        });
    }, 1500);  // AI thinking time
}

// Update the UI based on current game state
function updateUI() {
    // Update basic information
    document.getElementById('game-stage').textContent = gameState.gameStage.toUpperCase();
    document.getElementById('pot-amount').textContent = gameState.pot;

    // Update player and AI hands
    updatePlayerHand();
    updateAIHand();

    // Update community cards
    updateCommunityCards();

    // Update bet history
    updateBetHistory();

    // Show game result if there's a winner
    if (gameState.winner) {
        showGameResult();
    }

    // Update action buttons
    setupEventListeners();
}

// Update AI thinking indicator
function updateAIThinking() {
    const aiThinking = document.getElementById('ai-thinking');
    if (!aiThinking) return;
    
    if (gameState.currentPlayer === 'AI' && !gameState.winner && gameState.gameStage !== 'showdown') {
        aiThinking.classList.add('active');
    } else {
        aiThinking.classList.remove('active');
    }
}

// Update the bet history display
function updateBetHistory() {
    const betHistoryDiv = document.getElementById('bet-history');
    if (!betHistoryDiv) return;
    
    // Clear previous history
    betHistoryDiv.innerHTML = '';
    
    // No need to show anything if there's no history
    if (!gameState.betHistory || gameState.betHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'No bets placed yet.';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#666';
        emptyMessage.style.padding = '10px';
        betHistoryDiv.appendChild(emptyMessage);
        return;
    }
    
    // Add each bet history item
    gameState.betHistory.forEach((bet, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = `bet-history-item ${bet.player.toLowerCase()}`;
        
        // Format the action text
        let actionText = bet.action;
        if (bet.action === 'raise' || bet.action === 'call') {
            actionText += ` $${bet.amount}`;
        }
        
        // Create player section
        const playerSection = document.createElement('div');
        playerSection.innerHTML = `<strong>${bet.player}</strong>`;
        
        // Create action section
        const actionSection = document.createElement('div');
        actionSection.className = 'action';
        actionSection.textContent = actionText;
        
        // Create stage section 
        const stageSection = document.createElement('div');
        stageSection.className = 'stage';
        stageSection.textContent = formatGameStage(bet.gameStage);
        
        // Add sections to item
        historyItem.appendChild(playerSection);
        historyItem.appendChild(actionSection);
        historyItem.appendChild(stageSection);
        
        // Add animation delay based on index
        historyItem.style.animationDelay = `${index * 0.05}s`;
        
        betHistoryDiv.appendChild(historyItem);
    });
    
    // Scroll to bottom of history
    betHistoryDiv.scrollTop = betHistoryDiv.scrollHeight;
}

// Format game stage name for display
function formatGameStage(gameStage) {
    const stageNames = {
        "pre_flop": "Pre-Flop",
        "flop": "Flop",
        "turn": "Turn",
        "river": "River",
        "showdown": "Showdown"
    };
    return stageNames[gameStage] || gameStage;
}

// Set up event listeners
function setupEventListeners() {
    // Button event listeners
    newGameBtn.addEventListener('click', startNewGame);
    changeAiBtn.addEventListener('click', changeAiMode);
    backToMenuBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    // Action buttons
    foldBtn.addEventListener('click', () => handlePlayerAction('fold'));
    checkBtn.addEventListener('click', () => handlePlayerAction('check'));
    callBtn.addEventListener('click', () => handlePlayerAction('call'));
    raiseBtn.addEventListener('click', () => {
        betSliderContainer.style.display = 'flex';
    });
    
    // Bet slider and confirmation
    betSlider.addEventListener('input', () => {
        const value = betSlider.value;
        betValueText.textContent = value;
        gameState.betAmount = parseInt(value);
    });
    confirmBetBtn.addEventListener('click', () => {
        betSliderContainer.style.display = 'none';
        handlePlayerAction('raise', gameState.betAmount);
    });
    
    // Winner overlay buttons
    playAgainBtn.addEventListener('click', () => {
        winnerOverlay.classList.remove('active');
        startNewGame();
    });
    returnToMenuBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
}

// Initialize when the DOM content is loaded
document.addEventListener('DOMContentLoaded', initGame);
