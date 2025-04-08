// JavaScript สำหรับเกมหมากรุก (Chess)

// สถานะเกม
let gameState = {
    board: null,
    sessionId: null,
    gameOver: false,
    winner: null,
    playerTurn: true,
    aiMode: 1,                // เริ่มต้นที่ระดับปานกลาง
    selectedPiece: null,
    validMoves: {},
    promotionMove: null,
    playerColor: 'white',     // ผู้เล่นเริ่มต้นเป็นฝั่งขาว
    check: false,             // สถานะถูกรุก
    animationsEnabled: true,  // เปิดแอนิเมชันเริ่มต้น
    soundEnabled: true,       // เปิดเสียงเริ่มต้น
    moveHistory: [],          // ประวัติการเคลื่อนที่
    capturedPieces: {         // หมากที่ถูกกิน
        white: [],
        black: []
    }
};

// Sound effects
const SOUNDS = {
    move: '/static/sounds/move.mp3',
    capture: '/static/sounds/capture.mp3',
    check: '/static/sounds/check.mp3',
    castle: '/static/sounds/castle.mp3',
    promotion: '/static/sounds/promotion.mp3',
    win: '/static/sounds/win.mp3',
    lose: '/static/sounds/lose.mp3',
    error: '/static/sounds/error.mp3',
    select: '/static/sounds/select.mp3'
};

// DOM elements
const gameBoard = document.getElementById('game-board');
const gameStatus = document.getElementById('status');
const newGameBtn = document.getElementById('new-game');
const changeAiBtn = document.getElementById('change-ai');
const backToMenuBtn = document.getElementById('back-to-menu');
const playAgainBtn = document.getElementById('play-again');
const returnToMenuBtn = document.getElementById('return-to-menu');
const winnerOverlay = document.getElementById('winner-overlay');
const winnerText = document.getElementById('winner-text');
const promotionOverlay = document.getElementById('promotion-overlay');
const promotionOptions = document.getElementById('promotion-options');
const moveHistory = document.getElementById('move-history');
const animationToggle = document.getElementById('animation-toggle');
const soundToggle = document.getElementById('sound-toggle');
const playerWhiteBtn = document.getElementById('btn-player-white');
const playerBlackBtn = document.getElementById('btn-player-black');
const capturedWhitePieces = document.getElementById('captured-white');
const capturedBlackPieces = document.getElementById('captured-black');

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

// ชื่อตัวหมาก
const PIECE_NAMES = {
    'P': 'เบี้ย',
    'R': 'เรือ',
    'N': 'ม้า',
    'B': 'บิชอป',
    'Q': 'ควีน',
    'K': 'คิง'
};

// Unicode symbols ของตัวหมาก
const PIECES = {
    'white': {
        'P': '♙',
        'R': '♖',
        'N': '♘',
        'B': '♗',
        'Q': '♕',
        'K': '♔'
    },
    'black': {
        'P': '♟',
        'R': '♜',
        'N': '♞',
        'B': '♝',
        'Q': '♛',
        'K': '♚'
    }
};

