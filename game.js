/**
 * Dino Runner game
 * - Modular structure: input, update, render
 * - requestAnimationFrame-driven loop
 * - Random obstacle spawning and collision checks
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreLabel = document.getElementById('score');
const highScoreLabel = document.getElementById('high-score');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GROUND_Y = GAME_HEIGHT - 44;
const GRAVITY = 2000;
const JUMP_VELOCITY = -700;
const BASE_SPEED = 360;
const MAX_DELTA = 1 / 30; // cap large frame times for stability

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const input = {
  jumpPressed: false,
};

const gameState = {
  status: 'running', // running | gameover
  elapsed: 0,
  score: 0,
  highScore: Number(localStorage.getItem('dinoHighScore') || 0),
  spawnTimer: 0,
  nextSpawnIn: randomSpawnTime(),
  speed: BASE_SPEED,
};

const player = {
  x: 80,
  y: GROUND_Y - 52,
  width: 44,
  height: 52,
  velocityY: 0,
  onGround: true,
};

const obstacles = [];

highScoreLabel.textContent = `High Score: ${gameState.highScore}`;

// --- Input handling -------------------------------------------------------
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return;

  event.preventDefault();

  // Most browsers require a user gesture before audio playback.
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  if (gameState.status === 'gameover') {
    resetGame();
    return;
  }

  input.jumpPressed = true;
});

// --- Game loop ------------------------------------------------------------
let lastFrameTime = performance.now();
function frame(now) {
  const deltaTime = Math.min((now - lastFrameTime) / 1000, MAX_DELTA);
  lastFrameTime = now;

  update(deltaTime);
  render();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- Update ---------------------------------------------------------------
function update(deltaTime) {
  if (gameState.status !== 'running') return;

  gameState.elapsed += deltaTime;
  gameState.speed = BASE_SPEED + gameState.elapsed * 12; // optional enhancement: increase speed over time
  gameState.score += deltaTime * 10;
  scoreLabel.textContent = `Score: ${Math.floor(gameState.score)}`;

  // Trigger jump only when player is grounded.
  if (input.jumpPressed && player.onGround) {
    player.velocityY = JUMP_VELOCITY;
    player.onGround = false;
    playTone(700, 0.05, 'square');
  }
  input.jumpPressed = false;

  // Player physics.
  player.velocityY += GRAVITY * deltaTime;
  player.y += player.velocityY * deltaTime;

  if (player.y + player.height >= GROUND_Y) {
    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    player.onGround = true;
  }

  // Randomized obstacle spawning.
  gameState.spawnTimer += deltaTime;
  if (gameState.spawnTimer >= gameState.nextSpawnIn) {
    spawnObstacle();
    gameState.spawnTimer = 0;
    gameState.nextSpawnIn = randomSpawnTime();
  }

  // Move and clean up obstacles.
  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.x -= gameState.speed * deltaTime;
    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // Collision check.
  for (const obstacle of obstacles) {
    if (isColliding(player, obstacle)) {
      onGameOver();
      break;
    }
  }
}

function spawnObstacle() {
  const tall = Math.random() > 0.6;
  const width = tall ? 28 : 40;
  const height = tall ? 60 : 38;
  obstacles.push({
    x: GAME_WIDTH + 20,
    y: GROUND_Y - height,
    width,
    height,
  });
}

function randomSpawnTime() {
  return 0.8 + Math.random() * 1.1;
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function onGameOver() {
  gameState.status = 'gameover';
  playTone(140, 0.18, 'sawtooth');

  if (gameState.score > gameState.highScore) {
    gameState.highScore = Math.floor(gameState.score);
    localStorage.setItem('dinoHighScore', String(gameState.highScore));
    highScoreLabel.textContent = `High Score: ${gameState.highScore}`;
  }
}

function resetGame() {
  gameState.status = 'running';
  gameState.elapsed = 0;
  gameState.score = 0;
  gameState.spawnTimer = 0;
  gameState.nextSpawnIn = randomSpawnTime();
  gameState.speed = BASE_SPEED;

  player.y = GROUND_Y - player.height;
  player.velocityY = 0;
  player.onGround = true;

  obstacles.length = 0;
  scoreLabel.textContent = 'Score: 0';
}

// --- Render ---------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#e4f5ff');
  gradient.addColorStop(1, '#ffffff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Ground line
  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 3);

  // Draw player (simple stylized dino block)
  ctx.fillStyle = '#202020';
  roundRect(ctx, player.x, player.y, player.width, player.height, 6);
  ctx.fillRect(player.x + 30, player.y + 6, 9, 9); // head bump
  ctx.fillStyle = '#fff';
  ctx.fillRect(player.x + 30, player.y + 14, 4, 4); // eye

  // Draw obstacles
  ctx.fillStyle = '#267326';
  for (const obstacle of obstacles) {
    roundRect(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 4);
  }

  if (gameState.status === 'gameover') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 46px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);

    ctx.font = '24px system-ui';
    ctx.fillText('Press SPACE to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 32);
  }
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  context.fill();
}

function playTone(frequency, duration, type = 'square') {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + duration,
  );

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}
