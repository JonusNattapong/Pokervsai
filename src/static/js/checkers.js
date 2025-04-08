// JavaScript สำหรับเกม Checkers (หมากฮอต)

// สถานะเกม
let gameState = {
    board: null,
    sessionId: null,
    gameOver: false,
    winner: null,
    playerTurn: true,
    aiMode: 1, // เริ่มต้นที่ระดับปานกลาง
    selectedPiece: null,
    validMoves: {},
    isLoading: false,
    errorMessage: null,
    animationsEnabled: true,
    soundEnabled: true,
    lastAction: null,
    playerColor: 'white'  // เริ่มต้นผู้เล่นเป็นฝั่งขาว
};

// Sound effects
const SOUNDS = {
    move: '/static/sounds/move.mp3',
    capture: '/static/sounds/capture.mp3',
    win: '/static/sounds/win.mp3',
    lose: '/static/sounds/lose.mp3',
    error: '/static/sounds/error.mp3',
    select: '/static/sounds/select.mp3'
};

// ตั้งค่าตัวแปรสำหรับ DOM elements
let gameBoard = null;
let gameStatus = null;
let newGameBtn = null;
let changeAiBtn = null;
let backToMenuBtn = null;
let playAgainBtn = null;
let returnToMenuBtn = null;
let winnerOverlay = null;
let winnerText = null;
let moveHistory = null;
let animationToggle = null;
let soundToggle = null;
let playerWhiteBtn = null;
let playerBlackBtn = null;
let aiModeSelect = null;

// Statistics elements
const statsElements = {
    totalGames: document.getElementById('total-games'),
    playerWins: document.getElementById('player-wins'),
    aiWins: document.getElementById('ai-wins'),
    draws: document.getElementById('draws'),
    winRate: document.getElementById('win-rate')
};

// Game configuration
const BOARD_SIZE = 8;
const SQUARE_SIZE = 60; // ขนาดของช่องบนกระดาน

// เริ่มเกม
function initGame() {
    try {
        console.log('Initializing Checkers game...');
        
        // ค้นหา DOM elements
        gameBoard = document.getElementById('game-board');
        gameStatus = document.getElementById('status');
        newGameBtn = document.getElementById('new-game');
        changeAiBtn = document.getElementById('change-ai');
        backToMenuBtn = document.getElementById('back-to-menu');
        playAgainBtn = document.getElementById('play-again');
        returnToMenuBtn = document.getElementById('return-to-menu');
        winnerOverlay = document.getElementById('winner-overlay');
        winnerText = document.getElementById('winner-text');
        moveHistory = document.getElementById('move-history');
        animationToggle = document.getElementById('animation-toggle');
        soundToggle = document.getElementById('sound-toggle');
        playerWhiteBtn = document.getElementById('btn-player-white');
        playerBlackBtn = document.getElementById('btn-player-black');
        aiModeSelect = document.getElementById('ai-mode');
        
        // ตรวจสอบว่า gameBoard มีอยู่หรือไม่
        if (!gameBoard) {
            console.error('CRITICAL ERROR: Game board element not found!');
            alert('ไม่พบกระดานเกม กรุณารีเฟรชหน้าเว็บ');
            return;
        }
        console.log('Game board found:', gameBoard);
        
        // สร้าง sessionId
        gameState.sessionId = generateSessionId();
        console.log('Generated Session ID:', gameState.sessionId);
        
        // ตั้งค่าโหมด AI จาก URL parameters (ถ้ามี)
        const urlParams = new URLSearchParams(window.location.search);
        const aiParam = urlParams.get('ai');
        if (aiParam !== null) {
            gameState.aiMode = parseInt(aiParam);
        }
        
        // โหลดค่าพรีเฟอเรนซ์จาก localStorage
        loadPreferences();
        
        // ตั้งค่า event listeners
        setupEventListeners();
        
        // สร้างกระดานเกม
        createBoard();
        
        // เริ่มเกมใหม่
        startNewGame();
        
        // โหลดสถิติ
        loadGameStats();
        
        console.log('Checkers game initialized successfully');
    } catch (error) {
        console.error('Error initializing Checkers game:', error);
        showErrorMessage('เกิดข้อผิดพลาดในการโหลดเกม โปรดรีเฟรชหน้า');
    }
}

