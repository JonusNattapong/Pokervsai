interface ConnectFourGameState {
    board: string[][];
    currentPlayer: 'red' | 'yellow';
    winner: string | null;
    isGameOver: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    stats: {
        wins: number;
        losses: number;
        draws: number;
    };
}

class ConnectFour {
    private state: ConnectFourGameState;
    private readonly ROWS = 6;
    private readonly COLS = 7;
    private cells!: NodeListOf<Element>;
    private columnButtons!: NodeListOf<Element>;
    private buttons!: {
        difficulty: NodeListOf<Element>;
        player: NodeListOf<Element>;
        newGame: Element | null;
        playAgain: Element | null;
    };

    constructor() {
        this.state = {
            board: Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill('')),
            currentPlayer: 'red',
            winner: null,
            isGameOver: false,
            difficulty: 'medium',
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
    }

    private initializeElements(): void {
        this.cells = document.querySelectorAll('.grid > div:not(button)');
        this.columnButtons = document.querySelectorAll('.grid > button');
        this.buttons = {
            difficulty: document.querySelectorAll('.mb-6:first-child button'),
            player: document.querySelectorAll('.mb-6:last-child button'),
            newGame: document.querySelector('button.bg-gradient-to-r'),
            playAgain: document.querySelector('button.bg-white\\/5')
        };
    }

