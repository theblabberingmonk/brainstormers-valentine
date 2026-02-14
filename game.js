// Game State
const gameState = {
    screen: 'intro',
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
    animationFrameId: null,
    lieDetectorAttempts: 0,
    maxLieDetectorAttempts: 3
};

// DOM Elements
const screens = {
    intro: document.getElementById('intro-screen'),
    authOverview: document.getElementById('auth-overview-screen'),
    lieDetector: document.getElementById('lie-detector-screen'),
    skillsIntro: document.getElementById('skills-intro-screen'),
    game: document.getElementById('game-screen'),
    success: document.getElementById('success-screen'),
    mystery: document.getElementById('mystery-screen'),
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
        if (screen) {
            screen.classList.remove('active');
            screen.style.display = 'none';
        }
    });
    
    const targetScreen = screens[screenName];
    if (targetScreen) {
        targetScreen.style.display = 'block';
        setTimeout(() => targetScreen.classList.add('active'), 10);
    }
    
    gameState.screen = screenName;
}

// Typing Effect
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

// Intro Screen Logic
document.addEventListener('DOMContentLoaded', () => {
    const introMessage = document.getElementById('intro-message');
    const message = "This is a super encrypted mystery message for one doc.";
    typeText(introMessage, message, 40);
});

// Yes Button
document.getElementById('yes-btn').addEventListener('click', () => {
    showScreen('authOverview');
});

// Start Authentication
document.getElementById('start-auth-btn').addEventListener('click', () => {
    showScreen('lieDetector');
});

// Lie Detector Logic
const optionButtons = document.querySelectorAll('.option-btn');
const feedbackElement = document.getElementById('detector-feedback');

optionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const answer = e.target.dataset.answer;
        
        if (answer === 'C') {
            // Correct answer
            e.target.classList.add('correct');
            feedbackElement.textContent = 'IDENTITY VERIFIED - MEMORY AUTHENTICATION PASSED';
            feedbackElement.classList.add('success');
            
            // Disable all buttons
            optionButtons.forEach(button => {
                button.disabled = true;
                if (button !== e.target) {
                    button.style.opacity = '0.3';
                }
            });
            
            // Show success animation
            setTimeout(() => {
                showScreen('skillsIntro');
                gameState.lieDetectorAttempts = 0;
                resetLieDetector();
            }, 2000);
        } else {
            // Wrong answer
            gameState.lieDetectorAttempts++;
            e.target.classList.add('incorrect');
            feedbackElement.textContent = `LIE DETECTED - INCORRECT ANSWER. ATTEMPTS REMAINING: ${gameState.maxLieDetectorAttempts - gameState.lieDetectorAttempts}`;
            feedbackElement.classList.add('error');
            
            // Remove incorrect class after animation
            setTimeout(() => {
                e.target.classList.remove('incorrect');
            }, 500);
            
            if (gameState.lieDetectorAttempts >= gameState.maxLieDetectorAttempts) {
                feedbackElement.textContent = 'TOO MANY FAILED ATTEMPTS. AUTHENTICATION FAILED.';
                setTimeout(() => {
                    alert('Authentication failed. Please try again later.');
                    location.reload();
                }, 2000);
            }
        }
    });
});

function resetLieDetector() {
    optionButtons.forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    feedbackElement.textContent = '';
    feedbackElement.classList.remove('success', 'error');
}

// Start Game Button
document.getElementById('start-game-btn').addEventListener('click', () => {
    startGame();
});

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
    const healthValue = document.getElementById('health-value');
    const distanceValue = document.getElementById('distance-value');
    const scoreValue = document.getElementById('score-value');
    
    healthFill.style.width = `${gameState.health}%`;
    healthValue.textContent = `${Math.round(gameState.health)}%`;
    distanceValue.textContent = `${Math.round(gameState.distance)}`;
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
    
    // Dark road
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(200, 0, 400, 600);
    
    // Road edges
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(190, 0, 10, 600);
    ctx.fillRect(600, 0, 10, 600);
    
    // Dashed center line
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = -roadOffset;
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Side areas
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, 200, 600);
    ctx.fillRect(600, 0, 200, 600);
    
    // Hospital text
    ctx.fillStyle = '#CC0000';
    ctx.font = 'bold 16px Orbitron';
    ctx.fillText('HOSPITAL', 630, 50);
    
    ctx.font = '14px Orbitron';
    ctx.fillStyle = '#888888';
    ctx.fillText(`${Math.round(gameState.maxDistance - gameState.distance)}m TO GO`, 630, 80);
}