// สร้างกระดานเกม
function createBoard() {
    if (!gameBoard) return;
    
    // ล้างกระดานเดิม
    gameBoard.innerHTML = '';
    
    // สร้างกระดานใหม่
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const square = document.createElement('div');
            const isLight = (row + col) % 2 === 0;
            
            // กำหนด class ตามสีของช่อง (สลับสีขาว-ดำ)
            square.className = `aspect-square relative ${isLight ? 'bg-board-light' : 'bg-board-dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            
            // เพิ่ม event listener สำหรับการคลิก
            square.addEventListener('click', handleSquareClick);
            
            // แสดงชื่อตำแหน่ง (เช่น A1, B2, etc.)
            if (row === 7) {
                const colLabel = document.createElement('div');
                colLabel.className = 'absolute bottom-0 right-1 text-xs opacity-60';
                colLabel.textContent = String.fromCharCode(65 + col); // A, B, C, ...
                square.appendChild(colLabel);
            }
            
            if (col === 0) {
                const rowLabel = document.createElement('div');
                rowLabel.className = 'absolute top-0 left-1 text-xs opacity-60';
                rowLabel.textContent = 8 - row; // 8, 7, 6, ...
                square.appendChild(rowLabel);
            }
            
            // เพิ่มช่องลงในกระดาน
            gameBoard.appendChild(square);
        }
    }
    
    // สร้างหมากบนกระดาน
    if (gameState.board) {
        updateBoard();
    }
}

// สร้างอิลิเมนท์ของตัวหมาก
function createPieceElement(piece, color) {
    if (!piece || !color) return null;
    
    const pieceElement = document.createElement('div');
    pieceElement.className = `piece piece-${color.toLowerCase()}`;
    
    // ใส่สัญลักษณ์ Unicode ของตัวหมาก
    pieceElement.innerHTML = PIECES[color.toLowerCase()][piece];
    
    // ข้อมูลของหมาก
    pieceElement.dataset.piece = piece;
    pieceElement.dataset.color = color.toLowerCase();
    
    return pieceElement;
}

// อัปเดตกระดานจากสถานะเกม
function updateBoard() {
    if (!gameBoard || !gameState.board) return;
    
    // Reset all squares
    const squares = gameBoard.querySelectorAll('div[data-row]');
    squares.forEach(square => {
        // เก็บ class สีของช่องไว้
        const isLight = square.classList.contains('bg-board-light');
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        // ลบ class พิเศษเดิม
        square.className = `aspect-square relative ${isLight ? 'bg-board-light' : 'bg-board-dark'}`;
        
        // ลบหมากเดิม แต่เก็บป้ายชื่อไว้
        const labels = Array.from(square.children).filter(
            child => child.classList.contains('text-xs')
        );
        square.innerHTML = '';
        
        // ใส่ป้ายชื่อกลับคืน
        labels.forEach(label => square.appendChild(label));
        
        // เพิ่ม class ถ้าเป็นช่องที่ถูกเลือก
        if (gameState.selectedPiece && 
            gameState.selectedPiece.row === row && 
            gameState.selectedPiece.col === col) {
            square.classList.add('piece-selected');
        }
        
        // ไฮไลท์ช่องการเคลื่อนที่ที่ถูกต้อง
        if (gameState.selectedPiece && gameState.validMoves) {
            for (const moveKey in gameState.validMoves) {
                const [moveRow, moveCol] = moveKey.split(',').map(Number);
                if (row === moveRow && col === moveCol) {
                    square.classList.add('valid-move');
                    
                    // ใส่จุดแสดงช่องที่สามารถเดินได้
                    const moveIndicator = document.createElement('div');
                    moveIndicator.className = 'move-indicator';
                    square.appendChild(moveIndicator);
                }
            }
        }
        
        // ไฮไลท์ช่องถ้าคิงถูกรุก
        if (gameState.check) {
            const piece = gameState.board[row][col];
            if (piece && piece.type === 'K' && 
                ((gameState.playerTurn && piece.color === gameState.playerColor) || 
                 (!gameState.playerTurn && piece.color !== gameState.playerColor))) {
                square.classList.add('check');
            }
        }
    });
    
    // วางหมากตามสถานะเกม
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = gameState.board[row][col];
            if (piece) {
                const square = getSquare(row, col);
                if (square) {
                    const pieceElement = createPieceElement(piece.type, piece.color);
                    if (pieceElement) {
                        square.appendChild(pieceElement);
                    }
                }
            }
        }
    }
    
    // อัปเดตหมากที่ถูกจับ
    updateCapturedPieces();
    
    // ถ้าแอนิเมชันถูกปิด ให้เพิ่ม class ให้กับ body
    document.body.classList.toggle('animations-disabled', !gameState.animationsEnabled);
}

// อัปเดตหมากที่ถูกจับ
function updateCapturedPieces() {
    if (capturedWhitePieces && capturedBlackPieces) {
        // ล้างหมากที่ถูกจับก่อนหน้า
        capturedWhitePieces.innerHTML = '';
        capturedBlackPieces.innerHTML = '';
        
        // แสดงหมากขาวที่ถูกจับ
        if (gameState.capturedPieces.white.length > 0) {
            gameState.capturedPieces.white.forEach(piece => {
                const pieceElement = createPieceElement(piece, 'white');
                if (pieceElement) {
                    pieceElement.classList.add('captured-piece');
                    capturedWhitePieces.appendChild(pieceElement);
                }
            });
        } else {
            capturedWhitePieces.innerHTML = '<div class="text-gray-400 text-sm">ยังไม่มีหมากที่ถูกจับ</div>';
        }
        
        // แสดงหมากดำที่ถูกจับ
        if (gameState.capturedPieces.black.length > 0) {
            gameState.capturedPieces.black.forEach(piece => {
                const pieceElement = createPieceElement(piece, 'black');
                if (pieceElement) {
                    pieceElement.classList.add('captured-piece');
                    capturedBlackPieces.appendChild(pieceElement);
                }
            });
        } else {
            capturedBlackPieces.innerHTML = '<div class="text-gray-400 text-sm">ยังไม่มีหมากที่ถูกจับ</div>';
        }
    }
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
        if (gameState.check) {
            if (gameState.playerTurn) {
                statusText = '<span class="text-orange-500">คุณถูกรุก! </span> กรุณาป้องกันคิง';
            } else {
                statusText = '<span class="text-blue-500">AI ถูกรุก! </span> รอ AI ทำการป้องกัน';
            }
        } else {
            if (gameState.playerTurn) {
                statusText = 'ตาของคุณ';
            } else {
                statusText = 'AI กำลังคิด...';
            }
        }
    }
    
    gameStatus.innerHTML = statusText;
}

// แสดง overlay ผู้ชนะ
function showWinnerOverlay(message) {
    if (winnerText && winnerOverlay) {
        winnerText.innerHTML = message;
        winnerOverlay.classList.remove('hidden');
    }
}

// ซ่อน overlay ผู้ชนะ
function hideWinnerOverlay() {
    if (winnerOverlay) {
        winnerOverlay.classList.add('hidden');
    }
}

// แสดง overlay สำหรับเลือกการเลื่อนขั้นของเบี้ย
function showPromotionOverlay(from_row, from_col, to_row, to_col) {
    if (!promotionOverlay || !promotionOptions) return;
    
    // บันทึกข้อมูลการเคลื่อนที่
    gameState.promotionMove = {
        from_row,
        from_col,
        to_row,
        to_col
    };
    
    // ล้างตัวเลือกเดิม
    promotionOptions.innerHTML = '';
    
    // สร้างตัวเลือกสำหรับการเลื่อนขั้น
    const pieces = ['Q', 'R', 'B', 'N']; // ควีน, เรือ, บิชอป, ม้า
    const color = gameState.playerColor;
    
    pieces.forEach(piece => {
        const pieceButton = document.createElement('div');
        pieceButton.className = 'promotion-piece';
        pieceButton.innerHTML = PIECES[color][piece];
        pieceButton.dataset.piece = piece;
        
        // ชื่อเต็มของตัวหมาก
        const pieceName = document.createElement('div');
        pieceName.className = 'piece-name';
        pieceName.textContent = PIECE_NAMES[piece];
        pieceButton.appendChild(pieceName);
        
        pieceButton.addEventListener('click', () => handlePromotion(piece));
        promotionOptions.appendChild(pieceButton);
    });
    
    // แสดง overlay
    promotionOverlay.classList.remove('hidden');
}

// ซ่อน overlay เลือกการเลื่อนขั้น
function hidePromotionOverlay() {
    if (promotionOverlay) {
        promotionOverlay.classList.add('hidden');
    }
    
    // ล้างข้อมูลการเคลื่อนที่
    gameState.promotionMove = null;
}

// จัดการการเลื่อนขั้นของเบี้ย
function handlePromotion(piece) {
    // ตรวจสอบว่ามีข้อมูลการเคลื่อนที่หรือไม่
    if (!gameState.promotionMove) return;
    
    const { from_row, from_col, to_row, to_col } = gameState.promotionMove;
    
    // ทำการเคลื่อนที่พร้อมเลื่อนขั้น
    makeMove(from_row, from_col, to_row, to_col, piece);
    
    // ซ่อน overlay
    hidePromotionOverlay();
    
    // เล่นเสียงเลื่อนขั้น
    playSound('promotion');
}

// รับช่องจากตำแหน่ง
function getSquare(row, col) {
    return gameBoard ? gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`) : null;
}