// โหลดค่าพรีเฟอเรนซ์จาก localStorage
function loadPreferences() {
    // โหลดการตั้งค่าแอนิเมชัน
    if (localStorage.getItem('checkersAnimationsEnabled') !== null) {
        gameState.animationsEnabled = localStorage.getItem('checkersAnimationsEnabled') === 'true';
        updateAnimationToggle();
    }
    
    // โหลดการตั้งค่าเสียง
    if (localStorage.getItem('checkersSoundEnabled') !== null) {
        gameState.soundEnabled = localStorage.getItem('checkersSoundEnabled') === 'true';
        updateSoundToggle();
    }
}

// อัปเดตปุ่มเปิด/ปิดแอนิเมชัน
function updateAnimationToggle() {
    if (animationToggle) {
        animationToggle.textContent = gameState.animationsEnabled ? 
            '✨ เอฟเฟกต์: เปิด' : '✨ เอฟเฟกต์: ปิด';
    }
    
    // เพิ่มหรือลบคลาสสำหรับแอนิเมชัน
    document.body.classList.toggle('animations-disabled', !gameState.animationsEnabled);
}

// อัปเดตปุ่มเปิด/ปิดเสียง
function updateSoundToggle() {
    if (soundToggle) {
        soundToggle.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    }
}

// เปิด/ปิดแอนิเมชัน
function toggleAnimations() {
    gameState.animationsEnabled = !gameState.animationsEnabled;
    updateAnimationToggle();
    
    // บันทึกค่าพรีเฟอเรนซ์
    localStorage.setItem('checkersAnimationsEnabled', gameState.animationsEnabled.toString());
}

// เปิด/ปิดเสียง
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    updateSoundToggle();
    
    // บันทึกค่าพรีเฟอเรนซ์
    localStorage.setItem('checkersSoundEnabled', gameState.soundEnabled.toString());
}

