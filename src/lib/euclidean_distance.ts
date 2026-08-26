import type { PixelPoint } from '../types';

export default function euclideanDistance(a: PixelPoint, b: PixelPoint): number {
  const x = a.x - b.x;
  const y = a.y - b.y;
  return Math.sqrt(x * x + y * y);
}
