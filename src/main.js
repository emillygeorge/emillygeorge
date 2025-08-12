import { Game } from './game.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';

const canvas = document.getElementById('game-canvas');
const scoreEl = document.getElementById('score');
const hudEl = document.getElementById('hud');
const restartBtn = document.getElementById('restart');

const audio = new AudioManager();
const input = new InputManager(canvas);
const game = new Game(canvas, { scoreEl, hudEl, restartBtn });

let lastTime = performance.now();
let running = true;

function onResize() {
  game.resize();
}

window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

function startIfNeeded() {
  if (game.state === 'ready') {
    hudEl.style.display = 'none';
    restartBtn.classList.add('hidden');
    game.start();
  }
}

// First user gesture unlocks audio
function unlockAudioIfNeeded() {
  if (!audio.audioContext) audio.ensureContext();
  audio.resume();
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    unlockAudioIfNeeded();
    startIfNeeded();
  }
});

canvas.addEventListener('pointerdown', () => {
  unlockAudioIfNeeded();
  startIfNeeded();
});

restartBtn.addEventListener('click', () => {
  game.reset();
  game.state = 'running';
  restartBtn.classList.add('hidden');
  hudEl.style.display = 'none';
});

function loop(now) {
  if (!running) return;
  const dt = Math.min(1 / 30, (now - lastTime) / 1000);
  lastTime = now;

  game.update(dt, input, audio);
  game.draw();

  // Update UI score and buttons
  scoreEl.textContent = `${game.score}`;
  if (game.state === 'gameover') {
    restartBtn.classList.remove('hidden');
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Initial layout
onResize();