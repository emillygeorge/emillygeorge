export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function choose(array) {
  return array[Math.floor(Math.random() * array.length)];
}