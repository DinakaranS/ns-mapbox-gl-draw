import euclideanDistance from './euclidean_distance';
import type { EventInfo } from '../types';

export const TAP_TOLERANCE = 25;
export const TAP_INTERVAL = 250;

interface TapOptions {
  tolerance?: number;
  interval?: number;
}

export default function isTap(
  start: Partial<EventInfo>,
  end: EventInfo,
  options: TapOptions = {},
): boolean {
  const tolerance = options.tolerance ?? TAP_TOLERANCE;
  const interval = options.interval ?? TAP_INTERVAL;

  start.point = start.point || end.point;
  start.time = start.time || end.time;
  const moveDistance = euclideanDistance(start.point!, end.point);

  return moveDistance < tolerance && end.time - start.time! < interval;
}
