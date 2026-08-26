import * as Constants from '../constants';
import length from '@turf/length';
import doubleClickZoom from '../lib/double_click_zoom';
import DrawLineString from './draw_line_string';
import { createVertex } from '../lib';
import createDistance from '../lib/create_distance';
import centerOfMass from '@turf/center-of-mass';
import type { ModeObject } from '../types';

function createGeoJSONCircle(
  center: number[],
  radiusInKm: number,
  parentId: string,
  points = 64,
): any | null {
  if (!center || center.length !== 2) return null;

  const [longitude, latitude] = center;
  const coordinates: number[][] = [];
  const deltaLng = radiusInKm / (111.32 * Math.cos((latitude * Math.PI) / 180));
  const deltaLat = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    coordinates.push([
      longitude + deltaLng * Math.cos(theta),
      latitude + deltaLat * Math.sin(theta),
    ]);
  }
  coordinates.push(coordinates[0]);

  return {
    type: Constants.geojsonTypes.FEATURE,
    geometry: { type: Constants.geojsonTypes.POLYGON, coordinates: [coordinates] },
    properties: { parent: parentId },
  };
}

function getCircleData(state: any, geojson: any, selected: boolean): any | null {
  if (!geojson?.geometry?.coordinates?.[0]) return null;

  const center = geojson.geometry.coordinates[0];
  const radiusInKm = (length as any)(geojson, { units: 'kilometers' });

  return {
    ...createGeoJSONCircle(center, radiusInKm, state.line.id),
    properties: {
      ...state.opts?.properties,
      meta: 'radius',
      active: selected ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE,
    },
  };
}

const CircleMode: ModeObject = {
  ...DrawLineString,

  onClick(this: any, state: any, e: any) {
    if (!state?.line) return;

    if (state.currentVertexPosition === 1) {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
      return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
    }

    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    state.currentVertexPosition++;
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  },

  onKeyUp(this: any, state: any, e: any) {
    try {
      if (e.keyCode === 27) {
        this.deleteFeature([state.line.id], { silent: true });
        const prevOpts = state.opts || {};
        state.startPoint = null;
        state.endPoint = null;
        this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
        setTimeout(() => {
          this.changeMode('draw_circle', prevOpts);
        }, 10);
      }
    } catch (err) {
      console.error(err);
    }
  },

  onStop(this: any, state: any) {
    try {
      doubleClickZoom.enable(this);
      this.activateUIButton();

      if (this.getFeature(state.line.id) === undefined) return;

      state.line.removeCoordinate('0');
      if (state.line.isValid()) {
        const lineGeoJson = state.line.toGeoJSON();
        const circleFeature = getCircleData(state, lineGeoJson, false);
        const customCircle = this.newFeature({
          type: Constants.geojsonTypes.FEATURE,
          properties: {},
          geometry: { type: Constants.geojsonTypes.POLYGON, coordinates: [] },
        });
        customCircle.coordinates = circleFeature.geometry.coordinates;
        customCircle.properties = circleFeature.properties;
        circleFeature.id = customCircle.id;

        const opts = state.opts || {};
        if (opts.measurement) {
          const displayMeasurements = createDistance(circleFeature);
          circleFeature.properties.distance =
            opts.unit === 'metric' ? displayMeasurements.metric : displayMeasurements.standard;
        }
        this.addFeature(customCircle);
        this.map.fire(Constants.events.CREATE, { features: [circleFeature] });
        this.deleteFeature([state.line.id], { silent: true });
      } else {
        const prevOpts = state.opts || {};
        this.deleteFeature([state.line.id], { silent: true });
        this.changeMode('draw_circle', prevOpts);
      }
    } catch (err) {
      console.error(err);
    }
  },

  toDisplayFeatures(this: any, state: any, geojson: any, display: any) {
    if (!state?.line || !geojson) return;

    if (geojson.properties.id !== state.line.id) return display(geojson);

    geojson.properties.active = Constants.activeStates.ACTIVE;
    if (geojson.geometry.coordinates.length < 2) return;

    geojson.properties.meta = Constants.meta.FEATURE;

    const lastIndex = state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1;
    const vertex = createVertex(
      state.line.id,
      geojson.geometry.coordinates[lastIndex],
      String(lastIndex),
      false,
    );
    vertex.properties = { ...vertex.properties, user_color: geojson.properties.user_color };
    display(vertex);
    display(geojson);

    const circleFeature = getCircleData(state, geojson, true);
    if (!circleFeature) return;

    circleFeature.properties.user_fillColor = geojson.properties.user_color;
    circleFeature.properties.user_color = geojson.properties.user_color;
    display(circleFeature);

    const properties: Record<string, any> = { meta: 'currentPosition', parent: state.line.id };

    if (state.opts?.measurement) {
      const displayMeasurements = createDistance(circleFeature);
      properties.distance =
        state.opts.unit === 'metric' ? displayMeasurements.metric : displayMeasurements.standard;
    }

    display({
      type: Constants.geojsonTypes.FEATURE,
      properties: { ...properties, user_color: geojson.properties.user_color || '#FF0010' },
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: centerOfMass(circleFeature.geometry).geometry.coordinates,
      },
    });
  },
};

export default CircleMode;
