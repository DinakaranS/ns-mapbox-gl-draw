import createDistance from '../lib/create_distance';
import centerOfMass from '@turf/center-of-mass';
import doubleClickZoom from '../lib/double_click_zoom';
import * as Constants from '../constants';
import type { ModeObject } from '../types';

const DrawRectangle: ModeObject = {
  onSetup(this: any, opts: any) {
    const properties = opts?.properties || {};
    const rectangle = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: { isRectangle: true, ...properties },
      geometry: { type: Constants.geojsonTypes.POLYGON, coordinates: [[]] },
    });
    this.addFeature(rectangle);
    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.setActionableState({ trash: true });
    return { rectangle, opts: opts || {} };
  },

  onTap(this: any, state: any, e: any) {
    if (state.startPoint) this.onMouseMove(state, e);
    this.onClick(state, e);
  },

  onClick(this: any, state: any, e: any) {
    if (
      state.startPoint &&
      state.startPoint[0] !== e.lngLat.lng &&
      state.startPoint[1] !== e.lngLat.lat
    ) {
      this.updateUIClasses({ mouse: Constants.cursors.POINTER });
      state.endPoint = [e.lngLat.lng, e.lngLat.lat];
      this.changeMode(Constants.modes.SIMPLE_SELECT, { featuresId: state.rectangle.id });
    }
    state.startPoint = [e.lngLat.lng, e.lngLat.lat];
  },

  onMouseMove(this: any, state: any, e: any) {
    if (state.startPoint) {
      state.rectangle.updateCoordinate('0.0', state.startPoint[0], state.startPoint[1]);
      state.rectangle.updateCoordinate('0.1', e.lngLat.lng, state.startPoint[1]);
      state.rectangle.updateCoordinate('0.2', e.lngLat.lng, e.lngLat.lat);
      state.rectangle.updateCoordinate('0.3', state.startPoint[0], e.lngLat.lat);
      state.rectangle.updateCoordinate('0.4', state.startPoint[0], state.startPoint[1]);
    }
  },

  onKeyUp(this: any, state: any, e: any) {
    if (e.keyCode === 27) {
      this.deleteFeature([state.rectangle.id], { silent: true });
      const prevOpts = state.opts || {};
      state.startPoint = null;
      state.endPoint = null;
      this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
      setTimeout(() => {
        this.changeMode('draw_rectangle', prevOpts);
      }, 10);
    }
  },

  onStop(this: any, state: any) {
    doubleClickZoom.enable(this);
    this.updateUIClasses({ mouse: Constants.cursors.NONE });
    this.activateUIButton();

    if (this.getFeature(state.rectangle.id) === undefined) return;

    state.rectangle.removeCoordinate('0.4');
    if (state.rectangle.isValid()) {
      if (state.opts.measurement) {
        const { metric, standard } = createDistance(state.rectangle.toGeoJSON());
        state.rectangle.properties = {
          ...state.rectangle.properties,
          distance: state.opts.unit === 'metric' ? metric : standard,
        };
      }
      this.map.fire(Constants.events.CREATE, { features: [state.rectangle.toGeoJSON()] });
    } else {
      this.deleteFeature([state.rectangle.id], { silent: true });
      this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
    }
  },

  toDisplayFeatures(this: any, state: any, geojson: any, display: any) {
    const isActivePolygon = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActivePolygon
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE;
    if (!isActivePolygon) return display(geojson);

    if (!state.startPoint) return;
    display(geojson);

    const opts = state.opts || {};
    if (opts.measurement) {
      const { metric, standard } = createDistance(state.rectangle.toGeoJSON());
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
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },
};

export default DrawRectangle;
