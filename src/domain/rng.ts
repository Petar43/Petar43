export type SeededRng = {
  next: () => number;
  int: (min: number, max: number) => number;
};

export function createSeededRng(seed: number): SeededRng {
  let t = seed >>> 0;
  const next = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => {
    const value = Math.floor(next() * (max - min + 1)) + min;
    return Math.min(max, Math.max(min, value));
  };
  return { next, int };
}
