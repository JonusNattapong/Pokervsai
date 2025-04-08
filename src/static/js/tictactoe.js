/**
 * Tic Tac Toe Game
 * เกมติกแตกโตะระหว่างผู้เล่นกับ AI
 */

// DOM Elements
const gameBoard = document.getElementById('game-board');
const statusText = document.getElementById('game-status');
const newGameBtn = document.getElementById('new-game-btn');
const aiButtons = document.querySelectorAll('.ai-algorithm');
const winnerOverlay = document.getElementById('winner-overlay');
const winnerText = document.getElementById('winner-text');
const playAgainBtn = document.getElementById('play-again-btn');
const mainMenuBtn = document.getElementById('main-menu-btn');

// Game State
const gameState = {
    board: [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ],
    playerTurn: true,  // true = ผู้เล่น (O), false = AI (X)
    gameOver: false,
    winner: null,      // 'player', 'ai', 'draw', null
    aiMode: 0,         // 0 = ง่าย, 1 = กลาง, 2 = ยาก
    sessionId: null
};

// สร้าง session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// โหลดพรีเฟอเรนซ์จาก localStorage
function loadPreferences() {
    // โหลดค่า AI mode จาก localStorage ถ้ามี
    const savedAiMode = localStorage.getItem('tictactoe_ai_mode');
    if (savedAiMode !== null) {
        gameState.aiMode = parseInt(savedAiMode);
        
        // อัปเดตปุ่ม AI mode
        aiButtons.forEach(btn => {
            const algorithm = parseInt(btn.dataset.algorithm);
            if (algorithm === gameState.aiMode) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }
}

// บันทึกพรีเฟอเรนซ์ลง localStorage
function savePreferences() {
    localStorage.setItem('tictactoe_ai_mode', gameState.aiMode.toString());
}

// สร้างกระดานเกม
function createBoard() {
    // ไม่ต้องสร้างเซลล์ใหม่ เพราะเรามีเซลล์อยู่แล้วในไฟล์ HTML
    // แต่ต้องเพิ่ม event listener ให้กับแต่ละเซลล์
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        // เพิ่ม event listener
        cell.addEventListener('click', handleCellClick);
        
        // ล้างค่าเซลล์
        cell.textContent = '';
        cell.classList.remove('player-o', 'player-x');
    });
}

// อัปเดตกระดานจากสถานะเกม
function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (gameState.board[row][col]) {
            cell.textContent = gameState.board[row][col];
            cell.classList.remove('player-o', 'player-x');
            cell.classList.add(gameState.board[row][col] === 'O' ? 'player-o' : 'player-x');
        } else {
            cell.textContent = '';
            cell.classList.remove('player-o', 'player-x');
        }
    });
}

// จัดการกับการคลิกเซลล์
function handleCellClick(e) {
    if (gameState.gameOver || !gameState.playerTurn) return;
    
    const cell = e.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    // ตรวจสอบว่าเซลล์ว่างหรือไม่
    if (gameState.board[row][col] !== '') return;
    
    // ผู้เล่นวาง O
    makeMove(row, col, 'O');
    
    // ตรวจสอบว่าเกมจบหรือยัง
    if (checkWin('O')) {
        gameState.gameOver = true;
        gameState.winner = 'player';
        updateGameStatus();
        showWinnerOverlay('คุณชนะ! ');
        // บันทึกสถิติ
        updateStats('player');
        return;
    }
    
    if (checkDraw()) {
        gameState.gameOver = true;
        gameState.winner = 'draw';
        updateGameStatus();
        showWinnerOverlay('เสมอ! ');
        // บันทึกสถิติ
        updateStats('draw');
        return;
    }
    
    // เปลี่ยนเทิร์นเป็น AI
    gameState.playerTurn = false;
    updateGameStatus();
    
    // AI วาง X หลังจากรอ 1 วินาที
    setTimeout(makeAiMove, 800);
}

