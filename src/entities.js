import { clamp, randRange } from './utils.js';

export class Dino {
  constructor() {
    this.width = 6.5;  // world units
    this.height = 10;
    this.x = 15;
    this.y = 0; // bottom-aligned; y is bottom position
    this.velocityY = 0;
    this.onGround = true;

    // Jump tuning
    this.jumpVelocity = 34; // initial impulse
    this.gravity = 120;     // base gravity
    this.lowJumpGravityMultiplier = 1.6; // stronger pull if jump not held
    this.maxJumpBoostTime = 0.14; // seconds of reduced gravity while held
    this.jumpTime = 0; // time since jump start

    // Simple running animation
    this.legPhase = 0;
  }

  reset(groundY) {
    this.y = groundY;
    this.velocityY = 0;
    this.onGround = true;
    this.jumpTime = 0;
    this.legPhase = 0;
  }

  update(dt, groundY, jumpPressed, jumpHeld) {
    if (this.onGround && jumpPressed) {
      this.velocityY = this.jumpVelocity;
      this.onGround = false;
      this.jumpTime = 0;
    }

    if (!this.onGround) {
      // Variable jump height via reduced gravity while held briefly
      const isBoosting = jumpHeld && this.jumpTime < this.maxJumpBoostTime;
      const gravity = isBoosting ? this.gravity * 0.6 : this.gravity * this.lowJumpGravityMultiplier;
      this.velocityY -= gravity * dt;
      this.y += this.velocityY * dt;
      this.jumpTime += dt;

      if (this.y <= groundY) {
        this.y = groundY;
        this.velocityY = 0;
        this.onGround = true;
      }
    } else {
      // Running leg animation
      this.legPhase = (this.legPhase + dt * 12) % (Math.PI * 2);
    }
  }

  getAabb() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  draw(ctx, scale, groundPxY, colors) {
    const px = (v) => v * scale;
    const screenX = px(this.x);
    const screenY = groundPxY - px(this.height);

    // Body
    ctx.fillStyle = colors.dino;
    const radius = px(1.6);
    roundRect(ctx, screenX, screenY, px(this.width), px(this.height), radius);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(screenX + px(this.width * 0.7), screenY + px(this.height * 0.22), px(0.9), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(screenX + px(this.width * 0.75), screenY + px(this.height * 0.22), px(0.45), 0, Math.PI * 2);
    ctx.fill();

    // Legs (simple swinging rectangles)
    const legOffset = Math.sin(this.legPhase) * px(0.8);
    ctx.fillStyle = colors.dinoDark;
    ctx.fillRect(screenX + px(1.2), groundPxY - px(3), px(1.4), px(3));
    ctx.fillRect(screenX + px(this.width - 2.6), groundPxY - px(3), px(1.4), px(3));
    ctx.globalAlpha = 0.5;
    ctx.fillRect(screenX + px(1.2) + legOffset, groundPxY - px(3), px(1.4), px(3));
    ctx.fillRect(screenX + px(this.width - 2.6) - legOffset, groundPxY - px(3), px(1.4), px(3));
    ctx.globalAlpha = 1;
  }
}

export class Obstacle {
  constructor(worldWidth, groundY, baseSpeed) {
    this.passed = false;

    // Randomize shape
    const types = [
      { w: randRange(3.5, 5.5), h: randRange(8, 14) },
      { w: randRange(6, 9), h: randRange(5, 8) },
      { w: randRange(2.5, 3.8), h: randRange(6, 12) }
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    this.width = t.w;
    this.height = t.h;

    this.x = worldWidth + this.width + randRange(0, 10);
    this.y = groundY;

    this.speed = baseSpeed * randRange(0.94, 1.08);
  }

  update(dt, globalSpeed) {
    this.x -= (this.speed + globalSpeed * 0.2) * dt;
  }

  isOffscreen() {
    return this.x + this.width < -2;
  }

  getAabb() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  draw(ctx, scale, groundPxY, colors) {
    const px = (v) => v * scale;
    const screenX = px(this.x);
    const screenY = groundPxY - px(this.height);

    ctx.fillStyle = colors.cactus;
    roundRect(ctx, screenX, screenY, px(this.width), px(this.height), px(1.2));
    ctx.fill();

    // Decorative arms
    ctx.fillStyle = colors.cactusAccent;
    ctx.fillRect(screenX + px(this.width * 0.2), screenY + px(this.height * 0.35), px(2), px(0.9));
    ctx.fillRect(screenX + px(this.width * 0.65), screenY + px(this.height * 0.5), px(2), px(0.9));
  }
}

export function aabbIntersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}