// สร้าง UUID สำหรับเซสชัน
function generateSessionId() {
    // สร้าง UUID v4 อย่างง่าย
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// แสดงข้อความผิดพลาด
function showErrorMessage(message) {
    gameState.errorMessage = message;
    
    // ตรวจสอบว่ามี element แสดงข้อผิดพลาดหรือไม่ ถ้าไม่มีให้สร้างใหม่
    let errorElement = document.getElementById('game-error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'game-error-message';
        errorElement.className = 'bg-red-500 text-white p-3 rounded-lg fixed top-4 right-4 z-50 shadow-lg';
        document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // ซ่อนอัตโนมัติหลังจาก 5 วินาที
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// แสดง/ซ่อนสถานะการโหลด
function updateLoadingState(isLoading) {
    gameState.isLoading = isLoading;
    
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

// เล่นเสียงเอฟเฟกต์
function playSound(soundName) {
    if (!gameState.soundEnabled) return;
    
    // Map sound names to actual files
    const soundMap = {
        'move': '/static/sounds/move.mp3',
        'capture': '/static/sounds/capture.mp3',
        'win': '/static/sounds/game_win.mp3',
        'lose': '/static/sounds/game_lose.mp3'
    };

    try {
        // First try using SoundEffects manager if available
        if (window.SoundEffects && typeof window.SoundEffects.play === 'function') {
            if (soundName === 'move') { // ไม่เล่นเสียง move.mp3
                return;
            }
            // Map local sound names to global sound names
            const globalSoundMap = {
                'win': 'game_win',
                'lose': 'game_lose'
            };
            
            const globalSoundName = globalSoundMap[soundName] || soundName;
            window.SoundEffects.play(globalSoundName);
        } else {
            // Fallback to direct Audio API
            const soundFile = soundMap[soundName];
            if (soundFile) {
                const audio = new Audio(soundFile);
                audio.volume = 0.5;
                audio.play().catch(e => console.error('Audio play error:', e));
            }
        }
    } catch (error) {
        console.error('Error playing sound:', error);
    }
}

// สร้างกระดานเกม
function createBoard() {
    if (!gameBoard) {
        console.error('Game board element not found');
        return;
    }
    
    console.log('Creating checkers board');
    
    // ล้างกระดานเดิม
    gameBoard.innerHTML = '';
    gameBoard.style.display = 'grid';
    gameBoard.style.gridTemplateColumns = 'repeat(8, 1fr)';
    gameBoard.style.gridTemplateRows = 'repeat(8, 1fr)';
    gameBoard.style.aspectRatio = '1 / 1';
    gameBoard.style.gap = '0px';
    gameBoard.style.border = '2px solid #8B5A2B';
    
    // สร้างกระดานใหม่
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const square = document.createElement('div');
            const isLight = (row + col) % 2 === 0;
            
            // กำหนด class และ style
            square.style.width = '100%';
            square.style.height = '100%';
            square.style.position = 'relative';
            square.style.backgroundColor = isLight ? '#f0d9b5' : '#b58863';
            square.style.boxSizing = 'border-box';
            square.style.border = '1px solid #8B5A2B';
            
            square.dataset.row = row;
            square.dataset.col = col;
            
            // เพิ่ม event listener สำหรับการคลิก
            square.addEventListener('click', handleSquareClick);
            
            // เพิ่มไปที่กระดาน
            gameBoard.appendChild(square);
        }
    }
    
    // สร้างหมากบนกระดาน
    if (gameState.board) {
        updateBoard();
    }
}

// อัปเดตกระดานจากสถานะเกม
function updateBoard() {
    if (!gameBoard || !gameState.board) {
        console.error('Cannot update board: board element or state missing');
        return;
    }
    
    console.log('Updating checkers board');
    
    // Reset all squares
    const squares = gameBoard.querySelectorAll('div');
    squares.forEach(square => {
        // ลบหมากที่มีอยู่
        while (square.firstChild) {
            square.removeChild(square.firstChild);
        }
        
        // รีเซ็ตคลาสที่เกี่ยวข้องกับการเลือก
        square.classList.remove('piece-selected', 'valid-move');
    });
    
    // ใส่หมากตามสถานะเกม
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const pieceType = gameState.board[row][col];
            if (pieceType !== 0) {
                const square = getSquare(row, col);
                
                if (square) {
                    // สร้างหมาก
                    const piece = document.createElement('div');
                    
                    // กำหนดประเภทของหมาก
                    const isWhite = pieceType === 1 || pieceType === 3;
                    const isKing = pieceType === 3 || pieceType === 4;
                    
                    // กำหนดสไตล์ของหมาก
                    piece.style.width = '80%';
                    piece.style.height = '80%';
                    piece.style.borderRadius = '50%';
                    piece.style.position = 'absolute';
                    piece.style.top = '50%';
                    piece.style.left = '50%';
                    piece.style.transform = 'translate(-50%, -50%)';
                    piece.style.backgroundColor = isWhite ? '#f8f8f8' : '#333333';
                    piece.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.16)';
                    
                    // เพิ่มเครื่องหมายสำหรับ King
                    if (isKing) {
                        const crown = document.createElement('div');
                        crown.style.position = 'absolute';
                        crown.style.top = '50%';
                        crown.style.left = '50%';
                        crown.style.transform = 'translate(-50%, -50%)';
                        crown.style.fontSize = '1.5rem';
                        crown.style.color = 'gold';
                        crown.textContent = '♔';
                        piece.appendChild(crown);
                    }
                    
                    // เพิ่มหมากลงในช่อง
                    square.appendChild(piece);
                    
                    // เพิ่ม style ถ้าเป็นหมากที่ถูกเลือก
                    if (gameState.selectedPiece && 
                        gameState.selectedPiece.row === row && 
                        gameState.selectedPiece.col === col) {
                        piece.style.boxShadow = '0 0 0 3px gold';
                    }
                }
            }
        }
    }
    
    // แสดงช่องที่สามารถเดินได้
    if (gameState.selectedPiece && gameState.validMoves) {
        Object.entries(gameState.validMoves).forEach(([key, moveInfo]) => {
            const [toRow, toCol] = key.split(',').map(Number);
            const square = getSquare(toRow, toCol);
            if (square) {
                // เพิ่มจุดแสดงช่องที่สามารถเดินได้
                const indicator = document.createElement('div');
                indicator.style.width = '20%';
                indicator.style.height = '20%';
                indicator.style.borderRadius = '50%';
                indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                indicator.style.position = 'absolute';
                indicator.style.top = '50%';
                indicator.style.left = '50%';
                indicator.style.transform = 'translate(-50%, -50%)';
                square.appendChild(indicator);
            }
        });
    }
}