// AI วาง X
function makeAiMove() {
    if (gameState.gameOver) return;
    
    // ส่งคำขอ API เพื่อให้ AI ตัดสินใจ
    fetch('/api/make_move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            game_type: 'TicTacToe',
            board: gameState.board,
            difficulty: gameState.aiMode
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error making AI move:', data.message);
            return;
        }
        
        // รับตำแหน่งที่ AI เลือก
        const row = data.move.row;
        const col = data.move.col;
        
        // AI วาง X
        makeMove(row, col, 'X');
        
        // ตรวจสอบว่าเกมจบหรือยัง
        if (checkWin('X')) {
            gameState.gameOver = true;
            gameState.winner = 'ai';
            updateGameStatus();
            showWinnerOverlay('AI ชนะ! ');
            // บันทึกสถิติ
            updateStats('ai');
            return;
        }
        
        if (checkDraw()) {
            gameState.gameOver = true;
            gameState.winner = 'draw';
            updateGameStatus();
            showWinnerOverlay('เสมอ! ');
            // บันทึกสถิติ
            updateStats('draw');
            return;
        }
        
        // เปลี่ยนเทิร์นเป็นผู้เล่น
        gameState.playerTurn = true;
        updateGameStatus();
    })
    .catch(error => {
        console.error('Error making AI move:', error);
        // ถ้าเกิดข้อผิดพลาด ให้สุ่มตำแหน่งไปเลย
        makeRandomMove();
    });
}

// ถ้า API มีปัญหา ให้สุ่มตำแหน่ง
function makeRandomMove() {
    // หาตำแหน่งที่ว่าง
    const availableMoves = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (gameState.board[i][j] === '') {
                availableMoves.push({row: i, col: j});
            }
        }
    }
    
    if (availableMoves.length > 0) {
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        makeMove(randomMove.row, randomMove.col, 'X');
        
        // ตรวจสอบว่าเกมจบหรือยัง
        if (checkWin('X')) {
            gameState.gameOver = true;
            gameState.winner = 'ai';
            updateGameStatus();
            showWinnerOverlay('AI ชนะ! ');
            return;
        }
        
        if (checkDraw()) {
            gameState.gameOver = true;
            gameState.winner = 'draw';
            updateGameStatus();
            showWinnerOverlay('เสมอ! ');
            return;
        }
        
        // เปลี่ยนเทิร์นเป็นผู้เล่น
        gameState.playerTurn = true;
        updateGameStatus();
    }
}

// วางตัวบนกระดาน
function makeMove(row, col, player) {
    gameState.board[row][col] = player;
    updateBoard();
}

// ตรวจสอบว่ามีผู้ชนะหรือไม่
function checkWin(player) {
    // ตรวจสอบแนวนอน
    for (let row = 0; row < 3; row++) {
        if (gameState.board[row][0] === player && 
            gameState.board[row][1] === player && 
            gameState.board[row][2] === player) {
            return true;
        }
    }
    
    // ตรวจสอบแนวตั้ง
    for (let col = 0; col < 3; col++) {
        if (gameState.board[0][col] === player && 
            gameState.board[1][col] === player && 
            gameState.board[2][col] === player) {
            return true;
        }
    }
    
    // ตรวจสอบแนวทแยงหลัก
    if (gameState.board[0][0] === player && 
        gameState.board[1][1] === player && 
        gameState.board[2][2] === player) {
        return true;
    }
    
    // ตรวจสอบแนวทแยงรอง
    if (gameState.board[0][2] === player && 
        gameState.board[1][1] === player && 
        gameState.board[2][0] === player) {
        return true;
    }
    
    return false;
}

// ตรวจสอบว่าเสมอหรือไม่
function checkDraw() {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            if (gameState.board[row][col] === '') {
                return false;
            }
        }
    }
    
    return !checkWin('X') && !checkWin('O');
}

// อัปเดตสถานะเกมบน UI
function updateGameStatus() {
    if (gameState.gameOver) {
        if (gameState.winner === 'player') {
            statusText.textContent = 'คุณชนะ!';
        } else if (gameState.winner === 'ai') {
            statusText.textContent = 'AI ชนะ!';
        } else {
            statusText.textContent = 'เสมอ!';
        }
    } else {
        if (gameState.playerTurn) {
            statusText.textContent = 'ถึงตาคุณ (O)';
        } else {
            statusText.textContent = 'ถึงตา AI (X)';
        }
    }
}

