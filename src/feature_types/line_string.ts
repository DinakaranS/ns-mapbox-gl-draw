import DrawFeature from './feature';
import type { DrawContext } from '../types';

export default class LineString extends DrawFeature {
  constructor(ctx: DrawContext, geojson: any) {
    super(ctx, geojson);
  }

  isValid(): boolean {
    return this.coordinates.length > 1;
  }

  addCoordinate(path: string, lng: number, lat: number): void {
    this.changed();
    const id = parseInt(path, 10);
    this.coordinates.splice(id, 0, [lng, lat]);
  }

  getCoordinate(path: string): any {
    const id = parseInt(path, 10);
    return JSON.parse(JSON.stringify(this.coordinates[id]));
  }

  removeCoordinate(path: string): void {
    this.changed();
    this.coordinates.splice(parseInt(path, 10), 1);
  }

  updateCoordinate(path: string, lng: number, lat: number): void {
    const id = parseInt(path, 10);
    this.coordinates[id] = [lng, lat];
    this.changed();
  }
}