// เริ่มเกม
function initGame() {
    try {
        console.log('Initializing Chess game...');
        
        // สร้าง sessionId
        gameState.sessionId = generateSessionId();
        
        // ตั้งค่าโหมด AI จาก URL parameters (ถ้ามี)
        const urlParams = new URLSearchParams(window.location.search);
        const aiParam = urlParams.get('ai');
        if (aiParam !== null) {
            gameState.aiMode = parseInt(aiParam);
        }
        
        // โหลดค่าพรีเฟอเรนซ์จาก localStorage
        loadPreferences();
        
        // เริ่มเกมใหม่
        startNewGame();
        
        // โหลดสถิติ
        loadGameStats();
        
        // ตั้งค่า event listeners
        setupEventListeners();
        
        console.log('Chess game initialized successfully');
    } catch (error) {
        console.error('Error initializing Chess game:', error);
        showErrorMessage('เกิดข้อผิดพลาดในการโหลดเกม โปรดรีเฟรชหน้า');
    }
}

// โหลดค่าพรีเฟอเรนซ์จาก localStorage
function loadPreferences() {
    // โหลดการตั้งค่าแอนิเมชัน
    if (localStorage.getItem('chessAnimationsEnabled') !== null) {
        gameState.animationsEnabled = localStorage.getItem('chessAnimationsEnabled') === 'true';
        updateAnimationToggle();
    }
    
    // โหลดการตั้งค่าเสียง
    if (localStorage.getItem('chessSoundEnabled') !== null) {
        gameState.soundEnabled = localStorage.getItem('chessSoundEnabled') === 'true';
        updateSoundToggle();
    }
}

