const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// Elements
const scoreEl = document.querySelector('#scoreEl');
const startScreen = document.querySelector('#startScreen');
const gameOverScreen = document.querySelector('#gameOverScreen');
const finalScoreEl = document.querySelector('#finalScore');
const startBtn = document.querySelector('#startGameBtn');
const restartBtn = document.querySelector('#restartBtn');

// Setup Canvas size
canvas.width = innerWidth;
canvas.height = innerHeight;

// Variables
let animationId;
let score = 0;
let frames = 0;
let gameActive = false;

// Input State
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
    Space: false
};

// Classes
class Player {
    constructor() {
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;
        this.opacity = 1;

        const image = new Image();
        // Fallback drawing if image fails (using shapes), but we'll draw shapes directly for standalone capability
        this.width = 30;
        this.height = 30;
        
        this.position = {
            x: canvas.width / 2,
            y: canvas.height - 100
        };
    }

    draw() {
        c.save();
        c.globalAlpha = this.opacity;
        c.translate(this.position.x, this.position.y);
        c.rotate(this.rotation);

        // Draw Spaceship (Triangle)
        c.beginPath();
        c.moveTo(0, -this.height / 2); // Top tip
        c.lineTo(this.width / 2, this.height / 2); // Bottom right
        c.lineTo(-this.width / 2, this.height / 2); // Bottom left
        c.closePath();
        c.fillStyle = '#4facfe';
        c.fill();
        
        // Engine flame
        if (keys.ArrowUp || keys.w) {
            c.beginPath();
            c.moveTo(-5, this.height / 2);
            c.lineTo(5, this.height / 2);
            c.lineTo(0, this.height / 2 + (Math.random() * 10 + 5));
            c.fillStyle = 'orange';
            c.fill();
        }

        c.restore();
    }

    update() {
        if (!this.opacity) return;
        this.draw();

        // Movement Logic
        const speed = 7;
        if ((keys.a || keys.ArrowLeft) && this.position.x >= this.width) {
            this.velocity.x = -speed;
            this.rotation = -0.15;
        } else if ((keys.d || keys.ArrowRight) && this.position.x <= canvas.width - this.width) {
            this.velocity.x = speed;
            this.rotation = 0.15;
        } else {
            this.velocity.x = 0;
            this.rotation = 0;
        }

        if ((keys.w || keys.ArrowUp) && this.position.y >= this.height) {
            this.velocity.y = -speed;
        } else if ((keys.s || keys.ArrowDown) && this.position.y <= canvas.height - this.height) {
            this.velocity.y = speed;
        } else {
            this.velocity.y = 0;
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Projectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 4;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = '#ff4d4d'; // Red laser
        c.fill();
        c.closePath();
        
        // Glow effect
        c.shadowBlur = 10;
        c.shadowColor = '#ff4d4d';
        c.fill();
        c.shadowBlur = 0; // Reset
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Enemy {
    constructor() {
        this.velocity = { x: 0, y: 3 + Math.random() * 2 }; // Random speed
        this.radius = 15 + Math.random() * 15; // Random size
        
        this.position = {
            x: Math.random() * (canvas.width - this.radius * 2) + this.radius,
            y: -this.radius // Start above screen
        };
        
        // Random color
        const hue = Math.random() * 360;
        this.color = `hsl(${hue}, 50%, 50%)`;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
    }

    update() {
        this.draw();
        this.position.y += this.velocity.y;
    }
}

class Particle {
    constructor({ position, velocity, radius, color, fades }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.opacity = 1;
        this.fades = fades;
    }

    draw() {
        c.save();
        c.globalAlpha = this.opacity;
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= 0.95; // Friction
        this.velocity.y *= 0.95;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.fades) this.opacity -= 0.01;
    }
}

class Star {
    constructor() {
        this.position = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        };
        this.velocity = {
            x: 0,
            y: Math.random() * 0.5 + 0.1 // Slow background movement
        };
        this.radius = Math.random() * 2;
        this.opacity = Math.random();
    }
    
    draw() {
        c.save();
        c.globalAlpha = this.opacity;
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'white';
        c.fill();
        c.restore();
    }
    
    update() {
        this.draw();
        this.position.y += this.velocity.y;
        if (this.position.y > canvas.height) {
            this.position.y = 0;
            this.position.x = Math.random() * canvas.width;
        }
    }
}

// Arrays to manage game objects
let player = new Player();
let projectiles = [];
let enemies = [];
let particles = [];
let stars = [];

// Initialize Background Stars
for (let i = 0; i < 100; i++) {
    stars.push(new Star());
}

function init() {
    player = new Player();
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    frames = 0;
    scoreEl.innerHTML = score;
    gameActive = true;
}

function spawnEnemies() {
    if (frames % 100 === 0) { // Spawn every 100 frames
        enemies.push(new Enemy());
    }
}

function createExplosion({ position, color, radius }) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle({
            position: { x: position.x, y: position.y },
            velocity: {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4
            },
            radius: Math.random() * 3,
            color: color || 'white',
            fades: true
        }));
    }
}

