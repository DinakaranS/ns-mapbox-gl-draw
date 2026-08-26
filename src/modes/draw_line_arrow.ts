import DrawLineString from './draw_line_string';
import * as Constants from '../constants';
import createVertex from '../lib/create_vertex';
import createAdditionalVertex from '../lib/create_additional_vertex';
import type { ModeObject } from '../types';

const DrawLineArrow: ModeObject = {
  ...DrawLineString,

  onKeyUp(this: any, state: any, e: any) {
    if (e.key === 'Enter') {
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  },

  toDisplayFeatures(this: any, state: any, geojson: any, display: any) {
    if (!state.line || geojson.properties.id !== state.line.id) {
      return display(geojson);
    }

    geojson.properties.active = Constants.activeStates.ACTIVE;

    const { coordinates } = geojson.geometry;
    if (coordinates.length < 2) return;

    geojson.properties.meta = Constants.meta.FEATURE;

    const lastIndex = coordinates.length - 2;
    const vertexIndex = state.direction === 'forward' ? lastIndex : 1;

    display(createVertex(state.line.id, coordinates[vertexIndex], `${vertexIndex}`, false));
    display(geojson);
    display(createAdditionalVertex(state.line.id, state.currentVertexPosition, coordinates, false));
  },
};

export default DrawLineArrow;
