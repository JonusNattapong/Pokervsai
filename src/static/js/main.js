/**
 * Main JavaScript utilities for all games
 * Provides common functions used across different games
 */

// Utility function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Utility function to calculate percentage
function calculatePercentage(part, total) {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
}

// Play a sound effect
function playSound(src) {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    
    if (!soundEnabled) return;
    
    const sound = new Audio(src);
    sound.volume = 0.5;
    sound.play().catch(err => {
        console.warn('Error playing sound:', err);
    });
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('game-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'game-notification';
        notification.className = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
        document.body.appendChild(notification);
    }
    
    // Set notification type
    notification.className = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300';
    
    if (type === 'error') {
        notification.className += ' bg-red-500 text-white';
    } else if (type === 'success') {
        notification.className += ' bg-green-500 text-white';
    } else {
        notification.className += ' bg-blue-500 text-white';
    }
    
    // Set message
    notification.textContent = message;
    
    // Show notification
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 10);
    
    // Hide after duration
    setTimeout(() => {
        notification.classList.add('translate-x-full');
    }, duration);
}

// Export utilities if module exports is supported
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatNumber,
        calculatePercentage,
        playSound,
        showNotification
    };
}