function animate() {
    if (!gameActive) return;
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(15, 15, 26, 0.4)'; // Trail effect
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Background Stars
    stars.forEach(star => star.update());

    player.update();
    
    // Projectiles
    particles.forEach((particle, index) => {
        if (particle.opacity <= 0) {
            setTimeout(() => {
                particles.splice(index, 1);
            }, 0);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();

        // Remove from edges
        if (
            projectile.position.x + projectile.radius < 0 ||
            projectile.position.x - projectile.radius > canvas.width ||
            projectile.position.y + projectile.radius < 0 ||
            projectile.position.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    enemies.forEach((enemy, index) => {
        enemy.update();

        // End Game: Enemy hits player
        const dist = Math.hypot(player.position.x - enemy.position.x, player.position.y - enemy.position.y);
        // Approximate hitbox
        if (dist - enemy.radius - player.width / 2 < 1) {
            cancelAnimationFrame(animationId);
            gameActive = false;
            finalScoreEl.innerHTML = score;
            gameOverScreen.classList.remove('hidden');
        }

        // Projectile hits Enemy
        projectiles.forEach((projectile, pIndex) => {
            const dist = Math.hypot(projectile.position.x - enemy.position.x, projectile.position.y - enemy.position.y);
            
            // Detection
            if (dist - enemy.radius - projectile.radius < 1) {
                // Create Explosion
                createExplosion({
                    position: enemy.position,
                    color: enemy.color,
                    radius: enemy.radius
                });

                // Increase Score
                score += 100;
                scoreEl.innerHTML = score;

                // Remove both
                setTimeout(() => {
                    enemies.splice(index, 1);
                    projectiles.splice(pIndex, 1);
                }, 0);
            }
        });
        
        // Remove enemy passed screen
        if(enemy.position.y > canvas.height + 50) {
             setTimeout(() => {
                enemies.splice(index, 1);
             }, 0);
        }
    });

    spawnEnemies();
    frames++;
}

// Event Listeners
window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
            keys.w = true;
            keys.ArrowUp = true;
            break;
        case 'ArrowDown':
        case 's':
            keys.s = true;
            keys.ArrowDown = true;
            break;
        case 'ArrowLeft':
        case 'a':
            keys.a = true;
            keys.ArrowLeft = true;
            break;
        case 'ArrowRight':
        case 'd':
            keys.d = true;
            keys.ArrowRight = true;
            break;
        case ' ':
            if (gameActive) {
                projectiles.push(new Projectile({
                    position: {
                        x: player.position.x,
                        y: player.position.y - 15
                    },
                    velocity: { x: 0, y: -10 }
                }));
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
            keys.w = false;
            keys.ArrowUp = false;
            break;
        case 'ArrowDown':
        case 's':
            keys.s = false;
            keys.ArrowDown = false;
            break;
        case 'ArrowLeft':
        case 'a':
            keys.a = false;
            keys.ArrowLeft = false;
            break;
        case 'ArrowRight':
        case 'd':
            keys.d = false;
            keys.ArrowRight = false;
            break;
    }
});

// Click to shoot support
window.addEventListener('click', (e) => {
    // Avoid shooting when clicking UI buttons
    if (e.target.tagName !== 'BUTTON' && gameActive) {
         projectiles.push(new Projectile({
            position: {
                x: player.position.x,
                y: player.position.y - 15
            },
            velocity: { x: 0, y: -10 }
        }));
    }
});

startBtn.addEventListener('click', () => {
    init();
    animate();
    startScreen.classList.add('hidden');
});

restartBtn.addEventListener('click', () => {
    init();
    animate();
    gameOverScreen.classList.add('hidden');
});

// Resize handler
window.addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    // Reset player position if resized out of bounds
    if (player.position.x > canvas.width) player.position.x = canvas.width - 50;
    if (player.position.y > canvas.height) player.position.y = canvas.height - 50;
});