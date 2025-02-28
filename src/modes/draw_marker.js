import * as CommonSelectors from '../lib/common_selectors';
import * as Constants from '../constants';

const DrawMarker = {};

DrawMarker.onSetup = function (opts) {
  const properties = (opts && opts.properties) || {};
  const point = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {icon: 'gl-draw-ns-marker', ...properties},
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: []
    }
  });

  this.addFeature(point);

  this.clearSelectedFeatures();
  this.updateUIClasses({mouse: Constants.cursors.ADD});
  this.activateUIButton(Constants.types.POINT);

  this.setActionableState({
    trash: true
  });

  return { point, opts: opts || {} };
};

DrawMarker.stopDrawingAndRemove = function (state) {
  this.deleteFeature([state.point.id], {silent: true});
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawMarker.onTap = DrawMarker.onClick = function (state, e) {
  this.updateUIClasses({mouse: Constants.cursors.MOVE});
  const formattedLng = e.lngLat.lng.toFixed(5);
  const formattedLat = e.lngLat.lat.toFixed(5);
  state.point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
  if (state.opts.measurement) {
    state.point.properties.distance = `Lat: ${formattedLat}, Lng: ${formattedLng}`;
  }
  this.map.fire(Constants.events.CREATE, {
    features: [state.point.toGeoJSON()]
  });
  this.changeMode(Constants.modes.SIMPLE_SELECT, {featureIds: [state.point.id]});
};

DrawMarker.onStop = function (state) {
  this.activateUIButton();
  if (!state.point.getCoordinate().length) {
    this.deleteFeature([state.point.id], {silent: true});
  }
};

DrawMarker.toDisplayFeatures = function (state, geojson, display) {
  // Never render the point we're drawing
  const isActivePoint = geojson.properties.id === state.point.id;
  geojson.properties.active = (isActivePoint) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  if (!isActivePoint) return display(geojson);
};

DrawMarker.onTrash = DrawMarker.stopDrawingAndRemove;

DrawMarker.onKeyUp = function (state, e) {
  if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
    return this.stopDrawingAndRemove(state, e);
  }
};

export default DrawMarker;
