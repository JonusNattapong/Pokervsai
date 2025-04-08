/**
 * game_utils.js - ไฟล์ utility functions สำหรับเกมทั้งหมด
 * ใช้ร่วมกันระหว่างเกม Poker, Tic Tac Toe, Connect Four, และ Checkers
 */

// ----------------------
// API และการเชื่อมต่อ
// ----------------------

/**
 * ส่ง API request ไปยัง backend
 * @param {string} endpoint - endpoint API (เช่น /api/poker/action)
 * @param {Object} data - ข้อมูลที่จะส่งในรูปแบบ JavaScript object
 * @returns {Promise} - Promise ที่ resolve เป็นข้อมูลจาก API
 */
function makeApiRequest(endpoint, data) {
    // เปิดสถานะการโหลด
    updateLoadingState(true);
    
    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error(`API Request Error: ${error.message}`);
        showErrorMessage(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}`);
        throw error;
    })
    .finally(() => {
        // ปิดสถานะการโหลด
        updateLoadingState(false);
    });
}

/**
 * ดึงข้อมูลประเภทของเกมจาก URL
 * @returns {string} - ชื่อเกม (poker, tictactoe, connect_four, checkers)
 */
function getGameType() {
    const path = window.location.pathname;
    if (path.includes('poker')) return 'poker';
    if (path.includes('checkers')) return 'checkers';
    if (path.includes('connect_four')) return 'connect_four';
    if (path.includes('tictactoe')) return 'tictactoe';
    return 'unknown';
}

/**
 * สร้าง sessionId แบบสุ่มที่มีความปลอดภัย
 * @returns {string} - sessionId ที่มีความปลอดภัย
 */
function generateSessionId() {
    const timestamp = new Date().getTime().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}`;
}

// ----------------------
// การจัดการ UI
// ----------------------

/**
 * แสดงข้อความผิดพลาดในรูปแบบ toast notification
 * @param {string} message - ข้อความที่จะแสดง
 */
function showErrorMessage(message) {
    showMessage(message, 'error');
}

/**
 * แสดงข้อความในรูปแบบ toast notification
 * @param {string} message - ข้อความที่จะแสดง
 * @param {string} type - ประเภทข้อความ (success, error, warning, info)
 */
function showMessage(message, type = 'error') {
    // กำหนด class ตามประเภทข้อความ
    const classMap = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const className = classMap[type] || classMap.info;
    
    // ตรวจสอบว่ามี element แสดงข้อความหรือไม่ ถ้าไม่มีให้สร้างใหม่
    let messageElement = document.getElementById('game-message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'game-message';
        messageElement.className = `${className} text-white p-3 rounded-lg fixed top-4 right-4 z-50 shadow-lg`;
        document.body.appendChild(messageElement);
    } else {
        // อัปเดต class ตามประเภทข้อความ
        Object.values(classMap).forEach(cls => messageElement.classList.remove(cls));
        messageElement.classList.add(className);
    }
    
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    
    // ซ่อนอัตโนมัติหลังจาก 5 วินาที
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

/**
 * แสดง/ซ่อนสถานะการโหลด
 * @param {boolean} isLoading - true เพื่อแสดง, false เพื่อซ่อน
 */
function updateLoadingState(isLoading) {
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

// ----------------------
// การจัดการ LocalStorage
// ----------------------

/**
 * บันทึกข้อมูลลงใน localStorage
 * @param {string} key - คีย์สำหรับเก็บข้อมูล
 * @param {any} value - ค่าที่จะบันทึก
 * @returns {boolean} - true ถ้าสำเร็จ, false ถ้าไม่สำเร็จ
 */
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`Error saving to localStorage: ${key}`, error);
        return false;
    }
}

/**
 * โหลดข้อมูลจาก localStorage
 * @param {string} key - คีย์ที่ใช้เก็บข้อมูล
 * @param {any} defaultValue - ค่าเริ่มต้นถ้าไม่พบข้อมูล
 * @returns {any} - ข้อมูลที่โหลด หรือ defaultValue ถ้าไม่พบ
 */
function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.warn(`Error loading from localStorage: ${key}`, error);
        return defaultValue;
    }
}

// ----------------------
// เสียงและแอนิเมชัน
// ----------------------

/**
 * เล่นเสียงตามที่กำหนด
 * @param {string} soundName - ชื่อเสียง
 * @param {Object} soundPaths - object ที่มี key เป็นชื่อเสียง และ value เป็น path ไปยังไฟล์เสียง
 */
function playSound(soundName, soundPaths) {
    // ตรวจสอบการตั้งค่าเสียงตามประเภทเกม
    const gameType = getGameType();
    const soundEnabled = loadFromLocalStorage(`${gameType}SoundEnabled`, true);
    
    if (!soundEnabled) return;
    
    try {
        if (soundPaths[soundName]) {
            const audio = new Audio(soundPaths[soundName]);
            audio.play().catch(err => console.warn('Sound play error:', err));
        }
    } catch (error) {
        console.warn(`Error playing sound ${soundName}:`, error);
    }
}

/**
 * หน่วงเวลาตามที่กำหนด โดยคำนึงถึงการตั้งค่าแอนิเมชัน
 * @param {number} ms - เวลาที่จะหน่วงในหน่วยมิลลิวินาที
 * @returns {Promise} - Promise ที่จะ resolve หลังจากเวลาที่กำหนด
 */
