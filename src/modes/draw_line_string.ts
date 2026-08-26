import * as CommonSelectors from '../lib/common_selectors';
import isEventAtCoordinates from '../lib/is_event_at_coordinates';
import doubleClickZoom from '../lib/double_click_zoom';
import * as Constants from '../constants';
import createVertex from '../lib/create_vertex';
import createDistance from '../lib/create_distance';
import createAdditionalVertex from '../lib/create_additional_vertex';
import type { ModeObject } from '../types';

const DrawLineString: ModeObject = {
  onSetup(this: any, opts: any = {}) {
    const featureId = opts.featureId;
    let line: any, currentVertexPosition: number;
    let direction = 'forward';

    if (featureId) {
      line = this.getFeature(featureId);
      if (!line) throw new Error('Could not find a feature with the provided featureId');

      let from = opts.from;
      if (from?.type === 'Feature' && from.geometry?.type === 'Point') from = from.geometry;
      if (from?.type === 'Point' && from.coordinates?.length === 2) from = from.coordinates;
      if (!from || !Array.isArray(from)) {
        throw new Error(
          'Please use the `from` property to indicate which point to continue the line from',
        );
      }

      const lastCoord = line.coordinates.length - 1;
      if (
        line.coordinates[lastCoord][0] === from[0] &&
        line.coordinates[lastCoord][1] === from[1]
      ) {
        currentVertexPosition = lastCoord + 1;
        line.addCoordinate(currentVertexPosition, ...line.coordinates[lastCoord]);
      } else if (line.coordinates[0][0] === from[0] && line.coordinates[0][1] === from[1]) {
        direction = 'backwards';
        currentVertexPosition = 0;
        line.addCoordinate(currentVertexPosition, ...line.coordinates[0]);
      } else {
        throw new Error(
          '`from` should match the point at either the start or the end of the provided LineString',
        );
      }
    } else {
      const properties = opts?.properties || {};
      line = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: { ...properties },
        geometry: { type: Constants.geojsonTypes.LINE_STRING, coordinates: [] },
      });
      currentVertexPosition = 0;
      this.addFeature(line);
    }

    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.LINE);
    this.setActionableState({ trash: true });

    return { line, currentVertexPosition, direction, opts: opts || {} };
  },

  onClick(this: any, state: any, e: any) {
    if (
      (state.currentVertexPosition > 0 &&
        isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1])) ||
      (state.direction === 'backwards' &&
        isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition + 1]))
    ) {
      return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
    }
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    if (state.direction === 'forward') {
      state.currentVertexPosition++;
      state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    } else {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    }
  },

  onTap(this: any, state: any, e: any) {
    if (CommonSelectors.isVertex(e)) {
      return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
    }
    this.onClick(state, e);
  },

  onMouseMove(this: any, state: any, e: any) {
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    if (CommonSelectors.isVertex(e)) {
      this.updateUIClasses({ mouse: Constants.cursors.POINTER });
    }
  },

  onKeyUp(this: any, state: any, e: any) {
    if (CommonSelectors.isEnterKey(e)) {
      this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
    } else if (CommonSelectors.isEscapeKey(e)) {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT);
    }
  },

  onStop(this: any, state: any) {
    doubleClickZoom.enable(this);
    this.activateUIButton();

    if (this.getFeature(state.line.id) === undefined) return;

    state.line.removeCoordinate(`${state.currentVertexPosition}`);
    if (state.line.isValid()) {
      if (state.opts.measurement) {
        const { metric, standard } = createDistance(state.line.toGeoJSON());
        state.line.properties = {
          ...state.line.properties,
          distance: state.opts.unit === 'metric' ? metric : standard,
        };
      }
      this.map.fire(Constants.events.CREATE, { features: [state.line.toGeoJSON()] });
    } else {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
    }
  },

  onTrash(this: any, state: any) {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  toDisplayFeatures(this: any, state: any, geojson: any, display: any) {
    const isActiveLine = geojson.properties.id === state.line.id;
    geojson.properties.active = isActiveLine
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE;
    if (!isActiveLine) return display(geojson);
    if (geojson.geometry.coordinates.length < 2) return;
    geojson.properties.meta = Constants.meta.FEATURE;

    display(
      createVertex(
        state.line.id,
        geojson.geometry.coordinates[
          state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1
        ],
        `${state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1}`,
        false,
      ),
    );

    display(geojson);

    const opts = state.opts || {};
    if (opts.measurement) {
      const { coordinates } = geojson.geometry;
      const distanceVertex = createAdditionalVertex(
        state.line.id,
        state.currentVertexPosition,
        coordinates,
        false,
        'currentPosition',
        opts.unit,
      );

      if (distanceVertex) {
        distanceVertex.properties = {
          ...distanceVertex.properties,
          user_color: geojson.properties.user_color || '#FF0010',
        };
        display(distanceVertex);
      }
    }
  },
};

export default DrawLineString;
