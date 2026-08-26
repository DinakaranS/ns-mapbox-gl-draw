import { generateID } from '../lib/id';
import DrawFeature from './feature';
import * as Constants from '../constants';
import Point from './point';
import LineString from './line_string';
import Polygon from './polygon';
import type { DrawContext } from '../types';

const models: Record<string, typeof Point | typeof LineString | typeof Polygon> = {
  MultiPoint: Point,
  MultiLineString: LineString,
  MultiPolygon: Polygon,
};

function takeAction(
  features: DrawFeature[],
  action: string,
  path: string,
  lng?: number,
  lat?: number,
): any {
  const parts = path.split('.');
  const idx = parseInt(parts[0], 10);
  const tail = !parts[1] ? null : parts.slice(1).join('.');
  return (features[idx] as any)[action](tail, lng, lat);
}

export default class MultiFeature extends DrawFeature {
  model: typeof Point | typeof LineString | typeof Polygon;
  features: DrawFeature[];

  constructor(ctx: DrawContext, geojson: any) {
    super(ctx, geojson);
    delete (this as any).coordinates;
    this.model = models[geojson.geometry.type];
    if (this.model === undefined) {
      throw new TypeError(`${geojson.geometry.type} is not a valid type`);
    }
    this.features = this._coordinatesToFeatures(geojson.geometry.coordinates);
  }

  _coordinatesToFeatures(coordinates: any[]): DrawFeature[] {
    const Model = this.model;
    return coordinates.map(
      (coords) =>
        new Model(this.ctx, {
          id: generateID(),
          type: Constants.geojsonTypes.FEATURE,
          properties: {},
          geometry: {
            coordinates: coords,
            type: this.type.replace('Multi', ''),
          },
        }),
    );
  }

  isValid(): boolean {
    return this.features.every((f) => f.isValid());
  }

  setCoordinates(coords: any[]): void {
    this.features = this._coordinatesToFeatures(coords);
    this.changed();
  }

  getCoordinate(path: string): any {
    return takeAction(this.features, 'getCoordinate', path);
  }

  getCoordinates(): any {
    return JSON.parse(
      JSON.stringify(
        this.features.map((f) => {
          if (f.type === Constants.geojsonTypes.POLYGON) return f.getCoordinates();
          return f.coordinates;
        }),
      ),
    );
  }

  updateCoordinate(path: string, lng: number, lat: number): void {
    takeAction(this.features, 'updateCoordinate', path, lng, lat);
    this.changed();
  }

  addCoordinate(path: string, lng: number, lat: number): void {
    takeAction(this.features, 'addCoordinate', path, lng, lat);
    this.changed();
  }

  removeCoordinate(path: string): void {
    takeAction(this.features, 'removeCoordinate', path);
    this.changed();
  }

  getFeatures(): DrawFeature[] {
    return this.features;
  }
}
