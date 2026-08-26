import distance from '@turf/distance';
import centroid from '@turf/centroid';
import bearing from '@turf/bearing';
import destination from '@turf/destination';
import type { ModeObject } from '../types';

function rotateCoordinates(
  coords: number[][],
  originalCenter: any,
  draggedBearing: number,
): number[][] {
  return coords.map((coord) => {
    const distanceFromCenter = distance(originalCenter, coord);
    const bearingFromCenter = bearing(originalCenter, coord);
    const newPoint = destination(
      originalCenter,
      distanceFromCenter,
      bearingFromCenter + draggedBearing,
    );
    return newPoint.geometry.coordinates as number[];
  });
}

const RotateMode: ModeObject = {
  onSetup(opts: any) {
    return {
      selectedFeature: opts.selectedFeature || false,
      lastMouseDownLngLat: false,
      originalCenter: false,
      originalFeature: null,
      mode: 'rotate',
    };
  },

  onMouseDown(this: any, state: any, e: any) {
    if (e.featureTarget) {
      if (this._ctx.api.get(e.featureTarget.properties.id)) {
        e.target.dragPan.disable();
        state.selectedFeature = this._ctx.api.get(e.featureTarget.properties.id);
        state.originalCenter = centroid(e.featureTarget);
        state.originalFeature = e.featureTarget;
      }
    }
    return state;
  },

  toDisplayFeatures(_state: any, geojson: any, display: any) {
    display(geojson);
  },

  onDrag(this: any, state: any, e: any) {
    if (!state.selectedFeature || !state.mode) return;
    if (state.mode !== 'rotate') return;

    state.lastMouseDownLngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    const draggedBearing = bearing(state.originalCenter, [e.lngLat.lng, e.lngLat.lat]);
    let rotatedCoords: any;

    const metaType = state.originalFeature.properties['meta:type'];

    switch (metaType) {
      case 'Point': {
        const bearingFromCenter = bearing(
          state.originalCenter,
          state.originalFeature.geometry.coordinates,
        );
        const newPoint = destination(state.originalCenter, 0, bearingFromCenter + draggedBearing);
        rotatedCoords = newPoint.geometry.coordinates;
        state.selectedFeature.geometry.coordinates = rotatedCoords;
        state.selectedFeature.properties.angle = (bearingFromCenter + draggedBearing) % 360;
        break;
      }
      case 'LineString': {
        rotatedCoords = rotateCoordinates(
          state.originalFeature.geometry.coordinates,
          state.originalCenter,
          draggedBearing,
        );
        break;
      }
      case 'Polygon': {
        rotatedCoords = [
          rotateCoordinates(
            state.originalFeature.geometry.coordinates[0],
            state.originalCenter,
            draggedBearing,
          ),
        ];
        break;
      }
      case 'MultiLineString': {
        rotatedCoords = state.originalFeature.geometry.coordinates.map((polygon: number[][]) =>
          rotateCoordinates(polygon, state.originalCenter, draggedBearing),
        );
        break;
      }
      case 'MultiPolygon': {
        rotatedCoords = state.originalFeature.geometry.coordinates.map((polygon: number[][][]) =>
          polygon.map((ring: number[][]) =>
            rotateCoordinates(ring, state.originalCenter, draggedBearing),
          ),
        );
        break;
      }
      default:
        return;
    }

    const newFeature = state.selectedFeature;
    newFeature.geometry.coordinates = rotatedCoords;
    this._ctx.api.add(newFeature);
  },

  onMouseUp(_state: any, e: any) {
    e.target.dragPan.enable();
    _state.selectedFeature = false;
    _state.lastMouseDownLngLat = false;
    _state.originalCenter = false;
    return _state;
  },
};

export default RotateMode;