// อัปเดตปุ่มเปิด/ปิดแอนิเมชัน
function updateAnimationToggle() {
    if (animationToggle) {
        animationToggle.textContent = gameState.animationsEnabled ? 
            ' เอฟเฟกต์: เปิด' : ' เอฟเฟกต์: ปิด';
    }
}

// อัปเดตปุ่มเปิด/ปิดเสียง
function updateSoundToggle() {
    if (soundToggle) {
        soundToggle.textContent = gameState.soundEnabled ? '' : '';
    }
}

// เปิด/ปิดแอนิเมชัน
function toggleAnimations() {
    gameState.animationsEnabled = !gameState.animationsEnabled;
    localStorage.setItem('chessAnimationsEnabled', gameState.animationsEnabled);
    updateAnimationToggle();
    document.body.classList.toggle('animations-disabled', !gameState.animationsEnabled);
}

// เปิด/ปิดเสียง
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    localStorage.setItem('chessSoundEnabled', gameState.soundEnabled);
    updateSoundToggle();
}

// สร้าง sessionId แบบสุ่มที่มีความปลอดภัยมากขึ้น
function generateSessionId() {
    const timestamp = new Date().getTime().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}`;
}

// แสดงข้อความผิดพลาด
function showErrorMessage(message) {
    try {
        if (typeof makeApiRequest !== 'undefined' && typeof showMessage !== 'undefined') {
            // ใช้ฟังก์ชั่นจาก game_utils.js ถ้ามี
            showMessage(message, 'error');
        } else {
            // สร้าง toast notification
            const toastElement = document.createElement('div');
            toastElement.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
            toastElement.textContent = message;
            document.body.appendChild(toastElement);
            
            // ซ่อนอัตโนมัติหลังจาก 5 วินาที
            setTimeout(() => {
                document.body.removeChild(toastElement);
            }, 5000);
        }
    } catch (error) {
        console.error('Error showing message:', error);
        alert(message);
    }
}

// แสดง/ซ่อนสถานะการโหลด
function updateLoadingState(isLoading) {
    try {
        if (typeof makeApiRequest !== 'undefined' && typeof updateLoadingState !== 'undefined') {
            // ใช้ฟังก์ชั่นจาก game_utils.js ถ้ามี
            window.updateLoadingState(isLoading);
        } else {
            // สร้างหรือปรับปรุงตัวแสดงสถานะการโหลด
            let loaderElement = document.getElementById('chess-loader');
            
            if (isLoading) {
                if (!loaderElement) {
                    loaderElement = document.createElement('div');
                    loaderElement.id = 'chess-loader';
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
    } catch (error) {
        console.error('Error updating loading state:', error);
    }
}

// เล่นเสียงเอฟเฟกต์
function playSound(soundName) {
    // ตรวจสอบการตั้งค่าเสียง
    if (!gameState.soundEnabled) return;
    
    try {
        const audio = new Audio(SOUNDS[soundName]);
        audio.play().catch(err => console.warn('Sound play error:', err));
    } catch (error) {
        console.warn(`Error playing sound ${soundName}:`, error);
    }
}

// เริ่มเกมใหม่
function startNewGame() {
    // ส่งคำขอ API เพื่อเริ่มเกมใหม่
    fetch('/api/new_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: gameState.sessionId,
            ai_mode: gameState.aiMode,
            game_type: 'Chess'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error starting new game:', data.error);
            return;
        }
        
        // อัปเดตสถานะเกม
        gameState.board = data.board;
        gameState.playerTurn = data.player_turn;
        gameState.gameOver = data.game_over;
        gameState.winner = data.winner;
        gameState.selectedPiece = null;
        gameState.validMoves = {};
        gameState.promotionMove = null;
        
        // อัปเดต UI
        createBoard();
        updateGameStatus();
        hidePromotionOverlay();
    })
    .catch(error => {
        console.error('Error starting new game:', error);
    });
}

// จัดการคลิกที่ช่องบนกระดาน
function handleSquareClick(event) {
    // ไม่ทำอะไรถ้าเกมจบแล้ว หรือไม่ใช่ตาของผู้เล่น
    if (gameState.gameOver || !gameState.playerTurn) {
        return;
    }
    
    const square = event.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    // กรณีที่ยังไม่ได้เลือกหมาก
    if (!gameState.selectedPiece) {
        // เช็คว่ามีหมากของผู้เล่นในช่องนี้หรือไม่
        if (gameState.board[row][col] && gameState.board[row][col].color === 'white') {
            // เลือกหมาก
            selectPiece(row, col);
        }
    } 
    // กรณีที่เลือกหมากไว้แล้ว
    else {
        const fromRow = gameState.selectedPiece.row;
        const fromCol = gameState.selectedPiece.col;
        
        // ถ้าคลิกที่ตำแหน่งเดิม = ยกเลิกการเลือก
        if (row === fromRow && col === fromCol) {
            clearSelection();
            return;
        }
        
        // เช็คว่าช่องที่คลิกเป็นการเคลื่อนที่ที่ถูกต้องหรือไม่
        const moveKey = `${row},${col}`;
        if (moveKey in gameState.validMoves) {
            const moveInfo = gameState.validMoves[moveKey];
            
            // ตรวจสอบการเลื่อนขั้นของเบี้ย
            if (moveInfo.promotion) {
                showPromotionOverlay(fromRow, fromCol, row, col);
                return;
            }
            
            // ทำการเคลื่อนที่
            makeMove(fromRow, fromCol, row, col);
        } 
        // ถ้าคลิกที่หมากของตัวเองอันอื่น
        else if (gameState.board[row][col] && gameState.board[row][col].color === 'white') {
            // เลือกหมากใหม่
            selectPiece(row, col);
        } 
        // ถ้าคลิกที่อื่น
        else {
            // ยกเลิกการเลือก
            clearSelection();
        }
    }
}

// เลือกหมาก
function selectPiece(row, col) {
    // ล้างการเลือกเก่า
    clearSelection();
    
    // เลือกหมากใหม่
    gameState.selectedPiece = { row, col };
    
    // ไฮไลต์ช่องที่เลือก
    const square = getSquare(row, col);
    square.classList.add('selected');
    
    // ขอการเคลื่อนที่ที่ถูกต้องจาก API
    getValidMoves(row, col);
}

// ล้างการเลือก
function clearSelection() {
    // ล้างไฮไลต์ช่องที่เลือก
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.classList.remove('selected', 'valid-move');
    });
    
    gameState.selectedPiece = null;
    gameState.validMoves = {};
    
    updateGameStatus();
}

// รับช่องจากตำแหน่ง
function getSquare(row, col) {
    return gameBoard ? gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`) : null;
}

