// Sound Effects Manager
const SoundEffects = {
    sounds: {
        'card_deal': '/static/sounds/card_deal.mp3',
        'chip_check': '/static/sounds/chip_check.mp3',
        'chip_call': '/static/sounds/chip_call.mp3',
        'chip_raise': '/static/sounds/chip_raise.mp3',
        'card_fold': '/static/sounds/card_fold.mp3',
        'game_win': '/static/sounds/game_win.mp3',
        'game_lose': '/static/sounds/game_lose.mp3'
    },

    preload: function() {
        Object.keys(this.sounds).forEach(soundKey => {
            const audio = new Audio(this.sounds[soundKey]);
            audio.load();
        });
    },

    play: function(soundKey) {
        if (this.sounds[soundKey]) {
            const audio = new Audio(this.sounds[soundKey]);
            audio.play();
        }
    },

    setVolume: function(volume) {
        Object.keys(this.sounds).forEach(soundKey => {
            const audio = new Audio(this.sounds[soundKey]);
            audio.volume = volume;
        });
    }
};

// Preload all sound effects when the page loads
window.addEventListener('load', () => {
    SoundEffects.preload();
});
