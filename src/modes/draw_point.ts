import * as CommonSelectors from '../lib/common_selectors';
import * as Constants from '../constants';
import type { ModeObject } from '../types';

const DrawPoint: ModeObject = {
  onSetup(this: any, opts: any) {
    const properties = opts?.properties || {};
    const point = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: { ...properties },
      geometry: { type: Constants.geojsonTypes.POINT, coordinates: [] },
    });

    this.addFeature(point);
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POINT);
    this.setActionableState({ trash: true });

    return { point, opts: opts || {} };
  },

  onClick(this: any, state: any, e: any) {
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    const formattedLng = e.lngLat.lng.toFixed(5);
    const formattedLat = e.lngLat.lat.toFixed(5);
    state.point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
    if (state.opts.measurement) {
      state.point.properties.distance = `Lat: ${formattedLat}, Lng: ${formattedLng}`;
    }
    this.fire(Constants.events.CREATE, { features: [state.point.toGeoJSON()] });
    this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.point.id] });
  },

  onTap(this: any, state: any, e: any) {
    this.onClick(state, e);
  },

  onStop(this: any, state: any) {
    this.activateUIButton();
    if (!state.point.getCoordinate().length) {
      this.deleteFeature([state.point.id], { silent: true });
    }
  },

  toDisplayFeatures(this: any, state: any, geojson: any, display: any) {
    const isActivePoint = geojson.properties.id === state.point.id;
    geojson.properties.active = isActivePoint
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE;
    if (!isActivePoint) return display(geojson);
  },

  onTrash(this: any, state: any) {
    this.deleteFeature([state.point.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  onKeyUp(this: any, state: any, e: any) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      return this.onTrash(state);
    }
  },
};

export default DrawPoint;