// ขอการเคลื่อนที่ที่ถูกต้องจาก API
function getValidMoves(row, col) {
    fetch('/api/get_valid_moves', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: gameState.sessionId,
            row: row,
            col: col,
            game_type: 'Chess'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error getting valid moves:', data.error);
            return;
        }
        
        // บันทึกการเคลื่อนที่ที่ถูกต้อง
        gameState.validMoves = data.valid_moves || {};
        
        // ไฮไลต์การเคลื่อนที่ที่ถูกต้อง
        for (const moveKey in gameState.validMoves) {
            const [moveRow, moveCol] = moveKey.split(',').map(Number);
            const square = getSquare(moveRow, moveCol);
            square.classList.add('valid-move');
        }
        
        updateGameStatus();
    })
    .catch(error => {
        console.error('Error getting valid moves:', error);
    });
}

// ทำการเคลื่อนที่
function makeMove(fromRow, fromCol, toRow, toCol, promotionPiece = null) {
    fetch('/api/make_move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: gameState.sessionId,
            from_row: fromRow,
            from_col: fromCol,
            to_row: toRow,
            to_col: toCol,
            promotion_piece: promotionPiece,
            game_type: 'Chess'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error making move:', data.error);
            return;
        }
        
        // อัปเดตสถานะเกม
        gameState.board = data.board;
        gameState.playerTurn = data.player_turn;
        gameState.gameOver = data.game_over;
        gameState.winner = data.winner;
        gameState.selectedPiece = null;
        gameState.validMoves = {};
        
        // อัปเดต UI
        updateBoard();
        updateGameStatus();
        
        // อัปเดตสถิติถ้าเกมจบแล้ว
        if (gameState.gameOver) {
            loadGameStats();
        }
        
        // ถ้าเป็นตาของ AI และเกมยังไม่จบ
        if (!gameState.playerTurn && !gameState.gameOver) {
            // แสดงข้อความ AI กำลังคิด
            gameStatus.textContent = 'AI กำลังคิด...';
            
            // ให้ AI คิดสักพักก่อนเดิน
            setTimeout(() => {
                aiMove();
            }, 500);
        }
    })
    .catch(error => {
        console.error('Error making move:', error);
    });
}

