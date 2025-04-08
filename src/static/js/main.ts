interface GameCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    path: string;
}

class GameUI {
    private games: GameCard[] = [
        {
            id: 'tictactoe',
            title: 'Tic Tac Toe',
            description: 'เกม XO คลาสสิกที่มาพร้อมกับ AI หลากหลายระดับ',
            icon: '⭕',
            path: '/tictactoe'
        },
        {
            id: 'connect-four',
            title: 'Connect Four',
            description: 'เกมต่อเรียง 4 ที่ท้าทายความคิด',
            icon: '🔵',
            path: '/connect_four'
        },
        {
            id: 'checkers',
            title: 'Checkers',
            description: 'หมากฮอส กับ AI ที่ชาญฉลาด',
            icon: '👑',
            path: '/checkers'
        },
        {
            id: 'poker',
            title: 'Poker',
            description: 'โป๊กเกอร์ที่ใช้ AI ขั้นสูง ZomPokerX64',
            icon: '♠️',
            path: '/poker'
        }
    ];

    constructor() {
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        document.addEventListener('DOMContentLoaded', () => {
            this.addGameCardListeners();
            this.addLoadingEffects();
        });
    }

    private addGameCardListeners(): void {
        const gameCards = document.querySelectorAll('.group');
        gameCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                this.handleGameCardClick(this.games[index].path);
            });
        });
    }

    private handleGameCardClick(path: string): void {
        // เพิ่ม animation ก่อนเปลี่ยนหน้า
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = path;
        }, 300);
    }

    private addLoadingEffects(): void {
        // เพิ่ม fade-in effect เมื่อโหลดหน้า
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease-in-out';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);

        // เพิ่ม hover effect สำหรับ game cards
        const gameCards = document.querySelectorAll('.group');
        gameCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const icon = card.querySelector('.w-20');
                if (icon) {
                    icon.classList.add('scale-110');
                    icon.classList.add('transition-transform');
                    icon.classList.add('duration-300');
                }
            });

            card.addEventListener('mouseleave', () => {
                const icon = card.querySelector('.w-20');
                if (icon) {
                    icon.classList.remove('scale-110');
                }
            });
        });
    }
}

// เริ่มต้นใช้งาน GameUI
new GameUI(); 