import euclideanDistance from './euclidean_distance';
import type { EventInfo } from '../types';

const FINE_TOLERANCE = 4;
const GROSS_TOLERANCE = 12;
const INTERVAL = 500;

interface ClickOptions {
  fineTolerance?: number;
  grossTolerance?: number;
  interval?: number;
}

export default function isClick(
  start: Partial<EventInfo>,
  end: EventInfo,
  options: ClickOptions = {},
): boolean {
  const fineTolerance = options.fineTolerance ?? FINE_TOLERANCE;
  const grossTolerance = options.grossTolerance ?? GROSS_TOLERANCE;
  const interval = options.interval ?? INTERVAL;

  start.point = start.point || end.point;
  start.time = start.time || end.time;
  const moveDistance = euclideanDistance(start.point!, end.point);

  return (
    moveDistance < fineTolerance ||
    (moveDistance < grossTolerance && end.time - start.time! < interval)
  );
}
