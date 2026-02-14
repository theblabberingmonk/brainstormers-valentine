// Game State
const gameState = {
    screen: 'start',
    cutsceneStep: 0,
    isPlaying: false,
    health: 100,
    distance: 0,
    maxDistance: 1000,
    carX: 375,
    carVelocity: 0,
    obstacles: [],
    powerUps: [],
    particles: [],
    score: 0,
    speed: 5,
    baseSpeed: 5,
    speedBoost: false,
    speedBoostTimer: 0,
    gameLoop: null,
    obstacleTimer: null,
    powerUpTimer: null,
    keys: { left: false, right: false },
    animationFrameId: null
};

// Cutscene dialogues
const cutsceneDialogues = [
    "Just another peaceful drive to the hospital... little did I know what was about to happen.",
    "CRASH! Oh no! A bike came out of nowhere and hit my car. The rider is bleeding badly.",
    "I must act fast! The injured biker needs immediate medical attention. Every second counts."
];

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    cutscene: document.getElementById('cutscene-screen'),
    game: document.getElementById('game-screen'),
    victory: document.getElementById('victory-screen'),
    gameover: document.getElementById('gameover-screen')
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const particleCanvas = document.getElementById('particle-canvas');
const particleCtx = particleCanvas.getContext('2d');

// Resize particle canvas
function resizeParticleCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}
resizeParticleCanvas();
window.addEventListener('resize', resizeParticleCanvas);

// Screen Navigation
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    screens[screenName].style.display = 'block';
    setTimeout(() => screens[screenName].classList.add('active'), 10);
    gameState.screen = screenName;
}

// Typing effect for dialogues
function typeText(element, text, speed = 30, callback) {
    element.textContent = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    type();
}

// Start Button
document.getElementById('start-btn').addEventListener('click', () => {
    showScreen('cutscene');
    startCutscene();
});

// Cutscene Logic
function startCutscene() {
    gameState.cutsceneStep = 0;
    const scenes = document.querySelectorAll('.cutscene-container .scene');
    scenes.forEach(scene => scene.classList.add('hidden'));
    scenes[0].classList.remove('hidden');
    
    updateProgressDots(0);
    
    const dialogueElement = document.getElementById(`dialogue-0`);
    typeText(dialogueElement, cutsceneDialogues[0], 40);
}

function updateProgressDots(currentScene) {
    const dots = document.querySelectorAll('.progress-dots .dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index <= currentScene);
    });
}

document.getElementById('continue-btn').addEventListener('click', () => {
    if (gameState.cutsceneStep < 2) {
        const currentScene = document.getElementById(`scene-${gameState.cutsceneStep}`);
        const nextScene = document.getElementById(`scene-${gameState.cutsceneStep + 1}`);
        
        currentScene.classList.add('hidden');
        nextScene.classList.remove('hidden');
        
        gameState.cutsceneStep++;
        
        updateProgressDots(gameState.cutsceneStep);
        
        const dialogueElement = document.getElementById(`dialogue-${gameState.cutsceneStep}`);
        typeText(dialogueElement, cutsceneDialogues[gameState.cutsceneStep], 40);
        
        if (gameState.cutsceneStep === 1) {
            triggerScreenShake();
        }
        
        if (gameState.cutsceneStep === 2) {
            document.getElementById('continue-btn').textContent = 'Start Emergency Drive';
        }
    } else {
        startGame();
    }
});

function triggerScreenShake() {
    document.body.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);
}

// Game Logic
function startGame() {
    showScreen('game');
    gameState.isPlaying = true;
    gameState.health = 100;
    gameState.distance = 0;
    gameState.carX = 375;
    gameState.carVelocity = 0;
    gameState.obstacles = [];
    gameState.powerUps = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.speed = gameState.baseSpeed;
    gameState.speedBoost = false;
    gameState.speedBoostTimer = 0;
    
    updateUI();
    startGameLoop();
    startObstacleSpawner();
    startPowerUpSpawner();
}

