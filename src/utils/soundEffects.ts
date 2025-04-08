
// Simple sound effect utility for poker game
const sounds = {
  cardDeal: new Audio('/sounds/card-deal.mp3'),
  chipStack: new Audio('/sounds/chip-stack.mp3'),
  win: new Audio('/sounds/win.mp3'),
  lose: new Audio('/sounds/lose.mp3'),
  check: new Audio('/sounds/check.mp3'),
  fold: new Audio('/sounds/fold.mp3'),
  call: new Audio('/sounds/call.mp3'),
  raise: new Audio('/sounds/raise.mp3'),
  allIn: new Audio('/sounds/all-in.mp3'),
};

// Preload all sounds to prevent delays
const preloadSounds = () => {
  Object.values(sounds).forEach(sound => {
    sound.load();
  });
};

// Function to play a sound
const playSound = (sound: keyof typeof sounds, volume = 0.5) => {
  try {
    const soundFile = sounds[sound];
    soundFile.currentTime = 0;
    soundFile.volume = volume;
    soundFile.play().catch(err => {
      // Silently catch errors (common in browsers that require user interaction)
      console.log('Sound playback error:', err);
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Mute/unmute all sounds
const setMuted = (muted: boolean) => {
  Object.values(sounds).forEach(sound => {
    sound.muted = muted;
  });
};

export { playSound, preloadSounds, setMuted };
