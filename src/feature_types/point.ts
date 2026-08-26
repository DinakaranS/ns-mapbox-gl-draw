import DrawFeature from './feature';
import type { DrawContext } from '../types';

export default class Point extends DrawFeature {
  constructor(ctx: DrawContext, geojson: any) {
    super(ctx, geojson);
  }

  isValid(): boolean {
    return typeof this.coordinates[0] === 'number' && typeof this.coordinates[1] === 'number';
  }

  updateCoordinate(pathOrLng: any, lngOrLat?: number, lat?: number): void {
    if (arguments.length === 3) {
      this.coordinates = [lngOrLat, lat];
    } else {
      this.coordinates = [pathOrLng, lngOrLat];
    }
    this.changed();
  }

  getCoordinate(): any {
    return this.getCoordinates();
  }
}
