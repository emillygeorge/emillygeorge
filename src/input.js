export class InputManager {
  constructor(targetElement) {
    this.target = targetElement || window;
    this.jumpHeld = false;
    this.jumpPressedThisFrame = false;
    this.anyUserGesture = false;

    this._onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.jumpHeld = true;
        this.jumpPressedThisFrame = true;
        this.anyUserGesture = true;
        e.preventDefault();
      }
    };

    this._onKeyUp = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.jumpHeld = false;
        e.preventDefault();
      }
    };

    this._onPointerDown = () => {
      this.jumpHeld = true;
      this.jumpPressedThisFrame = true;
      this.anyUserGesture = true;
    };

    this._onPointerUp = () => {
      this.jumpHeld = false;
    };

    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('keyup', this._onKeyUp, { passive: false });
    this.target.addEventListener('pointerdown', this._onPointerDown, { passive: true });
    this.target.addEventListener('pointerup', this._onPointerUp, { passive: true });
    this.target.addEventListener('pointercancel', this._onPointerUp, { passive: true });
    this.target.addEventListener('pointerleave', this._onPointerUp, { passive: true });
  }

  consumeJumpPressed() {
    const was = this.jumpPressedThisFrame;
    this.jumpPressedThisFrame = false;
    return was;
  }

  isJumpHeld() {
    return this.jumpHeld;
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.target.removeEventListener('pointerdown', this._onPointerDown);
    this.target.removeEventListener('pointerup', this._onPointerUp);
    this.target.removeEventListener('pointercancel', this._onPointerUp);
    this.target.removeEventListener('pointerleave', this._onPointerUp);
  }
}