// AI เดินหมาก
function aiMove() {
    fetch('/api/ai_move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: gameState.sessionId,
            game_type: 'Chess',
            ai_mode: gameState.aiMode
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error making AI move:', data.error);
            return;
        }
        
        // อัปเดตสถานะเกม
        gameState.board = data.board;
        gameState.playerTurn = data.player_turn;
        gameState.gameOver = data.game_over;
        gameState.winner = data.winner;
        
        // อัปเดต UI
        updateBoard();
        updateGameStatus();
        
        // อัปเดตสถิติถ้าเกมจบแล้ว
        if (gameState.gameOver) {
            loadGameStats();
        }
    })
    .catch(error => {
        console.error('Error making AI move:', error);
    });
}

// โหลดสถิติเกม
function loadGameStats() {
    fetch('/api/get_stats?game_type=Chess')
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

// เปลี่ยนโหมด AI
function changeAiMode() {
    const newMode = parseInt(aiModeSelect.value);
    
    fetch('/api/change_ai_mode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: gameState.sessionId,
            ai_mode: newMode
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error changing AI mode:', data.error);
            return;
        }
        
        gameState.aiMode = data.ai_mode;
        alert(`เปลี่ยนอัลกอริทึม AI เป็น ${getAiModeName(gameState.aiMode)}`);
    })
    .catch(error => {
        console.error('Error changing AI mode:', error);
    });
}

// ดึงชื่อโหมด AI
function getAiModeName(mode) {
    const modes = [
        "Minimax",
        "Pattern Recognition",
        "Q-Learning",
        "Neural Network",
        "MCTS",
        "Genetic Algorithm"
    ];
    return modes[mode] || "Unknown";
}

// ตั้งค่า event listeners
function setupEventListeners() {
    // ปุ่มเริ่มเกมใหม่
    newGameBtn.addEventListener('click', startNewGame);
    
    // ปุ่มเปลี่ยน AI
    changeAiBtn.addEventListener('click', changeAiMode);
    
    // ปุ่มกลับไปเมนู
    backToMenuBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    // ปุ่มเล่นอีกครั้งใน overlay
    playAgainBtn.addEventListener('click', () => {
        hideWinnerOverlay();
        startNewGame();
    });
    
    // ปุ่มกลับเมนูใน overlay
    returnToMenuBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    // ปุ่มเลือกโหมด AI
    aiModeSelect.addEventListener('change', () => {
        gameState.aiMode = parseInt(aiModeSelect.value);
    });
    
    // ปุ่มเปิด/ปิดแอนิเมชัน
    animationToggle.addEventListener('click', toggleAnimations);
    
    // ปุ่มเปิด/ปิดเสียง
    soundToggle.addEventListener('click', toggleSound);
    
    // ปุ่มเลือกสีของผู้เล่น
    playerWhiteBtn.addEventListener('click', () => {
        gameState.playerColor = 'white';
    });
    playerBlackBtn.addEventListener('click', () => {
        gameState.playerColor = 'black';
    });
}

// เริ่มต้นเกมเมื่อโหลดหน้าเสร็จ
document.addEventListener('DOMContentLoaded', initGame);

// ตัวอย่างการเพิ่มเสียงในอนาคต (ถ้าต้องการ)
function loadChessSounds() {
    const sounds = {
        move: new Audio('/static/sounds/Audio/move.ogg'),
        capture: new Audio('/static/sounds/Audio/capture.ogg'),
        check: new Audio('/static/sounds/Audio/check.ogg'),
        castle: new Audio('/static/sounds/Audio/castle.ogg'),
        win: new Audio('/static/sounds/Audio/win.ogg'),
        lose: new Audio('/static/sounds/Audio/lose.ogg')
    };
    
    return sounds;
}