// แสดง overlay ผู้ชนะ
function showWinnerOverlay(message) {
    winnerText.textContent = message;
    winnerOverlay.classList.remove('hidden');
    winnerOverlay.classList.add('flex');
}

// ซ่อน overlay ผู้ชนะ
function hideWinnerOverlay() {
    winnerOverlay.classList.add('hidden');
    winnerOverlay.classList.remove('flex');
}

// เริ่มเกมใหม่
function startNewGame() {
    // รีเซ็ตสถานะเกม
    gameState.board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];
    gameState.gameOver = false;
    gameState.winner = null;
    gameState.playerTurn = true;
    
    // ซ่อน overlay ผู้ชนะ
    hideWinnerOverlay();
    
    // อัปเดตกระดาน
    updateBoard();
    
    // อัปเดตสถานะเกม
    updateGameStatus();
    
    // สร้าง session ID ใหม่
    gameState.sessionId = generateSessionId();
    
    // แจ้ง API ว่าเริ่มเกมใหม่
    fetch('/api/new_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: gameState.sessionId,
            game_type: 'TicTacToe',
            difficulty: gameState.aiMode
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error starting new game:', data.error);
        }
    })
    .catch(error => {
        console.error('Error starting new game:', error);
    });
}

// เปลี่ยนโหมด AI
function changeAiMode(mode) {
    gameState.aiMode = mode;
    
    // บันทึกพรีเฟอเรนซ์
    savePreferences();
    
    // อัปเดตปุ่ม AI mode
    aiButtons.forEach(btn => {
        const algorithm = parseInt(btn.dataset.algorithm);
        if (algorithm === mode) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    // แจ้ง API ว่าเปลี่ยนโหมด AI
    fetch('/api/change_ai_mode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            game: 'TicTacToe',
            mode: mode.toString()
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error changing AI mode:', data.error);
        }
    })
    .catch(error => {
        console.error('Error changing AI mode:', error);
    });
    
    // เริ่มเกมใหม่
    startNewGame();
}

// โหลดสถิติเกม
function loadGameStats() {
    fetch('/api/get_stats?game_type=TicTacToe')
        .then(response => response.json())
        .then(data => {
            console.log('Game Stats:', data);
        })
        .catch(error => {
            console.error('Error loading game stats:', error);
        });
}

// อัปเดตสถิติเกม
function updateStats(result) {
    fetch('/api/update_stats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            game_type: 'TicTacToe',
            result: result
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error updating stats:', data.error);
        }
    })
    .catch(error => {
        console.error('Error updating stats:', error);
    });
}

// ตั้งค่า event listeners
function setupEventListeners() {
    // ปุ่มเริ่มเกมใหม่
    newGameBtn.addEventListener('click', startNewGame);
    
    // ปุ่มเล่นอีกครั้ง
    playAgainBtn.addEventListener('click', startNewGame);
    
    // ปุ่มกลับเมนูหลัก
    mainMenuBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    // ปุ่มเลือกโหมด AI
    aiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = parseInt(btn.dataset.algorithm);
            changeAiMode(mode);
        });
    });
}

// เริ่มเกม
function initGame() {
    console.log('Initializing Tic Tac Toe Game');
    
    // โหลดพรีเฟอเรนซ์
    loadPreferences();
    
    // สร้างกระดานเกม
    createBoard();
    
    // ตั้งค่า event listeners
    setupEventListeners();
    
    // โหลดสถิติเกม
    loadGameStats();
    
    // เริ่มเกมใหม่
    startNewGame();
    
    // ตรวจสอบว่ามีการตั้งค่า AI mode จาก URL หรือไม่
    const urlParams = new URLSearchParams(window.location.search);
    const aiMode = urlParams.get('ai');
    if (aiMode !== null && ['0', '1', '2'].includes(aiMode)) {
        changeAiMode(parseInt(aiMode));
    }
    
    // อัปเดตสถานะเกม
    updateGameStatus();
}

// รันเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', initGame);