// หาช่องจากตำแหน่ง row, col
function getSquare(row, col) {
    return gameBoard.querySelector(`div[data-row="${row}"][data-col="${col}"]`);
}

// อัปเดตข้อความสถานะเกม
function updateGameStatus() {
    if (!gameStatus) return;
    
    let statusText = '';
    
    if (gameState.gameOver) {
        if (gameState.winner === 'player') {
            statusText = '<span class="text-green-500">คุณชนะ!</span> ';
        } else if (gameState.winner === 'ai') {
            statusText = '<span class="text-red-500">AI ชนะ!</span> ';
        } else {
            statusText = '<span class="text-yellow-500">เสมอ!</span> ';
        }
    } else {
        if (gameState.playerTurn) {
            statusText = 'ตาของคุณ';
        } else {
            statusText = 'AI กำลังคิด...';
        }
    }
    
    gameStatus.innerHTML = statusText;
}

// แสดง overlay ผู้ชนะ
function showWinnerOverlay(message) {
    if (winnerText && winnerOverlay) {
        winnerText.innerHTML = message;
        winnerOverlay.classList.remove('hidden');
        winnerOverlay.classList.add('flex', 'items-center', 'justify-center');
    }
}

// ซ่อน overlay ผู้ชนะ
function hideWinnerOverlay() {
    if (winnerOverlay) {
        winnerOverlay.classList.add('hidden');
    }
}

// เริ่มเกมใหม่
function startNewGame() {
    try {
        // ดำเนินการด้วยค่า AI mode ปัจจุบัน
        const data = {
            ai_mode: gameState.aiMode,
            session_id: gameState.sessionId,
            player_color: gameState.playerColor
        };
        
        // แสดงสถานะการโหลด
        updateLoadingState(true);
        
        // ส่งคำขอไปยัง API
        fetch('/api/checkers/new_game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            // ตั้งค่าสถานะเกมใหม่
            gameState.board = data.board;
            gameState.playerTurn = data.player_turn;
            gameState.gameOver = false;
            gameState.winner = null;
            gameState.selectedPiece = null;
            gameState.validMoves = {};
            
            // อัปเดตกระดานและสถานะ
            createBoard();
            updateGameStatus();
            updateBoard();
            
            // ล้างประวัติการเคลื่อนที่หากมี
            if (moveHistory) {
                moveHistory.innerHTML = '<div class="text-center p-2 text-gray-400">ยังไม่มีการเคลื่อนที่</div>';
            }
            
            // ซ่อน overlay
            hideWinnerOverlay();
            
            // เพิ่มข้อมูลใน log
            console.log('เริ่มเกมใหม่:', data);
        })
        .catch(error => {
            console.error('Error starting new game:', error);
            showErrorMessage('เกิดข้อผิดพลาดในการเริ่มเกมใหม่');
        })
        .finally(() => {
            updateLoadingState(false);
        });
    } catch (error) {
        console.error('Error in startNewGame:', error);
        showErrorMessage('เกิดข้อผิดพลาดในการเริ่มเกมใหม่');
        updateLoadingState(false);
    }
}

