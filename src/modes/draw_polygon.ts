import centerOfMass from '@turf/center-of-mass';
import * as CommonSelectors from '../lib/common_selectors';
import doubleClickZoom from '../lib/double_click_zoom';
import * as Constants from '../constants';
import isEventAtCoordinates from '../lib/is_event_at_coordinates';
import createVertex from '../lib/create_vertex';
import createDistance from '../lib/create_distance';
import type { ModeObject } from '../types';

const DrawPolygon: ModeObject = {
  onSetup(this: any, opts: any) {
    const properties = opts?.properties || {};
    const polygon = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: { ...properties },
      geometry: { type: Constants.geojsonTypes.POLYGON, coordinates: [[]] },
    });

    this.addFeature(polygon);
    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POLYGON);
    this.setActionableState({ trash: true });

    return { polygon, currentVertexPosition: 0, opts: opts || {} };
  },

  onClick(this: any, state: any, e: any) {
    if (CommonSelectors.isVertex(e)) {
      return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
    }
    if (
      state.currentVertexPosition > 0 &&
      isEventAtCoordinates(e, state.polygon.coordinates[0][state.currentVertexPosition - 1])
    ) {
      return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
    }
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    state.currentVertexPosition++;
    state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
  },

  onTap(this: any, state: any, e: any) {
    this.onClick(state, e);
  },

  onMouseMove(this: any, state: any, e: any) {
    state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    if (CommonSelectors.isVertex(e)) {
      this.updateUIClasses({ mouse: Constants.cursors.POINTER });
    }
  },

  onKeyUp(this: any, state: any, e: any) {
    if (CommonSelectors.isEscapeKey(e)) {
      this.deleteFeature([state.polygon.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    } else if (CommonSelectors.isEnterKey(e)) {
      this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
    }
  },

  onStop(this: any, state: any) {
    this.updateUIClasses({ mouse: Constants.cursors.NONE });
    doubleClickZoom.enable(this);
    this.activateUIButton();

    if (this.getFeature(state.polygon.id) === undefined) return;

    state.polygon.removeCoordinate(`0.${state.currentVertexPosition}`);
    if (state.polygon.isValid()) {
      if (state.opts.measurement) {
        const { metric, standard } = createDistance(state.polygon.toGeoJSON());
        state.polygon.properties = {
          ...state.polygon.properties,
          distance: state.opts.unit === 'metric' ? metric : standard,
        };
      }
      this.fire(Constants.events.CREATE, { features: [state.polygon.toGeoJSON()] });
    } else {
      this.deleteFeature([state.polygon.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
    }
  },

  toDisplayFeatures(this: any, state: any, geojson: any, display: any) {
    const isActivePolygon = geojson.properties.id === state.polygon.id;
    geojson.properties.active = isActivePolygon
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE;
    if (!isActivePolygon) return display(geojson);

    if (geojson.geometry.coordinates.length === 0) return;

    const coordinateCount = geojson.geometry.coordinates[0].length;
    if (coordinateCount < 3) return;

    geojson.properties.meta = Constants.meta.FEATURE;
    const vertexInit = createVertex(
      state.polygon.id,
      geojson.geometry.coordinates[0][0],
      '0.0',
      false,
    );
    vertexInit.properties = { ...vertexInit.properties, user_color: geojson.properties.user_color };
    display(vertexInit);

    if (coordinateCount > 3) {
      const endPos = geojson.geometry.coordinates[0].length - 3;
      const vertex = createVertex(
        state.polygon.id,
        geojson.geometry.coordinates[0][endPos],
        `0.${endPos}`,
        false,
      );
      vertex.properties = { ...vertex.properties, user_color: geojson.properties.user_color };
      display(vertex);
    }

    if (coordinateCount <= 4) {
      const lineCoordinates = [
        [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]],
        [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]],
      ];
      display({
        type: Constants.geojsonTypes.FEATURE,
        properties: geojson.properties,
        geometry: { coordinates: lineCoordinates, type: Constants.geojsonTypes.LINE_STRING },
      });
      if (coordinateCount === 3) return;
    }

    display(geojson);

    const opts = state.opts || {};
    if (opts.measurement) {
      const { metric, standard } = createDistance(state.polygon.toGeoJSON());
      display({
        type: Constants.geojsonTypes.FEATURE,
        properties: {
          distance: state.opts.unit === 'metric' ? metric : standard,
          user_color: geojson.properties.user_color || '#FF0010',
        },
        geometry: {
          type: Constants.geojsonTypes.POINT,
          coordinates: centerOfMass(geojson.geometry).geometry.coordinates,
        },
      });
    }
  },

  onTrash(this: any, state: any) {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },
};

export default DrawPolygon;
