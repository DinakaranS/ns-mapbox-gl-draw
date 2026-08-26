import type { DrawEvent } from '../types';

export default function isEventAtCoordinates(
  event: DrawEvent,
  coordinates: [number, number],
): boolean {
  if (!event.lngLat) return false;
  return event.lngLat.lng === coordinates[0] && event.lngLat.lat === coordinates[1];
}