// จัดการคลิกที่ช่องบนกระดาน
function handleSquareClick(event) {
    // ตรวจสอบว่ากำลังโหลดอยู่หรือไม่
    if (gameState.isLoading || gameState.gameOver || !gameState.playerTurn) {
        return;
    }
    
    const square = event.target.closest('[data-row]');
    if (!square) return;
    
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    // ตรวจสอบว่าเป็นช่องที่มีหมากที่เลือกได้หรือไม่
    if (gameState.selectedPiece) {
        // ถ้ามีหมากที่เลือกอยู่แล้ว ให้ตรวจสอบว่าคลิกที่ช่องที่เดินได้หรือไม่
        const key = `${row},${col}`;
        
        if (gameState.validMoves && gameState.validMoves[key]) {
            // ทำการเคลื่อนที่
            makeMove(
                gameState.selectedPiece.row,
                gameState.selectedPiece.col,
                row,
                col
            );
        } else if (gameState.board[row][col] !== 0) {
            // ถ้าคลิกที่หมากตัวอื่น ให้เปลี่ยนการเลือก (ถ้าเป็นหมากของผู้เล่น)
            const pieceType = gameState.board[row][col];
            const isPlayerPiece = (gameState.playerColor === 'white' && (pieceType === 1 || pieceType === 3)) ||
                              (gameState.playerColor === 'black' && (pieceType === 2 || pieceType === 4));
            
            if (isPlayerPiece) {
                selectPiece(row, col);
            }
        } else {
            // คลิกที่ช่องว่างที่เดินไม่ได้ ให้ยกเลิกการเลือก
            clearSelection();
        }
    } else {
        // ถ้ายังไม่มีหมากที่เลือก ให้เลือกหมากถ้าคลิกที่หมากของผู้เล่น
        const pieceType = gameState.board[row][col];
        if (pieceType === 0) return; // ไม่มีหมาก
        
        const isPlayerPiece = (gameState.playerColor === 'white' && (pieceType === 1 || pieceType === 3)) ||
                          (gameState.playerColor === 'black' && (pieceType === 2 || pieceType === 4));
        
        if (isPlayerPiece) {
            selectPiece(row, col);
        }
    }
}

// เลือกหมาก
function selectPiece(row, col) {
    // ตรวจสอบว่ากำลังโหลดอยู่หรือไม่
    if (gameState.isLoading) return;
    
    // เล่นเสียงเลือก
    playSound('select');
    
    // ล้างการเลือกเดิม
    clearSelection();
    
    // บันทึกหมากที่เลือก
    gameState.selectedPiece = { row, col };
    
    // ขอการเคลื่อนที่ที่ถูกต้อง
    getValidMoves(row, col);
    
    // อัปเดตสถานะบนกระดาน
    updateBoard();
}

// ล้างการเลือก
function clearSelection() {
    gameState.selectedPiece = null;
    gameState.validMoves = {};
    
    // ล้าง class piece-selected ออกจากทุกช่อง
    const squares = gameBoard.querySelectorAll('.piece-selected, .valid-move');
    squares.forEach(square => {
        square.classList.remove('piece-selected');
        square.classList.remove('valid-move');
    });
}

// ขอการเคลื่อนที่ที่ถูกต้องจาก API
function getValidMoves(row, col) {
    // ตรวจสอบว่ากำลังโหลดอยู่หรือไม่
    if (gameState.isLoading) return;
    
    updateLoadingState(true);
    
    fetch('/api/checkers/valid_moves', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: gameState.sessionId,
            row: row,
            col: col
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        gameState.validMoves = data.valid_moves;
        updateBoard();
    })
    .catch(error => {
        console.error('Error getting valid moves:', error);
        showErrorMessage('ไม่สามารถดึงข้อมูลการเคลื่อนที่ที่ถูกต้องได้');
        clearSelection();
    })
    .finally(() => {
        updateLoadingState(false);
    });
}