function updateUI() {
    const healthFill = document.getElementById('health-fill');
    const distanceFill = document.getElementById('distance-fill');
    const healthValue = document.getElementById('health-value');
    const distanceValue = document.getElementById('distance-value');
    const scoreValue = document.getElementById('score-value');
    
    healthFill.style.width = `${gameState.health}%`;
    const distancePercent = Math.min((gameState.distance / gameState.maxDistance) * 100, 100);
    distanceFill.style.width = `${distancePercent}%`;
    healthValue.textContent = `${Math.round(gameState.health)}%`;
    distanceValue.textContent = `${Math.round(gameState.distance)}m`;
    scoreValue.textContent = gameState.score;
    
    // Speed boost indicator
    const speedIndicator = document.getElementById('speed-indicator');
    if (gameState.speedBoost) {
        speedIndicator.style.display = 'block';
    } else {
        speedIndicator.style.display = 'none';
    }
}

// Canvas Drawing
function drawRoad() {
    const roadOffset = (Date.now() / 50) % 40;
    
    ctx.fillStyle = '#4A423C';
    ctx.fillRect(200, 0, 400, 600);
    
    ctx.strokeStyle = '#D4C8BE';
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = -roadOffset;
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#8B7F74';
    ctx.fillRect(0, 0, 200, 600);
    ctx.fillRect(600, 0, 200, 600);
    
    ctx.fillStyle = '#F7F2EB';
    ctx.font = 'bold 18px Georgia';
    ctx.fillText('HOSPITAL', 630, 50);
    
    ctx.font = '15px Georgia';
    ctx.fillStyle = '#6B6660';
    ctx.fillText(`${Math.round(gameState.maxDistance - gameState.distance)}m to go`, 630, 80);
}

function drawAmbulance() {
    const x = gameState.carX;
    const y = 480;
    
    ctx.save();
    
    ctx.fillStyle = '#F7F2EB';
    ctx.fillRect(x, y, 60, 90);
    
    ctx.fillStyle = '#C45C26';
    ctx.fillRect(x + 22, 505, 16, 50);
    ctx.fillRect(x + 5, 525, 50, 12);
    
    ctx.fillStyle = '#8F4219';
    ctx.fillRect(x + 10, y + 75, 40, 8);
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(x + 10, y + 83, 40, 8);
    
    const sirenColor = Math.floor(Date.now() / 150) % 2 === 0 ? '#C45C26' : '#2D2A26';
    ctx.fillStyle = sirenColor;
    ctx.fillRect(x + 10, y - 5, 15, 10);
    ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#2D2A26' : '#C45C26';
    ctx.fillRect(x + 35, y - 5, 15, 10);
    
    if (Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = 'rgba(196, 92, 38, 0.2)';
        ctx.fillRect(x - 15, y - 10, 90, 110);
    }
    
    if (gameState.speedBoost) {
        ctx.fillStyle = 'rgba(184, 134, 11, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x - 20, y + 45);
        ctx.lineTo(x - 40, y + 30);
        ctx.lineTo(x - 40, y + 60);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + 80, y + 45);
        ctx.lineTo(x + 100, y + 30);
        ctx.lineTo(x + 100, y + 60);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
}

