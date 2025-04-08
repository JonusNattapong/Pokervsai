interface GameState {
    board: string[];
    currentPlayer: 'X' | 'O';
    winner: string | null;
    isGameOver: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    stats: {
        wins: number;
        losses: number;
        draws: number;
    };
}

class TicTacToe {
    private state: GameState;
    private cells!: NodeListOf<Element>;
    private buttons!: {
        difficulty: NodeListOf<Element>;
        player: NodeListOf<Element>;
        newGame: Element | null;
        playAgain: Element | null;
    };

    constructor() {
        this.state = {
            board: Array(9).fill(''),
            currentPlayer: 'X',
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
        this.cells = document.querySelectorAll('.grid button');
        this.buttons = {
            difficulty: document.querySelectorAll('.mb-6:first-child button'),
            player: document.querySelectorAll('.mb-6:last-child button'),
            newGame: document.querySelector('button.bg-gradient-to-r'),
            playAgain: document.querySelector('button.bg-white\\/5')
        };
    }

    private initializeEventListeners(): void {
        // เพิ่ม event listeners สำหรับ cells
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // เพิ่ม event listeners สำหรับปุ่มต่างๆ
        this.buttons.difficulty.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.setDifficulty(['easy', 'medium', 'hard'][index] as 'easy' | 'medium' | 'hard');
                this.updateDifficultyButtons();
            });
        });

        this.buttons.player.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.state.currentPlayer = index === 0 ? 'X' : 'O';
                this.updatePlayerButtons();
                if (this.state.currentPlayer === 'O') {
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

    private handleCellClick(index: number): void {
        if (this.state.board[index] || this.state.isGameOver) return;

        this.makeMove(index);
        if (!this.state.isGameOver) {
            this.makeAIMove();
        }
    }

    private makeMove(index: number): void {
        this.state.board[index] = this.state.currentPlayer;
        this.updateBoard();
        this.checkGameStatus();
        this.state.currentPlayer = this.state.currentPlayer === 'X' ? 'O' : 'X';
    }

    private makeAIMove(): void {
        const index = this.calculateBestMove();
        if (index !== -1) {
            setTimeout(() => this.makeMove(index), 500);
        }
    }

    private calculateBestMove(): number {
        switch (this.state.difficulty) {
            case 'easy':
                return this.getRandomEmptyCell();
            case 'medium':
                return Math.random() < 0.5 ? this.getRandomEmptyCell() : this.minimax(this.state.board, this.state.currentPlayer).index;
            case 'hard':
                return this.minimax(this.state.board, this.state.currentPlayer).index;
            default:
                return -1;
        }
    }

    private minimax(board: string[], player: string): { score: number; index: number } {
        const availableMoves = this.getEmptyCells(board);

        if (this.checkWinner(board, 'X')) {
            return { score: -10, index: -1 };
        } else if (this.checkWinner(board, 'O')) {
            return { score: 10, index: -1 };
        } else if (availableMoves.length === 0) {
            return { score: 0, index: -1 };
        }

        const moves = availableMoves.map(index => {
            board[index] = player;
            const score = this.minimax(board, player === 'X' ? 'O' : 'X').score;
            board[index] = '';
            return { score, index };
        });

        return player === 'O'
            ? moves.reduce((best, move) => (move.score > best.score ? move : best))
            : moves.reduce((best, move) => (move.score < best.score ? move : best));
    }

    private getRandomEmptyCell(): number {
        const emptyCells = this.getEmptyCells(this.state.board);
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    private getEmptyCells(board: string[]): number[] {
        return board.reduce((cells: number[], cell, index) => {
            if (!cell) cells.push(index);
            return cells;
        }, []);
    }

    private checkWinner(board: string[], player: string): boolean {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // แนวนอน
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // แนวตั้ง
            [0, 4, 8], [2, 4, 6] // แนวทแยง
        ];

        return winPatterns.some(pattern =>
            pattern.every(index => board[index] === player)
        );
    }

    private checkGameStatus(): void {
        if (this.checkWinner(this.state.board, 'X')) {
            this.endGame('X');
        } else if (this.checkWinner(this.state.board, 'O')) {
            this.endGame('O');
        } else if (!this.state.board.includes('')) {
            this.endGame('draw');
        }
    }

    private endGame(result: 'X' | 'O' | 'draw'): void {
        this.state.isGameOver = true;
        this.state.winner = result;

        if (result === 'draw') {
            this.state.stats.draws++;
        } else if (result === this.state.currentPlayer) {
            this.state.stats.wins++;
        } else {
            this.state.stats.losses++;
        }

        this.saveStats();
        this.updateStats();
    }

    private resetGame(): void {
        this.state.board = Array(9).fill('');
        this.state.winner = null;
        this.state.isGameOver = false;
        this.updateBoard();

        if (this.state.currentPlayer === 'O') {
            this.makeAIMove();
        }
    }

    private setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
        this.state.difficulty = difficulty;
        this.resetGame();
    }

    private updateBoard(): void {
        this.cells.forEach((cell, index) => {
            cell.textContent = this.state.board[index];
            cell.className = `aspect-square bg-white/5 rounded-xl text-6xl font-bold flex items-center justify-center hover:bg-white/10 transition-colors ${
                this.state.board[index] === 'X' ? 'text-primary' : 'text-primary-hover'
            }`;
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
            const player = index === 0 ? 'X' : 'O';
            button.className = `px-4 py-2 rounded-lg transition-colors ${
                this.state.currentPlayer === player
                    ? 'bg-primary text-white'
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
        localStorage.setItem('tictactoe-stats', JSON.stringify(this.state.stats));
    }

    private loadStats(): void {
        const savedStats = localStorage.getItem('tictactoe-stats');
        if (savedStats) {
            this.state.stats = JSON.parse(savedStats);
        }
    }
}

// เริ่มต้นเกม
new TicTacToe(); 