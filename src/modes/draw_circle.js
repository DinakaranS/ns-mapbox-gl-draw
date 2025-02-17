import * as Constants from "../constants";
import lineDistance from "@turf/line-distance";
import doubleClickZoom from "../lib/double_click_zoom";
import draw_line_string from "./draw_line_string";
import { createVertex } from "../lib";
import create_distance from "../lib/create_distance";
import centerOfMass from "@turf/center-of-mass";
import DrawLineString from "./draw_line_string";

const CircleMode = { ...draw_line_string };

function createGeoJSONCircle(center, radiusInKm, parentId, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0],
  };

  const km = radiusInKm;

  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  let theta;
  let x;
  let y;
  for (let i = 0; i < points; i += 1) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [ret],
    },
    properties: {
      parent: parentId,
    },
  };
}

CircleMode.clickAnywhere = function (state, e) {
  // this ends the drawing after the user creates a second point, triggering this.onStop
  if (state.currentVertexPosition === 1) {
    state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat); // eslint-disable-next-line
    return this.changeMode("simple_select", { featureIds: [state.line.id] });
  } // eslint-disable-next-line
  this.updateUIClasses({ mouse: "add" });
  state.line.updateCoordinate(
    state.currentVertexPosition,
    e.lngLat.lng,
    e.lngLat.lat
  );
  if (state.direction === "forward") {
    state.currentVertexPosition += 1; // eslint-disable-line
    state.line.updateCoordinate(
      state.currentVertexPosition,
      e.lngLat.lng,
      e.lngLat.lat
    );
  } else {
    state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
  }

  return null;
};

// creates the final geojson point feature with a radius property
// triggers draw.create
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
          opts.unit === "metric"
            ? displayMeasurements.metric
            : displayMeasurements.standard;
      }
      this.addFeature(customCircle);
      this.map.fire("draw.create", {
        features: [circleFeature],
      });
      this.deleteFeature([state.line.id], { silent: true });
    } else {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode("simple_select", {}, { silent: true });
    }
  } catch (e) {
    // eslint-disable-next-line
    console.log(e);
  }
};

CircleMode.toDisplayFeatures = function (state, geojson, display) {
  const isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = isActiveLine ? "true" : "false";
  if (!isActiveLine) return display(geojson);

  // Only render the line if it has at least one real coordinate
  if (geojson.geometry.coordinates.length < 2) return null;
  geojson.properties.meta = "feature";
  // displays center vertex as a point feature
  const vertex = createVertex(
    state.line.id,
    geojson.geometry.coordinates[
      state.direction === "forward"
        ? geojson.geometry.coordinates.length - 2
        : 1
    ],
    `${
      state.direction === "forward"
        ? geojson.geometry.coordinates.length - 2
        : 1
    }`,
    false
  );

  // Ensure `properties` exists before modifying it
  vertex.properties = {
    ...vertex.properties, // Keep existing properties
    user_color: geojson.properties.user_color, // Add new field
  };

  display(vertex);

  // displays the line as it is drawn
  display(geojson);

  const circleFeature = getCircleData(state, geojson, true);

  // create custom feature for radius circlemarker
  circleFeature.properties.user_fillColor = geojson.properties.user_color;
  circleFeature.properties.user_color = geojson.properties.user_color;
  display(circleFeature);

  const properties = {
    meta: "currentPosition",
    parent: state.line.id,
  };
  const opts = state.opts || {};
  if (opts.measurement) {
    const displayMeasurements = create_distance(circleFeature);
    properties.distance =
      opts.unit === "metric"
        ? displayMeasurements.metric
        : displayMeasurements.standard;
  }
  // create custom feature for the current pointer position
  const currentVertex = {
    type: "Feature",
    properties: {
      ...properties,
      user_color: geojson.properties.user_color || "#FF0010",
    },
    geometry: {
      type: "Point",
      coordinates: centerOfMass(circleFeature.geometry).geometry.coordinates,
    },
  };

  display(currentVertex);

  return null;
};

function getCircleData(state, geojson, selected) {
  const opts = state.opts || {};
  const center = geojson.geometry.coordinates[0];
  const radiusInKm = lineDistance(geojson, "kilometers");
  const circleFeature = createGeoJSONCircle(center, radiusInKm, state.line.id);
  circleFeature.properties = {
    ...opts.properties,
    ...circleFeature.properties,
    meta: "radius",
    active: selected
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE,
  };

  return circleFeature;
}

export default CircleMode;