function drawObstacles() {
    gameState.obstacles.forEach(obs => {
        ctx.save();
        
        if (obs.type === 'rock') {
            ctx.fillStyle = '#6B6660';
            ctx.beginPath();
            ctx.arc(obs.x + 25, obs.y + 25, 25, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#9A958D';
            ctx.beginPath();
            ctx.arc(obs.x + 20, obs.y + 20, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'pothole') {
            ctx.fillStyle = '#3D3A36';
            ctx.beginPath();
            ctx.ellipse(obs.x + 25, obs.y + 20, 30, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2D2A26';
            ctx.beginPath();
            ctx.ellipse(obs.x + 25, obs.y + 20, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'traffic') {
            ctx.fillStyle = '#4A423C';
            ctx.fillRect(obs.x, obs.y, 45, 75);
            
            ctx.fillStyle = '#B8C8D0';
            ctx.fillRect(obs.x + 5, obs.y + 12, 35, 22);
            ctx.fillRect(obs.x + 5, obs.y + 42, 35, 18);
            
            ctx.fillStyle = '#C45C26';
            ctx.fillRect(obs.x + 5, obs.y + 5, 10, 8);
            ctx.fillStyle = '#B8860B';
            ctx.fillRect(obs.x + 18, obs.y + 5, 10, 8);
            
            ctx.fillStyle = '#3D3A36';
            ctx.beginPath();
            ctx.arc(obs.x + 10, obs.y + 75, 8, 0, Math.PI * 2);
            ctx.arc(obs.x + 35, obs.y + 75, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2D2A26';
            ctx.beginPath();
            ctx.arc(obs.x + 10, obs.y + 75, 5, 0, Math.PI * 2);
            ctx.arc(obs.x + 35, obs.y + 75, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    });
}

function drawPowerUps() {
    gameState.powerUps.forEach(pu => {
        ctx.save();
        ctx.translate(pu.x + 20, pu.y + 20);
        ctx.rotate(Date.now() / 500);
        
        if (pu.type === 'speed') {
            ctx.fillStyle = '#B8860B';
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(10, 5);
            ctx.lineTo(0, 0);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#F7F2EB';
            ctx.font = 'bold 14px Georgia';
            ctx.fillText('SPEED', -22, 22);
        } else if (pu.type === 'health') {
            ctx.fillStyle = '#C45C26';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#F7F2EB';
            ctx.fillRect(-4, -8, 8, 16);
            ctx.fillRect(-8, -4, 16, 8);
            
            ctx.fillStyle = '#F7F2EB';
            ctx.font = 'bold 14px Georgia';
            ctx.fillText('HEALTH', -24, 22);
        }
        
        ctx.restore();
    });
}

function createParticles(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            color: color,
            size: Math.random() * 8 + 4,
            life: 1,
            decay: Math.random() * 0.02 + 0.01
        });
    }
}

function drawParticles() {
    gameState.particles.forEach((p, index) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= p.decay;
        
        if (p.life <= 0) {
            gameState.particles.splice(index, 1);
        }
    });
}

function updateGame() {
    if (!gameState.isPlaying) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawRoad();
    
    // Smooth car movement
    if (gameState.keys.left) {
        gameState.carVelocity = -8;
    } else if (gameState.keys.right) {
        gameState.carVelocity = 8;
    } else {
        gameState.carVelocity *= 0.9;
    }
    
    gameState.carX += gameState.carVelocity;
    gameState.carX = Math.max(220, Math.min(540, gameState.carX));
    
    // Update obstacles
    const currentSpeed = gameState.speedBoost ? gameState.speed * 1.5 : gameState.speed;
    gameState.obstacles.forEach(obs => {
        obs.y += currentSpeed;
    });
    
    gameState.obstacles = gameState.obstacles.filter(obs => obs.y < 650);
    
    // Update power-ups
    gameState.powerUps.forEach(pu => {
        pu.y += currentSpeed;
    });
    
    gameState.powerUps = gameState.powerUps.filter(pu => pu.y < 650);
    
    // Check obstacle collisions
    gameState.obstacles.forEach((obs, index) => {
        if (checkCollision(obs)) {
            gameState.health -= 20;
            gameState.obstacles.splice(index, 1);
            
            createParticles(gameState.carX + 30, 500, '#C45C26', 15);
            
            ctx.fillStyle = 'rgba(196, 92, 38, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    });
    
    // Check power-up collisions
    gameState.powerUps.forEach((pu, index) => {
        if (checkPowerUpCollision(pu)) {
            if (pu.type === 'speed') {
                gameState.speedBoost = true;
                gameState.speedBoostTimer = 5000;
                document.getElementById('speed-indicator').style.display = 'block';
            } else if (pu.type === 'health') {
                gameState.health = Math.min(100, gameState.health + 25);
            }
            
            gameState.score += 50;
            createParticles(pu.x + 20, pu.y + 20, pu.type === 'speed' ? '#B8860B' : '#C45C26', 10);
            gameState.powerUps.splice(index, 1);
        }
    });
    
    // Update speed boost
    if (gameState.speedBoost) {
        gameState.speedBoostTimer -= 16;
        if (gameState.speedBoostTimer <= 0) {
            gameState.speedBoost = false;
            document.getElementById('speed-indicator').style.display = 'none';
        }
    }
    
    gameState.distance += currentSpeed / 10;
    gameState.score += 1;
    
    updateUI();
    
    drawObstacles();
    drawPowerUps();
    drawParticles();
    drawAmbulance();
    
    if (gameState.health <= 0) {
        endGame(false);
    } else if (gameState.distance >= gameState.maxDistance) {
        endGame(true);
    }
    
    gameState.animationFrameId = requestAnimationFrame(updateGame);
}

function checkCollision(obs) {
    const carRect = {
        x: gameState.carX,
        y: 480,
        width: 60,
        height: 90
    };
    
    const obsRect = {
        x: obs.x,
        y: obs.y,
        width: obs.type === 'traffic' ? 45 : 50,
        height: obs.type === 'traffic' ? 75 : 50
    };
    
    return carRect.x < obsRect.x + obsRect.width &&
           carRect.x + carRect.width > obsRect.x &&
           carRect.y < obsRect.y + obsRect.height &&
           carRect.y + carRect.height > obsRect.y;
}

function checkPowerUpCollision(pu) {
    const carRect = {
        x: gameState.carX,
        y: 480,
        width: 60,
        height: 90
    };
    
    const puRect = {
        x: pu.x,
        y: pu.y,
        width: 40,
        height: 40
    };
    
    return carRect.x < puRect.x + puRect.width &&
           carRect.x + carRect.width > puRect.x &&
           carRect.y < puRect.y + puRect.height &&
           carRect.y + carRect.height > puRect.y;
}

function startGameLoop() {
    gameState.animationFrameId = requestAnimationFrame(updateGame);
}

function startObstacleSpawner() {
    gameState.obstacleTimer = setInterval(() => {
        if (!gameState.isPlaying) return;
        
        const types = ['rock', 'pothole', 'traffic'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 220 + Math.random() * 320;
        
        gameState.obstacles.push({
            x: x,
            y: -60,
            type: type
        });
    }, 1200);
}

function startPowerUpSpawner() {
    gameState.powerUpTimer = setInterval(() => {
        if (!gameState.isPlaying) return;
        
        const types = ['speed', 'health'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 220 + Math.random() * 320;
        
        gameState.powerUps.push({
            x: x,
            y: -50,
            type: type
        });
    }, 4000);
}

function endGame(won) {
    gameState.isPlaying = false;
    cancelAnimationFrame(gameState.animationFrameId);
    clearInterval(gameState.obstacleTimer);
    clearInterval(gameState.powerUpTimer);
    
    if (won) {
        document.getElementById('final-score').textContent = gameState.score;
        showScreen('victory');
        createConfetti();
    } else {
        document.getElementById('gameover-score').textContent = gameState.score;
        showScreen('gameover');
    }
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameState.isPlaying) return;
    
    if (e.key === 'ArrowLeft') {
        gameState.keys.left = true;
    } else if (e.key === 'ArrowRight') {
        gameState.keys.right = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') {
        gameState.keys.left = false;
    } else if (e.key === 'ArrowRight') {
        gameState.keys.right = false;
    }
});

// Touch controls for mobile
let touchStartX = 0;

document.addEventListener('touchstart', (e) => {
    if (!gameState.isPlaying) return;
    touchStartX = e.touches[0].clientX;
});

document.addEventListener('touchmove', (e) => {
    if (!gameState.isPlaying) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchX - touchStartX;
    
    if (Math.abs(diff) > 20) {
        if (diff > 0) {
            gameState.keys.right = true;
            gameState.keys.left = false;
        } else {
            gameState.keys.left = true;
            gameState.keys.right = false;
        }
        touchStartX = touchX;
    }
});

document.addEventListener('touchend', () => {
    gameState.keys.left = false;
    gameState.keys.right = false;
});

// Confetti for victory
function createConfetti() {
    const colors = ['#C45C26', '#B8860B', '#8F4219', '#D4A056', '#9A7209', '#2D2A26'];
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-20px';
        confetti.style.width = '15px';
        confetti.style.height = '15px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.animation = `confetti ${3 + Math.random() * 4}s linear forwards`;
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.zIndex = '1000';
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 8000);
    }
}

// Replay buttons
document.getElementById('replay-btn').addEventListener('click', () => {
    showScreen('start');
});

document.getElementById('retry-btn').addEventListener('click', () => {
    startGame();
});

// Progress dots click handlers
document.querySelectorAll('.progress-dots .dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
        const targetScene = parseInt(e.target.dataset.scene);
        if (targetScene < gameState.cutsceneStep) {
            gameState.cutsceneStep = targetScene;
            const scenes = document.querySelectorAll('.cutscene-container .scene');
            scenes.forEach((scene, index) => {
                if (index === targetScene) {
                    scene.classList.remove('hidden');
                    typeText(document.getElementById(`dialogue-${targetScene}`), cutsceneDialogues[targetScene], 40);
                } else {
                    scene.classList.add('hidden');
                }
            });
            updateProgressDots(targetScene);
        }
    });
});

console.log('The Overthinking Saviour - Game Loaded');
console.log('Happy Valentine\'s Day');
