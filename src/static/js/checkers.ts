interface CheckersGameState {
    board: string[][];
    currentPlayer: 'white' | 'black';
    selectedPiece: { row: number; col: number } | null;
    validMoves: { row: number; col: number }[];
    winner: string | null;
    isGameOver: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    moveHistory: string[];
    stats: {
        wins: number;
        losses: number;
        draws: number;
    };
}

interface Move {
    from: { row: number; col: number };
    to: { row: number; col: number };
    captures?: { row: number; col: number }[];
}

class Checkers {
    private state: CheckersGameState;
    private readonly BOARD_SIZE = 8;
    private squares!: NodeListOf<Element>;
    private buttons!: {
        difficulty: NodeListOf<Element>;
        player: NodeListOf<Element>;
        newGame: Element | null;
        playAgain: Element | null;
    };

    constructor() {
        this.state = {
            board: this.createInitialBoard(),
            currentPlayer: 'white',
            selectedPiece: null,
            validMoves: [],
            winner: null,
            isGameOver: false,
            difficulty: 'medium',
            moveHistory: [],
            stats: {
                wins: 0,
                losses: 0,
                draws: 0
            }
        };

        this.initializeElements();
        this.initializeEventListeners();
        this.loadStats();
        this.updateStats();
        this.updateBoard();
    }

