import type { DrawEvent } from '../types';

export default function mapEventToBoundingBox(
  mapEvent: DrawEvent,
  buffer = 0,
): [[number, number], [number, number]] {
  return [
    [mapEvent.point.x - buffer, mapEvent.point.y - buffer],
    [mapEvent.point.x + buffer, mapEvent.point.y + buffer],
  ];
}