function drawAmbulance() {
    const x = gameState.carX;
    const y = 480;
    
    ctx.save();
    
    // Ambulance body
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(x, y, 60, 90);
    
    // Cross on ambulance
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 22, 505, 16, 50);
    ctx.fillRect(x + 5, 525, 50, 12);
    
    // Windows
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x + 10, y + 75, 40, 8);
    
    // Siren lights
    const sirenColor = Math.floor(Date.now() / 150) % 2 === 0 ? '#FF0000' : '#0000FF';
    ctx.fillStyle = sirenColor;
    ctx.fillRect(x + 10, y - 5, 15, 10);
    ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#0000FF' : '#FF0000';
    ctx.fillRect(x + 35, y - 5, 15, 10);
    
    // Siren glow
    if (Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = 'rgba(204, 0, 0, 0.3)';
        ctx.fillRect(x - 15, y - 10, 90, 110);
    }
    
    // Speed boost effect
    if (gameState.speedBoost) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
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
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(obs.x + 25, obs.y + 25, 25, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#555555';
            ctx.beginPath();
            ctx.arc(obs.x + 20, obs.y + 20, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'pothole') {
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.ellipse(obs.x + 25, obs.y + 20, 30, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#0A0A0A';
            ctx.beginPath();
            ctx.ellipse(obs.x + 25, obs.y + 20, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'traffic') {
            ctx.fillStyle = '#1A1A1A';
            ctx.fillRect(obs.x, obs.y, 45, 75);
            
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(obs.x + 5, obs.y + 12, 35, 22);
            ctx.fillRect(obs.x + 5, obs.y + 42, 35, 18);
            
            ctx.fillStyle = '#CC0000';
            ctx.fillRect(obs.x + 5, obs.y + 5, 10, 8);
            ctx.fillStyle = '#FFCC00';
            ctx.fillRect(obs.x + 18, obs.y + 5, 10, 8);
            
            // Wheels
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.arc(obs.x + 10, obs.y + 75, 8, 0, Math.PI * 2);
            ctx.arc(obs.x + 35, obs.y + 75, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#0A0A0A';
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
            // Draw speed icon (lightning bolt)
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(0, 15);
            ctx.lineTo(-10, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Orbitron';
            ctx.fillText('SPEED', -20, 28);
        } else if (pu.type === 'health') {
            // Draw health icon (cross)
            ctx.fillStyle = '#CC0000';
            ctx.fillRect(-8, -3, 16, 6);
            ctx.fillRect(-3, -8, 6, 16);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Orbitron';
            ctx.fillText('HEALTH', -24, 28);
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
            
            createParticles(gameState.carX + 30, 500, '#CC0000', 15);
            
            ctx.fillStyle = 'rgba(204, 0, 0, 0.3)';
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
            createParticles(pu.x + 20, pu.y + 20, pu.type === 'speed' ? '#00FF00' : '#CC0000', 10);
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
        showScreen('success');
        createConfetti();
    } else {
        document.getElementById('gameover-score').textContent = gameState.score;
        document.getElementById('gameover-distance').textContent = Math.round(gameState.distance);
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
    const colors = ['#CC0000', '#00FF00', '#FFCC00', '#FF00FF', '#00FFFF', '#FFFFFF'];
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

// Reveal mystery message button
document.getElementById('reveal-btn').addEventListener('click', () => {
    showScreen('mystery');
});

// Retry buttons
document.getElementById('retry-btn').addEventListener('click', () => {
    resetLieDetector();
    gameState.lieDetectorAttempts = 0;
    startGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    resetLieDetector();
    gameState.lieDetectorAttempts = 0;
    showScreen('intro');
    const introMessage = document.getElementById('intro-message');
    const message = "This is a super encrypted mystery message for one doc.";
    typeText(introMessage, message, 40);
});

console.log('CLASSIFIED MISSION INITIATED');
console.log('AUTHENTICATION REQUIRED');