    private createInitialBoard(): string[][] {
        const board = Array(this.BOARD_SIZE).fill(null).map(() => Array(this.BOARD_SIZE).fill(''));
        
        // วางหมากขาว
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = 'white';
                }
            }
        }

        // วางหมากดำ
        for (let row = 5; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = 'black';
                }
            }
        }

        return board;
    }

    private initializeElements(): void {
        this.squares = document.querySelectorAll('.grid-cols-8 > div');
        this.buttons = {
            difficulty: document.querySelectorAll('.mb-6:first-child button'),
            player: document.querySelectorAll('.mb-6:last-child button'),
            newGame: document.querySelector('button.bg-gradient-to-r'),
            playAgain: document.querySelector('button.bg-white\\/5')
        };
    }

    private initializeEventListeners(): void {
        // เพิ่ม event listeners สำหรับช่องบนกระดาน
        this.squares.forEach((square, index) => {
            square.addEventListener('click', () => {
                const row = Math.floor(index / this.BOARD_SIZE);
                const col = index % this.BOARD_SIZE;
                this.handleSquareClick(row, col);
            });
        });

        // เพิ่ม event listeners สำหรับปุ่มตั้งค่า
        this.buttons.difficulty.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.setDifficulty(['easy', 'medium', 'hard'][index] as 'easy' | 'medium' | 'hard');
                this.updateDifficultyButtons();
            });
        });

        this.buttons.player.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.state.currentPlayer = index === 0 ? 'white' : 'black';
                this.updatePlayerButtons();
                if (this.state.currentPlayer === 'black') {
                    this.makeAIMove();
                }
            });
        });

        if (this.buttons.newGame) {
            this.buttons.newGame.addEventListener('click', () => this.resetGame());
        }

        if (this.buttons.playAgain) {
            this.buttons.playAgain.addEventListener('click', () => this.resetGame());
        }
    }

    private handleSquareClick(row: number, col: number): void {
        if (this.state.isGameOver || this.state.currentPlayer === 'black') return;

        const piece = this.state.board[row][col];

        // ถ้ายังไม่ได้เลือกหมาก และคลิกที่หมากของตัวเอง
        if (!this.state.selectedPiece && piece === this.state.currentPlayer) {
            this.selectPiece(row, col);
        }
        // ถ้าเลือกหมากแล้ว และคลิกที่ช่องที่เป็นการเดินที่ถูกต้อง
        else if (this.state.selectedPiece && this.isValidMove(row, col)) {
            this.makeMove(this.state.selectedPiece, { row, col });
            this.clearSelection();
            if (!this.state.isGameOver) {
                this.makeAIMove();
            }
        }
        // ถ้าเลือกหมากแล้ว และคลิกที่หมากตัวอื่นของตัวเอง
        else if (piece === this.state.currentPlayer) {
            this.selectPiece(row, col);
        }
        // ถ้าคลิกที่อื่น
        else {
            this.clearSelection();
        }
    }

    private selectPiece(row: number, col: number): void {
        this.state.selectedPiece = { row, col };
        this.state.validMoves = this.getValidMoves(row, col);
        this.updateBoard();
    }

    private clearSelection(): void {
        this.state.selectedPiece = null;
        this.state.validMoves = [];
        this.updateBoard();
    }

    private isValidMove(row: number, col: number): boolean {
        return this.state.validMoves.some(move => move.row === row && move.col === col);
    }

    private getValidMoves(row: number, col: number): { row: number; col: number }[] {
        const moves: { row: number; col: number }[] = [];
        const piece = this.state.board[row][col];
        const isKing = piece.includes('king');
        const directions = isKing ? [-1, 1] : piece === 'white' ? [1] : [-1];

        // ตรวจสอบการเดินปกติ
        for (const rowDir of directions) {
            for (const colDir of [-1, 1]) {
                const newRow = row + rowDir;
                const newCol = col + colDir;
                if (this.isValidPosition(newRow, newCol) && !this.state.board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        // ตรวจสอบการกินหมาก
        const captures = this.getValidCaptures(row, col);
        moves.push(...captures.map(capture => capture.to));

        return moves;
    }

    private getValidCaptures(row: number, col: number): Move[] {
        const captures: Move[] = [];
        const piece = this.state.board[row][col];
        const isKing = piece.includes('king');
        const directions = isKing ? [-1, 1] : piece === 'white' ? [1] : [-1];

        for (const rowDir of directions) {
            for (const colDir of [-1, 1]) {
                const jumpRow = row + rowDir * 2;
                const jumpCol = col + colDir * 2;
                const captureRow = row + rowDir;
                const captureCol = col + colDir;

                if (this.isValidPosition(jumpRow, jumpCol) &&
                    !this.state.board[jumpRow][jumpCol] &&
                    this.state.board[captureRow][captureCol] &&
                    this.state.board[captureRow][captureCol].startsWith(this.getOpponentColor(piece))) {
                    captures.push({
                        from: { row, col },
                        to: { row: jumpRow, col: jumpCol },
                        captures: [{ row: captureRow, col: captureCol }]
                    });
                }
            }
        }

        return captures;
    }

    private isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE;
    }

    private getOpponentColor(piece: string): string {
        return piece.includes('white') ? 'black' : 'white';
    }

    private makeMove(from: { row: number; col: number }, to: { row: number; col: number }): void {
        const piece = this.state.board[from.row][from.col];
        this.state.board[from.row][from.col] = '';
        this.state.board[to.row][to.col] = piece;

        // ตรวจสอบการกินหมาก
        if (Math.abs(to.row - from.row) === 2) {
            const captureRow = (from.row + to.row) / 2;
            const captureCol = (from.col + to.col) / 2;
            this.state.board[captureRow][captureCol] = '';
        }

        // ตรวจสอบการเป็นหมากคิง
        if ((piece === 'white' && to.row === this.BOARD_SIZE - 1) ||
            (piece === 'black' && to.row === 0)) {
            this.state.board[to.row][to.col] = piece + '_king';
        }

        // บันทึกประวัติการเดิน
        const moveNotation = this.getMoveNotation(from, to);
        this.state.moveHistory.push(moveNotation);

        this.updateBoard();
        this.checkGameStatus();
        this.state.currentPlayer = this.state.currentPlayer === 'white' ? 'black' : 'white';
    }

    private getMoveNotation(from: { row: number; col: number }, to: { row: number; col: number }): string {
        const colToLetter = (col: number) => String.fromCharCode(97 + col);
        const rowToNumber = (row: number) => (this.BOARD_SIZE - row).toString();
        return `${colToLetter(from.col)}${rowToNumber(from.row)}-${colToLetter(to.col)}${rowToNumber(to.row)}`;
    }

    private makeAIMove(): void {
        setTimeout(() => {
            const move = this.calculateBestMove();
            if (move) {
                this.makeMove(move.from, move.to);
            }
        }, 500);
    }

    private calculateBestMove(): Move | null {
        const moves = this.getAllPossibleMoves();
        if (moves.length === 0) return null;

        switch (this.state.difficulty) {
            case 'easy':
                return moves[Math.floor(Math.random() * moves.length)];
            case 'medium':
                return Math.random() < 0.5 ? moves[Math.floor(Math.random() * moves.length)] : this.findBestMove(2);
            case 'hard':
                return this.findBestMove(4);
            default:
                return null;
        }
    }

    private getAllPossibleMoves(): Move[] {
        const moves: Move[] = [];
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.state.board[row][col].startsWith(this.state.currentPlayer)) {
                    const validMoves = this.getValidMoves(row, col);
                    validMoves.forEach(to => {
                        moves.push({ from: { row, col }, to });
                    });
                }
            }
        }
        return moves;
    }

    private findBestMove(depth: number): Move | null {
        const moves = this.getAllPossibleMoves();
        if (moves.length === 0) return null;

        let bestScore = -Infinity;
        let bestMove = moves[0];

        for (const move of moves) {
            // ทำการเดินหมากจำลอง
            const originalBoard = this.state.board.map(row => [...row]);
            this.makeMove(move.from, move.to);

            // คำนวณคะแนน
            const score = -this.minimax(depth - 1, -Infinity, Infinity, false);

            // คืนค่ากระดานกลับ
            this.state.board = originalBoard;
            this.state.currentPlayer = this.state.currentPlayer === 'white' ? 'black' : 'white';

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    private minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
        if (depth === 0) return this.evaluateBoard();

        const moves = this.getAllPossibleMoves();
        if (moves.length === 0) return isMaximizing ? -1000 : 1000;

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of moves) {
                const originalBoard = this.state.board.map(row => [...row]);
                this.makeMove(move.from, move.to);
                const score = this.minimax(depth - 1, alpha, beta, false);
                this.state.board = originalBoard;
                this.state.currentPlayer = this.state.currentPlayer === 'white' ? 'black' : 'white';
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of moves) {
                const originalBoard = this.state.board.map(row => [...row]);
                this.makeMove(move.from, move.to);
                const score = this.minimax(depth - 1, alpha, beta, true);
                this.state.board = originalBoard;
                this.state.currentPlayer = this.state.currentPlayer === 'white' ? 'black' : 'white';
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minScore;
        }
    }

    private evaluateBoard(): number {
        let score = 0;
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const piece = this.state.board[row][col];
                if (piece) {
                    const value = piece.includes('king') ? 3 : 1;
                    score += piece.startsWith(this.state.currentPlayer) ? value : -value;
                }
            }
        }
        return score;
    }

    private checkGameStatus(): void {
        const whitePieces = this.countPieces('white');
        const blackPieces = this.countPieces('black');

        if (whitePieces === 0) {
            this.endGame('black');
        } else if (blackPieces === 0) {
            this.endGame('white');
        } else if (this.getAllPossibleMoves().length === 0) {
            this.endGame('draw');
        }
    }

    private countPieces(color: string): number {
        let count = 0;
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.state.board[row][col].startsWith(color)) {
                    count++;
                }
            }
        }
        return count;
    }

    private endGame(result: 'white' | 'black' | 'draw'): void {
        this.state.isGameOver = true;
        this.state.winner = result;

        if (result === 'draw') {
            this.state.stats.draws++;
        } else if ((result === 'white' && this.state.currentPlayer === 'white') ||
                   (result === 'black' && this.state.currentPlayer === 'black')) {
            this.state.stats.wins++;
        } else {
            this.state.stats.losses++;
        }

        this.saveStats();
        this.updateStats();
    }

    private resetGame(): void {
        this.state.board = this.createInitialBoard();
        this.state.winner = null;
        this.state.isGameOver = false;
        this.state.selectedPiece = null;
        this.state.validMoves = [];
        this.state.moveHistory = [];
        this.updateBoard();

        if (this.state.currentPlayer === 'black') {
            this.makeAIMove();
        }
    }

    private setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
        this.state.difficulty = difficulty;
        this.resetGame();
    }

    private updateBoard(): void {
        this.squares.forEach((square, index) => {
            const row = Math.floor(index / this.BOARD_SIZE);
            const col = index % this.BOARD_SIZE;
            const piece = this.state.board[row][col];
            const isSelected = this.state.selectedPiece?.row === row && this.state.selectedPiece?.col === col;
            const isValidMove = this.state.validMoves.some(move => move.row === row && move.col === col);

            // สร้างหรืออัพเดตหมาก
            let pieceElement = square.querySelector('.piece');
            if (piece && !pieceElement) {
                pieceElement = document.createElement('div');
                pieceElement.className = 'piece absolute inset-2 rounded-full transition-all duration-300';
                square.appendChild(pieceElement);
            } else if (!piece && pieceElement) {
                pieceElement.remove();
            }

            if (pieceElement) {
                pieceElement.className = `piece absolute inset-2 rounded-full transition-all duration-300 ${
                    piece.startsWith('white') ? 'bg-white' : 'bg-gray-800'
                } ${
                    piece.includes('king') ? 'border-4 border-yellow-400' : ''
                } ${
                    isSelected ? 'ring-4 ring-primary' : ''
                }`;
            }

            // แสดงการเดินที่ถูกต้อง
            let moveIndicator = square.querySelector('.move-indicator');
            if (isValidMove && !moveIndicator) {
                moveIndicator = document.createElement('div');
                moveIndicator.className = 'move-indicator absolute inset-0 bg-primary/20 rounded-lg';
                square.appendChild(moveIndicator);
            } else if (!isValidMove && moveIndicator) {
                moveIndicator.remove();
            }
        });

        // อัพเดตประวัติการเดิน
        const moveHistoryContainer = document.querySelector('.max-h-48');
        if (moveHistoryContainer) {
            moveHistoryContainer.innerHTML = '';
            for (let i = 0; i < this.state.moveHistory.length; i += 2) {
                const moveNumber = Math.floor(i / 2) + 1;
                const whiteMove = this.state.moveHistory[i];
                const blackMove = this.state.moveHistory[i + 1] || '';
                
                const moveElement = document.createElement('div');
                moveElement.className = 'flex justify-between text-sm';
                moveElement.innerHTML = `
                    <span class="text-gray-400">${moveNumber}. ${whiteMove}</span>
                    <span class="text-gray-400">${blackMove}</span>
                `;
                moveHistoryContainer.appendChild(moveElement);
            }
            moveHistoryContainer.scrollTop = moveHistoryContainer.scrollHeight;
        }
    }

    private updateDifficultyButtons(): void {
        this.buttons.difficulty.forEach((button, index) => {
            const difficulty = ['easy', 'medium', 'hard'][index];
            button.className = `px-4 py-2 rounded-lg transition-colors ${
                this.state.difficulty === difficulty
                    ? 'bg-primary text-white'
                    : 'bg-white/5 hover:bg-white/10'
            }`;
        });
    }

    private updatePlayerButtons(): void {
        this.buttons.player.forEach((button, index) => {
            const player = index === 0 ? 'white' : 'black';
            button.className = `px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                this.state.currentPlayer === player
                    ? 'bg-primary'
                    : 'bg-white/5 hover:bg-white/10'
            }`;
        });
    }

    private updateStats(): void {
        const stats = document.querySelectorAll('.space-y-2 .font-bold');
        if (stats.length === 3) {
            stats[0].textContent = this.state.stats.wins.toString();
            stats[1].textContent = this.state.stats.losses.toString();
            stats[2].textContent = this.state.stats.draws.toString();
        }
    }

    private saveStats(): void {
        localStorage.setItem('checkers-stats', JSON.stringify(this.state.stats));
    }

    private loadStats(): void {
        const savedStats = localStorage.getItem('checkers-stats');
        if (savedStats) {
            this.state.stats = JSON.parse(savedStats);
        }
    }
}

// เริ่มต้นเกม
new Checkers(); 