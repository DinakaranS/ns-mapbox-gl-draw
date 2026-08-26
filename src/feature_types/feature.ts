import { generateID } from '../lib/id';
import * as Constants from '../constants';
import type { DrawContext, DrawFeatureInstance, InternalFeature } from '../types';
import type { Feature } from 'geojson';

export default class DrawFeature implements DrawFeatureInstance {
  ctx: DrawContext;
  properties: Record<string, any>;
  coordinates: any;
  id: string;
  type: string;

  constructor(ctx: DrawContext, geojson: any) {
    this.ctx = ctx;
    this.properties = geojson.properties || {};
    this.coordinates = geojson.geometry.coordinates;
    this.id = geojson.id || generateID();
    this.type = geojson.geometry.type;
  }

  changed(): void {
    this.ctx.store.featureChanged(this.id);
  }

  incomingCoords(coords: any): void {
    this.setCoordinates(coords);
  }

  setCoordinates(coords: any): void {
    this.coordinates = coords;
    this.changed();
  }

  getCoordinates(): any {
    return JSON.parse(JSON.stringify(this.coordinates));
  }

  getCoordinate(_path?: string): any {
    return this.getCoordinates();
  }

  setProperty(property: string, value: any): void {
    this.properties[property] = value;
  }

  toGeoJSON(): Feature {
    return JSON.parse(
      JSON.stringify({
        id: this.id,
        type: Constants.geojsonTypes.FEATURE,
        properties: this.properties,
        geometry: {
          coordinates: this.getCoordinates(),
          type: this.type,
        },
      }),
    );
  }

  internal(mode: string): InternalFeature {
    const properties: Record<string, any> = {
      id: this.id,
      meta: Constants.meta.FEATURE,
      'meta:type': this.type,
      active: Constants.activeStates.INACTIVE,
      mode,
    };

    if (this.ctx.options.userProperties) {
      for (const name in this.properties) {
        properties[`user_${name}`] = this.properties[name];
      }
    }

    return {
      type: Constants.geojsonTypes.FEATURE,
      properties,
      geometry: {
        coordinates: this.getCoordinates(),
        type: this.type,
      },
    };
  }

  isValid(): boolean {
    return true;
  }

  updateCoordinate(..._args: any[]): void {
    // Base implementation - overridden by subclasses
  }

  addCoordinate(_path: string, _lng: number, _lat: number): void {
    // Base implementation - overridden by subclasses
  }

  removeCoordinate(_path: string): void {
    // Base implementation - overridden by subclasses
  }
}
