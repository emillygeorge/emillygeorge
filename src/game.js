import { Dino, Obstacle, aabbIntersects } from './entities.js';
import { clamp, randRange } from './utils.js';

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // World units: maintain width constant; height adapts to aspect
    this.worldWidth = 120; // units
    this.worldHeight = 67.5; // will be updated on resize
    this.scale = 1; // pixels per world unit

    // Ground position in world units (y = 0 is ground)
    this.groundY = 8; // ground thickness; ground line at y=0, dino y measures from ground

    // Entities
    this.dino = new Dino();
    this.obstacles = [];

    // Gameplay
    this.state = 'ready'; // 'ready' | 'running' | 'gameover'
    this.score = 0;
    this.speed = 26; // base horizontal speed (world units/sec)
    this.difficultyTimer = 0;

    // Spawning
    this.spawnTimer = 0;
    this.minSpawnInterval = 0.8;
    this.maxSpawnInterval = 1.8;
    this.nextSpawnIn = randRange(this.minSpawnInterval, this.maxSpawnInterval);

    // UI references
    this.ui = ui;

    // Colors for drawing
    this.colors = {
      skyTop: '#b8f1ff',
      skyBottom: '#e8fff5',
      ground: '#ffe26e',
      groundShadow: '#ffd24e',
      dino: '#37d67a',
      dinoDark: '#25a85a',
      cactus: '#ff6f91',
      cactusAccent: '#ff8faf',
      text: '#0f172a'
    };

    this.resize();
    this.reset();
  }

  resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = this.canvas.clientWidth || window.innerWidth;
    const cssHeight = this.canvas.clientHeight || window.innerHeight;

    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);

    // Maintain constant world width, compute height from aspect
    this.scale = this.canvas.width / this.worldWidth;
    this.worldHeight = this.canvas.height / this.scale;
  }

  reset() {
    this.obstacles.length = 0;
    this.score = 0;
    this.speed = 26;
    this.difficultyTimer = 0;
    this.spawnTimer = 0;
    this.nextSpawnIn = randRange(this.minSpawnInterval, this.maxSpawnInterval);

    // Place dino on ground
    this.dino.reset(this.groundY);
  }

  start() {
    if (this.state !== 'running') {
      this.reset();
      this.state = 'running';
    }
  }

  gameOver() {
    this.state = 'gameover';
  }

  update(dt, input, audio) {
    if (this.state !== 'running') return;

    // Difficulty ramps slowly over time
    this.difficultyTimer += dt;
    const difficultyFactor = Math.min(1.8, 1 + this.difficultyTimer * 0.04);

    // Update player
    const jumpPressed = input.consumeJumpPressed();
    const jumpHeld = input.isJumpHeld();
    const oldY = this.dino.y;
    this.dino.update(dt, this.groundY, jumpPressed, jumpHeld);
    if (jumpPressed && oldY === this.groundY) {
      audio?.playJump?.();
    }

    // Move obstacles and spawn new ones
    this.speed = 26 * difficultyFactor;

    for (const obs of this.obstacles) {
      obs.update(dt, this.speed);
      // Count score when passed
      if (!obs.passed && obs.x + obs.width < this.dino.x) {
        obs.passed = true;
        this.score += 1;
        if (this.score % 5 === 0) audio?.playScore?.();
      }
    }
    this.obstacles = this.obstacles.filter((o) => !o.isOffscreen());

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.nextSpawnIn) {
      this.spawnTimer = 0;
      this.nextSpawnIn = randRange(this.minSpawnInterval / difficultyFactor, this.maxSpawnInterval / Math.sqrt(difficultyFactor));
      this.obstacles.push(new Obstacle(this.worldWidth, this.groundY, this.speed));
    }

    // Collisions
    const playerBox = this.dino.getAabb();
    for (const obs of this.obstacles) {
      const box = obs.getAabb();
      if (aabbIntersects(playerBox, box)) {
        audio?.playHit?.();
        this.gameOver();
        break;
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const scale = this.scale;

    // Sky background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, this.colors.skyTop);
    grad.addColorStop(1, this.colors.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Ground band
    const groundPxH = Math.max(16, Math.floor(8 * scale));
    const groundYpx = height - groundPxH;

    ctx.fillStyle = this.colors.ground;
    ctx.fillRect(0, groundYpx, width, groundPxH);

    // Ground shading
    ctx.fillStyle = this.colors.groundShadow;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, groundYpx, width, Math.max(4, groundPxH * 0.25));
    ctx.globalAlpha = 1;

    // Decorative parallax dots
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) {
      const x = (i * 217 + (performance.now() * 0.02)) % width;
      const y = 20 + (i * 53) % (groundYpx - 40);
      ctx.fillRect(x, y, 6, 6);
    }
    ctx.globalAlpha = 1;

    // World ground Y in pixels from bottom
    const groundWorldYpx = groundYpx; // since dino y uses ground as 0 base, we align bottom

    // Draw obstacles and dino
    for (const obs of this.obstacles) {
      obs.draw(ctx, scale, groundWorldYpx, this.colors);
    }

    this.dino.draw(ctx, scale, groundWorldYpx, this.colors);

    // Game state overlays
    if (this.state !== 'running') {
      // Flash dino when gameover
      if (this.state === 'gameover') {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }
}