// ทำการเคลื่อนที่
function makeMove(fromRow, fromCol, toRow, toCol) {
    // ตรวจสอบว่ากำลังโหลดอยู่หรือไม่
    if (gameState.isLoading) return;
    
    updateLoadingState(true);
    
    // แสดง console log เพื่อ debug
    console.log('Making move:', { fromRow, fromCol, toRow, toCol });
    
    // ส่งคำขอไปยัง API
    fetch('/api/checkers/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from_row: fromRow,
            from_col: fromCol,
            to_row: toRow,
            to_col: toCol
        })
    })
    .then(response => {
        if (!response.ok) {
            // ดึงข้อความผิดพลาดจากการตอบกลับ
            return response.json().then(errorData => {
                throw new Error(errorData.error || `เกิดข้อผิดพลาด (${response.status})`);
            }).catch(error => {
                throw new Error(`เกิดข้อผิดพลาดในการเคลื่อนย้ายหมาก (${response.status})`);
            });
        }
        return response.json();
    })
    .then(data => {
        // อัปเดตสถานะเกม
        console.log('Move successful, received data:', data);
        gameState.board = data.board;
        gameState.playerTurn = data.player_turn;
        
        // เล่นเสียงเคลื่อนที่
        playSound('move');
        
        // ล้างการเลือก
        clearSelection();
        
        // อัปเดตกระดาน
        updateBoard();
        
        // อัปเดตสถานะเกม
        updateGameStatus();
        
        // ตรวจสอบผู้ชนะ
        if (data.game_over) {
            gameState.gameOver = true;
            gameState.winner = data.winner;
            
            if (data.winner === 'player') {
                playSound('win');
                showWinnerOverlay('คุณชนะ! 🎉');
                updateGameStats('win');
            } else if (data.winner === 'ai') {
                playSound('lose');
                showWinnerOverlay('AI ชนะ 😢');
                updateGameStats('lose');
            } else {
                showWinnerOverlay('เสมอ! 🤝');
                updateGameStats('draw');
            }
            return;
        }
        
        // ถ้าไม่ใช่ตาผู้เล่น ให้ AI เดิน
        if (!data.player_turn) {
            setTimeout(() => {
                if (!gameState.gameOver) {
                    aiMove();
                }
            }, 500);
        }
    })
    .catch(error => {
        console.error('Error making move:', error);
        showErrorMessage(error.message || 'เกิดข้อผิดพลาดในการเคลื่อนย้ายหมาก');
        clearSelection();
    })
    .finally(() => {
        updateLoadingState(false);
    });
}