    private initializeEventListeners(): void {
        // เพิ่ม event listeners สำหรับปุ่มในแต่ละคอลัมน์
        this.columnButtons.forEach((button, col) => {
            button.addEventListener('click', () => this.handleColumnClick(col));
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
                this.state.currentPlayer = index === 0 ? 'red' : 'yellow';
                this.updatePlayerButtons();
                if (this.state.currentPlayer === 'yellow') {
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

    private handleColumnClick(col: number): void {
        if (this.state.isGameOver) return;

        const row = this.getLowestEmptyRow(col);
        if (row !== -1) {
            this.makeMove(row, col);
            if (!this.state.isGameOver) {
                this.makeAIMove();
            }
        }
    }

    private getLowestEmptyRow(col: number): number {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (!this.state.board[row][col]) {
                return row;
            }
        }
        return -1;
    }

    private makeMove(row: number, col: number): void {
        this.state.board[row][col] = this.state.currentPlayer;
        this.updateBoard();
        this.checkGameStatus();
        this.state.currentPlayer = this.state.currentPlayer === 'red' ? 'yellow' : 'red';
    }

    private makeAIMove(): void {
        setTimeout(() => {
            const col = this.calculateBestMove();
            if (col !== -1) {
                const row = this.getLowestEmptyRow(col);
                if (row !== -1) {
                    this.makeMove(row, col);
                }
            }
        }, 500);
    }

    private calculateBestMove(): number {
        switch (this.state.difficulty) {
            case 'easy':
                return this.getRandomValidColumn();
            case 'medium':
                return Math.random() < 0.5 ? this.getRandomValidColumn() : this.findBestColumn();
            case 'hard':
                return this.findBestColumn();
            default:
                return -1;
        }
    }

    private findBestColumn(): number {
        // ตรวจสอบการชนะในรอบถัดไป
        for (let col = 0; col < this.COLS; col++) {
            const row = this.getLowestEmptyRow(col);
            if (row !== -1) {
                this.state.board[row][col] = this.state.currentPlayer;
                if (this.checkWinner(row, col, this.state.currentPlayer)) {
                    this.state.board[row][col] = '';
                    return col;
                }
                this.state.board[row][col] = '';
            }
        }

        // ป้องกันการชนะของฝ่ายตรงข้าม
        const opponent = this.state.currentPlayer === 'red' ? 'yellow' : 'red';
        for (let col = 0; col < this.COLS; col++) {
            const row = this.getLowestEmptyRow(col);
            if (row !== -1) {
                this.state.board[row][col] = opponent;
                if (this.checkWinner(row, col, opponent)) {
                    this.state.board[row][col] = '';
                    return col;
                }
                this.state.board[row][col] = '';
            }
        }

        // เลือกคอลัมน์กลางถ้าว่าง
        const centerCol = 3;
        if (this.getLowestEmptyRow(centerCol) !== -1) {
            return centerCol;
        }

        // เลือกคอลัมน์ที่ว่างแบบสุ่ม
        return this.getRandomValidColumn();
    }

    private getRandomValidColumn(): number {
        const validColumns = [];
        for (let col = 0; col < this.COLS; col++) {
            if (this.getLowestEmptyRow(col) !== -1) {
                validColumns.push(col);
            }
        }
        return validColumns[Math.floor(Math.random() * validColumns.length)];
    }

    private checkWinner(row: number, col: number, player: string): boolean {
        // ตรวจสอบแนวนอน
        let count = 0;
        for (let c = 0; c < this.COLS; c++) {
            if (this.state.board[row][c] === player) {
                count++;
                if (count === 4) return true;
            } else {
                count = 0;
            }
        }

        // ตรวจสอบแนวตั้ง
        count = 0;
        for (let r = 0; r < this.ROWS; r++) {
            if (this.state.board[r][col] === player) {
                count++;
                if (count === 4) return true;
            } else {
                count = 0;
            }
        }

        // ตรวจสอบแนวทแยงขึ้น
        count = 0;
        let r = row + 3;
        let c = col - 3;
        for (let i = 0; i < 7; i++) {
            if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
                if (this.state.board[r][c] === player) {
                    count++;
                    if (count === 4) return true;
                } else {
                    count = 0;
                }
            }
            r--;
            c++;
        }

        // ตรวจสอบแนวทแยงลง
        count = 0;
        r = row - 3;
        c = col - 3;
        for (let i = 0; i < 7; i++) {
            if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
                if (this.state.board[r][c] === player) {
                    count++;
                    if (count === 4) return true;
                } else {
                    count = 0;
                }
            }
            r++;
            c++;
        }

        return false;
    }

    private checkGameStatus(): void {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.state.board[row][col]) {
                    if (this.checkWinner(row, col, this.state.board[row][col])) {
                        this.endGame(this.state.board[row][col] as 'red' | 'yellow');
                        return;
                    }
                }
            }
        }

        // ตรวจสอบเสมอ
        if (this.state.board.every(row => row.every(cell => cell))) {
            this.endGame('draw');
        }
    }

    private endGame(result: 'red' | 'yellow' | 'draw'): void {
        this.state.isGameOver = true;
        this.state.winner = result;

        if (result === 'draw') {
            this.state.stats.draws++;
        } else if ((result === 'red' && this.state.currentPlayer === 'red') ||
                   (result === 'yellow' && this.state.currentPlayer === 'yellow')) {
            this.state.stats.wins++;
        } else {
            this.state.stats.losses++;
        }

        this.saveStats();
        this.updateStats();
    }

    private resetGame(): void {
        this.state.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(''));
        this.state.winner = null;
        this.state.isGameOver = false;
        this.updateBoard();

        if (this.state.currentPlayer === 'yellow') {
            this.makeAIMove();
        }
    }

    private setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
        this.state.difficulty = difficulty;
        this.resetGame();
    }

    private updateBoard(): void {
        this.state.board.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const index = rowIndex * this.COLS + colIndex;
                const element = this.cells[index];
                element.className = `aspect-square rounded-full transition-colors ${
                    cell === 'red' ? 'bg-primary' :
                    cell === 'yellow' ? 'bg-primary-hover' :
                    'bg-white/5'
                }`;
            });
        });
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
            const player = index === 0 ? 'red' : 'yellow';
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
        localStorage.setItem('connect-four-stats', JSON.stringify(this.state.stats));
    }

    private loadStats(): void {
        const savedStats = localStorage.getItem('connect-four-stats');
        if (savedStats) {
            this.state.stats = JSON.parse(savedStats);
        }
    }
}

// เริ่มต้นเกม
new ConnectFour(); 