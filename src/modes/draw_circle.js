import * as Constants from "../constants";
import lineDistance from "@turf/line-distance";
import doubleClickZoom from "../lib/double_click_zoom";
import draw_line_string from "./draw_line_string";
import { createVertex } from "../lib";
import create_distance from "../lib/create_distance";
import centerOfMass from "@turf/center-of-mass";

const CircleMode = { ...draw_line_string };

function createGeoJSONCircle(center, radiusInKm, parentId, points = 64) {
  if (!center || center.length !== 2) return null; // Ensure center is valid

  const [longitude, latitude] = center;
  const coordinates = [];
  const deltaLng = radiusInKm / (111.32 * Math.cos((latitude * Math.PI) / 180));
  const deltaLat = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    coordinates.push([longitude + deltaLng * Math.cos(theta), latitude + deltaLat * Math.sin(theta)]);
  }
  coordinates.push(coordinates[0]); // Close the circle

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coordinates] },
    properties: { parent: parentId },
  };
}

CircleMode.clickAnywhere = function (state, e) {
  if (!state || !state.line) return;

  if (state.currentVertexPosition === 1) {
    state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    return this.changeMode("simple_select", { featureIds: [state.line.id] });
  }

  this.updateUIClasses({ mouse: "add" });
  state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  state.currentVertexPosition++;
  state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
};

CircleMode.onKeyUp = function (state, e) {
  try {
    if (e.keyCode === 27) {
      // ESC key - Cancel drawing
      this.deleteFeature([state.line.id], { silent: true });

      // Store the previous options before exiting
      const prevOpts = state.opts || {};

      // Reset state properties
      state.startPoint = null;
      state.endPoint = null;

      // Exit to simple_select mode (temporarily)
      this.changeMode("simple_select", {}, { silent: true });

      // Re-enter CircleMode with previous options
      setTimeout(() => {
        this.changeMode("draw_circle", prevOpts);
      }, 10);
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

CircleMode.onStop = function (state) {
  try {
    doubleClickZoom.enable(this);

    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.line.id) === undefined) return;

    // remove last added coordinate
    state.line.removeCoordinate("0");
    if (state.line.isValid()) {
      const lineGeoJson = state.line.toGeoJSON();
      // reconfigure the geojson line into a geojson point with a radius property
      const circleFeature = getCircleData(state, lineGeoJson, false);
      const customCircle = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
          type: Constants.geojsonTypes.POLYGON,
          coordinates: [],
        },
      });
      customCircle.coordinates = circleFeature.geometry.coordinates;
      customCircle.properties = circleFeature.properties;
      circleFeature.id = customCircle.id;

      const opts = state.opts || {};
      if (opts.measurement) {
        const displayMeasurements = create_distance(circleFeature);
        circleFeature.properties.distance =
          opts.unit === "metric" ?
            displayMeasurements.metric :
            displayMeasurements.standard;
      }
      this.addFeature(customCircle);
      this.map.fire("draw.create", {
        features: [circleFeature],
      });
      this.deleteFeature([state.line.id], { silent: true });
    } else {
      const prevOpts = state.opts || {};
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode("draw_circle", prevOpts);
    }
  } catch (e) {
    // eslint-disable-next-line
    console.log(e);
  }
};

CircleMode.toDisplayFeatures = function (state, geojson, display) {
  if (!state || !geojson || !state.line) return;

  if (geojson.properties.id !== state.line.id) {
    return display(geojson);
  }

  geojson.properties.active = "true";

  if (geojson.geometry.coordinates.length < 2) return;

  geojson.properties.meta = "feature";

  const lastIndex = state.direction === "forward" ? geojson.geometry.coordinates.length - 2 : 1;

  const vertex = createVertex(state.line.id, geojson.geometry.coordinates[lastIndex], String(lastIndex), false);
  vertex.properties = { ...vertex.properties, user_color: geojson.properties.user_color };

  display(vertex);
  display(geojson);

  const circleFeature = getCircleData(state, geojson, true);
  if (!circleFeature) return;

  circleFeature.properties.user_fillColor = geojson.properties.user_color;
  circleFeature.properties.user_color = geojson.properties.user_color;

  display(circleFeature);

  const properties = { meta: "currentPosition", parent: state.line.id };

  if (state.opts?.measurement) {
    const displayMeasurements = create_distance(circleFeature);
    properties.distance =
      state.opts.unit === "metric" ? displayMeasurements.metric : displayMeasurements.standard;
  }

  display({
    type: "Feature",
    properties: { ...properties, user_color: geojson.properties.user_color || "#FF0010" },
    geometry: { type: "Point", coordinates: centerOfMass(circleFeature.geometry).geometry.coordinates },
  });
};

function getCircleData(state, geojson, selected) {
  if (!geojson || !geojson.geometry || !geojson.geometry.coordinates[0]) return null;

  const center = geojson.geometry.coordinates[0];
  const radiusInKm = lineDistance(geojson, "kilometers");

  return {
    ...createGeoJSONCircle(center, radiusInKm, state.line.id),
    properties: {
      ...state.opts?.properties,
      meta: "radius",
      active: selected ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE,
    },
  };
}

export default CircleMode;