function delay(ms) {
    const gameType = getGameType();
    const animationsEnabled = loadFromLocalStorage(`${gameType}AnimationsEnabled`, true);
    
    return animationsEnabled ? 
        new Promise(resolve => setTimeout(resolve, ms)) : 
        Promise.resolve();
}

// ----------------------
// Analytics และ Logging
// ----------------------

/**
 * บันทึกกิจกรรมของผู้ใช้
 * @param {string} action - ชื่อการกระทำ
 * @param {Object} data - ข้อมูลเพิ่มเติมเกี่ยวกับการกระทำ
 */
function logUserAction(action, data = {}) {
    const gameType = getGameType();
    
    // เพิ่ม timestamp และ session data
    const logData = {
        timestamp: new Date().toISOString(),
        sessionId: window.gameState ? window.gameState.sessionId : 'unknown',
        gameType: gameType,
        aiMode: window.gameState ? window.gameState.aiMode : 0,
        action: action,
        ...data
    };
    
    // บันทึกลงใน localStorage
    try {
        const logKey = `${gameType}ActionLogs`;
        const logs = loadFromLocalStorage(logKey, []);
        logs.push(logData);
        saveToLocalStorage(logKey, logs.slice(-100)); // เก็บแค่ 100 รายการล่าสุด
        
        // ส่งไปยัง server ถ้าต้องการ (ไม่ block UI)
        fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        }).catch(e => console.warn('Failed to send log:', e));
    } catch (error) {
        console.warn('Error logging user action:', error);
    }
}

// ----------------------
// การจัดการ Theme
// ----------------------

/**
 * ใช้ theme ตามที่กำหนด
 * @param {string} themeName - ชื่อ theme (classic, dark, light, neon)
 */
function applyGameTheme(themeName) {
    // ลบ theme class ปัจจุบัน
    document.body.classList.remove('theme-classic', 'theme-dark', 'theme-light', 'theme-neon');
    
    // เพิ่ม theme ใหม่
    document.body.classList.add(`theme-${themeName}`);
    
    // บันทึกลง localStorage
    saveToLocalStorage('gameTheme', themeName);
}

/**
 * โหลด theme จาก localStorage และใช้
 */
function loadThemePreference() {
    const savedTheme = loadFromLocalStorage('gameTheme', 'classic');
    applyGameTheme(savedTheme);
}

// ----------------------
// การจัดการเกม
// ----------------------

/**
 * บันทึกสถานะเกมปัจจุบัน
 * @param {Object} gameState - สถานะเกมที่จะบันทึก
 */
function saveGameState(gameState) {
    const gameType = getGameType();
    
    const savedState = {
        board: gameState.board,
        playerTurn: gameState.playerTurn,
        // ข้อมูลเฉพาะของเกม (จะแตกต่างกันไปตามแต่ละเกม)
        ...gameState.saveData,
        timestamp: new Date().toISOString(),
        gameType: gameType
    };
    
    saveToLocalStorage(`${gameType}_saved_game`, savedState);
    showMessage('บันทึกเกมเรียบร้อยแล้ว', 'success');
}

/**
 * โหลดเกมที่บันทึกไว้
 * @returns {Object|null} - สถานะเกมที่บันทึกไว้ หรือ null ถ้าไม่พบ
 */
function loadSavedGame() {
    const gameType = getGameType();
    const savedGame = loadFromLocalStorage(`${gameType}_saved_game`, null);
    
    if (savedGame) {
        showMessage('โหลดเกมเรียบร้อยแล้ว', 'success');
        return savedGame;
    } else {
        showMessage('ไม่พบเกมที่บันทึกไว้', 'warning');
        return null;
    }
}

// ----------------------
// Tutorial และ Help
// ----------------------

/**
 * แสดง tutorial สำหรับเกมปัจจุบัน
 */
function showGameTutorial() {
    const gameType = getGameType();
    
    // สร้าง element สำหรับ tutorial
    const tutorialElement = document.createElement('div');
    tutorialElement.id = 'game-tutorial';
    tutorialElement.className = 'fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    
    // โหลดข้อมูล tutorial ตามประเภทเกม
    fetch(`/static/tutorials/${gameType}.json`)
        .then(response => response.json())
        .then(tutorial => {
            // สร้าง UI สำหรับ tutorial
            tutorialElement.innerHTML = `
                <div class="bg-dark-secondary p-6 rounded-lg shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
                    <h2 class="text-2xl font-bold mb-4 text-white">${tutorial.title}</h2>
                    <div class="mb-6 text-white">
                        ${tutorial.description}
                    </div>
                    <div class="space-y-4">
                        ${tutorial.steps.map((step, index) => `
                            <div class="step">
                                <h3 class="text-lg font-bold text-primary">${index + 1}. ${step.title}</h3>
                                <p class="text-gray-300">${step.content}</p>
                                ${step.image ? `<img src="${step.image}" alt="${step.title}" class="mt-2 rounded-lg">` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-6 flex justify-end">
                        <button id="close-tutorial" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                            เข้าใจแล้ว
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(tutorialElement);
            
            // เพิ่ม event listener สำหรับปุ่มปิด
            document.getElementById('close-tutorial').addEventListener('click', () => {
                tutorialElement.remove();
            });
        })
        .catch(error => {
            console.error('Error loading tutorial:', error);
            showErrorMessage('ไม่สามารถโหลดคำแนะนำได้');
        });
}