// เพิ่มประวัติการเคลื่อนที่
function addMoveToHistory(fromRow, fromCol, toRow, toCol, captured) {
    if (!moveHistory) return;
    
    // ล้างข้อความว่างหากเป็นการเคลื่อนที่แรก
    if (moveHistory.querySelector('.text-gray-400')) {
        moveHistory.innerHTML = '';
    }
    
    const moveEntry = document.createElement('div');
    moveEntry.className = 'p-1 border-b border-gray-700';
    
    const playerPiece = gameState.playerColor === 'white' ? '' : '';
    const moveText = `${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    
    moveEntry.textContent = captured ? `${moveText} (กิน)` : moveText;
    
    // เพิ่มลงในประวัติ (เพิ่มที่ด้านบนสุด)
    moveHistory.insertBefore(moveEntry, moveHistory.firstChild);
}

// AI ทำการเคลื่อนที่
function aiMove() {
    if (gameState.isLoading || gameState.gameOver || gameState.playerTurn) {
        return;
    }
    
    updateLoadingState(true);
    
    // แสดงข้อความว่า AI กำลังคิด
    const statusText = document.getElementById('game-status-text');
    if (statusText) {
        statusText.textContent = 'AI กำลังคิด...';
    }
    
    // ทำการสุ่มเคลื่อนที่ AI ด้วยตัวเอง (แบบง่าย)
    setTimeout(() => {
        // เรียกใช้ API เพื่อให้ AI ทำการเคลื่อนที่
        fetch('/api/checkers/ai_move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.move) {
                // อัปเดตกระดาน
                gameState.board = data.board;
                gameState.playerTurn = true;
                
                // เล่นเสียงเคลื่อนที่
                playSound(data.captured ? 'capture' : 'move');
                
                // อัปเดตกระดาน
                updateBoard();
                
                // อัปเดตสถานะเกม
                updateGameStatus();
                
                // เพิ่มการเคลื่อนที่ลงในประวัติ
                if (data.from_row !== undefined) {
                    addMoveToHistory(data.from_row, data.from_col, data.to_row, data.to_col, data.captured);
                }
                
                // ตรวจสอบสิ้นสุดเกม
                if (data.game_over) {
                    gameState.gameOver = true;
                    gameState.winner = data.winner;
                    
                    if (data.winner === 'player') {
                        playSound('win');
                        showWinnerOverlay('คุณชนะ! 🎉');
                        updateGameStats('win');
                    } else if (data.winner === 'ai') {
                        playSound('lose');
                        showWinnerOverlay('AI ชนะ 😢');
                        updateGameStats('lose');
                    } else {
                        showWinnerOverlay('เสมอ! 🤝');
                        updateGameStats('draw');
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error in AI move:', error);
        })
        .finally(() => {
            updateLoadingState(false);
        });
    }, 500); // ให้ AI คิด 0.5 วินาที
}

// โหลดสถิติเกม
function loadGameStats() {
    fetch('/api/get_stats?game_type=Checkers')
    .then(response => response.json())
    .then(data => {
        // อัปเดตแสดงสถิติ
        statsElements.totalGames.textContent = data.total_games;
        statsElements.playerWins.textContent = data.player_wins;
        statsElements.aiWins.textContent = data.ai_wins;
        statsElements.draws.textContent = data.draws;
        statsElements.winRate.textContent = data.win_rate + '%';
    })
    .catch(error => {
        console.error('Error loading game stats:', error);
    });
}

// อัปเดตสถิติเกม
function updateGameStats(result) {
    // ตรวจสอบว่าเกมจบแล้วจริงๆ
    if (!gameState.gameOver) return;
    
    // อัปเดตสถานะเกมอีกครั้งเพื่อให้แน่ใจว่าไม่ขึ้น "AI กำลังคิด..."
    gameState.playerTurn = true; // ต้องตั้งค่าให้เป็นตาผู้เล่นเพื่อไม่ให้ขึ้น "AI กำลังคิด..."
    updateGameStatus();
    
    // แก้ไขข้อความสถานะเกมที่อาจแสดงผิด
    const statusText = document.getElementById('game-status-text');
    if (statusText) {
        if (result === 'win') {
            statusText.textContent = 'คุณชนะ! 🎉';
        } else if (result === 'lose') {
            statusText.textContent = 'AI ชนะ 😢';
        } else {
            statusText.textContent = 'เสมอ! 🤝';
        }
    }
    
    fetch('/api/update_stats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game_type: 'Checkers',
            result: result
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Stats updated:', data);
        
        // โหลดสถิติใหม่ทันที
        fetch('/api/get_stats?game_type=Checkers')
        .then(response => response.json())
        .then(statsData => {
            console.log('Updated stats received:', statsData);
            
            // อัปเดตแสดงสถิติโดยตรง
            if (statsElements) {
                statsElements.totalGames.textContent = statsData.total_games || 0;
                statsElements.playerWins.textContent = statsData.player_wins || 0;
                statsElements.aiWins.textContent = statsData.ai_wins || 0;
                statsElements.draws.textContent = statsData.draws || 0;
                statsElements.winRate.textContent = (statsData.win_rate || 0) + '%';
            }
        })
        .catch(error => {
            console.error('Failed to fetch updated stats:', error);
        });
    })
    .catch(error => {
        console.error('Error updating stats:', error);
    });
}

// เปลี่ยนโหมด AI
function changeAIMode() {
    // วนลูปโหมด AI (1, 2, 3)
    gameState.aiMode = (gameState.aiMode % 3) + 1;
    
    // อัปเดตข้อความปุ่ม
    if (changeAiBtn) {
        const modeTexts = {
            1: 'ง่าย',
            2: 'ปานกลาง',
            3: 'ยาก'
        };
        changeAiBtn.textContent = `AI: ${modeTexts[gameState.aiMode] || 'ปานกลาง'}`;
    }
}

// เปลี่ยนสีผู้เล่น
function changePlayerColor(color) {
    if (color === gameState.playerColor) return;
    
    gameState.playerColor = color;
    
    // อัปเดตการแสดงผลปุ่ม
    if (playerWhiteBtn && playerBlackBtn) {
        playerWhiteBtn.classList.toggle('selected', color === 'white');
        playerBlackBtn.classList.toggle('selected', color === 'black');
    }
    
    // เริ่มเกมใหม่ด้วยสีที่เลือก
    startNewGame();
}

// ตั้งค่า event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // เพิ่ม event listeners สำหรับปุ่มต่างๆ
    if (newGameBtn) {
        newGameBtn.addEventListener('click', startNewGame);
        console.log('Added event listener to New Game button');
    }
    
    if (changeAiBtn) {
        changeAiBtn.addEventListener('click', changeAIMode);
        console.log('Added event listener to Change AI Mode button');
    }
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => window.location.href = '/');
        console.log('Added event listener to Back to Menu button');
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', startNewGame);
        console.log('Added event listener to Play Again button');
    }
    
    if (returnToMenuBtn) {
        returnToMenuBtn.addEventListener('click', () => window.location.href = '/');
        console.log('Added event listener to Return to Menu button');
    }
    
    if (animationToggle) {
        animationToggle.addEventListener('click', toggleAnimations);
        console.log('Added event listener to Animation Toggle');
    }
    
    if (soundToggle) {
        soundToggle.addEventListener('click', toggleSound);
        console.log('Added event listener to Sound Toggle');
    }
    
    if (playerWhiteBtn) {
        playerWhiteBtn.addEventListener('click', () => changePlayerColor('white'));
        console.log('Added event listener to Player White button');
    }
    
    if (playerBlackBtn) {
        playerBlackBtn.addEventListener('click', () => changePlayerColor('black'));
        console.log('Added event listener to Player Black button');
    }
    
    // สำหรับปุ่มระดับความยาก (ใช้ Class แทน ID)
    const aiButtons = document.querySelectorAll('.ai-algorithm');
    if (aiButtons && aiButtons.length > 0) {
        aiButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // ลบ class selected จากทุกปุ่ม
                aiButtons.forEach(btn => btn.classList.remove('bg-primary', 'text-white', 'selected'));
                btn.classList.add('bg-white/5', 'hover:bg-white/10');
                
                // เพิ่ม class selected ให้ปุ่มที่ถูกคลิก
                const clickedButton = e.currentTarget;
                clickedButton.classList.remove('bg-white/5', 'hover:bg-white/10');
                clickedButton.classList.add('bg-primary', 'text-white', 'selected');
                
                // ตั้งค่า AI mode
                const algorithm = parseInt(clickedButton.dataset.algorithm);
                gameState.aiMode = algorithm;
                localStorage.setItem('checkers_aiMode', algorithm);
                console.log('AI mode changed to:', algorithm);
                
                // เริ่มเกมใหม่ถ้าต้องการ
                if (gameState.gameStarted) {
                    if (confirm('การเปลี่ยนระดับความยากจะเริ่มเกมใหม่ คุณต้องการดำเนินการต่อหรือไม่?')) {
                        startNewGame();
                    }
                }
            });
        });
        console.log('Added event listeners to AI difficulty buttons');
    } else {
        console.warn('AI difficulty buttons not found');
    }
    
    if (aiModeSelect) {
        aiModeSelect.addEventListener('change', (e) => {
            gameState.aiMode = parseInt(e.target.value);
            localStorage.setItem('checkers_aiMode', gameState.aiMode);
            console.log('AI mode changed to:', gameState.aiMode);
        });
        console.log('Added event listener to AI Mode selector');
    }
}

// สร้าง event listeners เมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    // เริ่มเกม
    initGame();
});
