import DrawFeature from './feature';
import type { DrawContext } from '../types';

export default class Polygon extends DrawFeature {
  constructor(ctx: DrawContext, geojson: any) {
    super(ctx, geojson);
    this.coordinates = this.coordinates.map((ring: number[][]) => ring.slice(0, -1));
  }

  isValid(): boolean {
    if (this.coordinates.length === 0) return false;
    return this.coordinates.every((ring: number[][]) => ring.length > 2);
  }

  incomingCoords(coords: number[][][]): void {
    this.coordinates = coords.map((ring) => ring.slice(0, -1));
    this.changed();
  }

  setCoordinates(coords: number[][][]): void {
    this.coordinates = coords;
    this.changed();
  }

  addCoordinate(path: string, lng: number, lat: number): void {
    this.changed();
    const ids = path.split('.').map((x) => parseInt(x, 10));
    const ring = this.coordinates[ids[0]];
    ring.splice(ids[1], 0, [lng, lat]);
  }

  removeCoordinate(path: string): void {
    this.changed();
    const ids = path.split('.').map((x) => parseInt(x, 10));
    const ring = this.coordinates[ids[0]];
    if (ring) {
      ring.splice(ids[1], 1);
      if (ring.length < 3) {
        this.coordinates.splice(ids[0], 1);
      }
    }
  }

  getCoordinate(path: string): any {
    const ids = path.split('.').map((x) => parseInt(x, 10));
    const ring = this.coordinates[ids[0]];
    return JSON.parse(JSON.stringify(ring[ids[1]]));
  }

  getCoordinates(): number[][][] {
    return this.coordinates.map((coords: number[][]) => coords.concat([coords[0]]));
  }

  updateCoordinate(path: string, lng: number, lat: number): void {
    this.changed();
    const parts = path.split('.');
    const ringId = parseInt(parts[0], 10);
    const coordId = parseInt(parts[1], 10);

    this.coordinates = [...this.coordinates];

    if (!this.coordinates[ringId]) {
      this.coordinates[ringId] = [];
    } else {
      this.coordinates[ringId] = [...this.coordinates[ringId]];
    }

    this.coordinates[ringId][coordId] = [lng, lat];
  }
}
