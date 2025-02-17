import * as CommonSelectors from "../lib/common_selectors";
import doubleClickZoom from "../lib/double_click_zoom";
import * as Constants from "../constants";
import isEventAtCoordinates from "../lib/is_event_at_coordinates";
import createVertex from "../lib/create_vertex";
import create_distance from "../lib/create_distance";
import centerOfMass from "@turf/center-of-mass";

const DrawPolygon = {};

DrawPolygon.onSetup = function (opts) {
  const properties = (opts && opts.properties) || {};
  const polygon = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: { ...properties },
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [[]],
    },
  });

  this.addFeature(polygon);

  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POLYGON);
  this.setActionableState({
    trash: true,
  });

  return {
    polygon,
    currentVertexPosition: 0,
    opts: opts || {},
  };
};

DrawPolygon.clickAnywhere = function (state, e) {
  if (
    state.currentVertexPosition > 0 &&
    isEventAtCoordinates(
      e,
      state.polygon.coordinates[0][state.currentVertexPosition - 1]
    )
  ) {
    return this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.polygon.id],
    });
  }
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  state.polygon.updateCoordinate(
    `0.${state.currentVertexPosition}`,
    e.lngLat.lng,
    e.lngLat.lat
  );
  state.currentVertexPosition++;
  state.polygon.updateCoordinate(
    `0.${state.currentVertexPosition}`,
    e.lngLat.lng,
    e.lngLat.lat
  );
};

DrawPolygon.clickOnVertex = function (state) {
  return this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.polygon.id],
  });
};

DrawPolygon.onMouseMove = function (state, e) {
  state.polygon.updateCoordinate(
    `0.${state.currentVertexPosition}`,
    e.lngLat.lng,
    e.lngLat.lat
  );
  if (CommonSelectors.isVertex(e)) {
    this.updateUIClasses({ mouse: Constants.cursors.POINTER });
  }
};

DrawPolygon.onTap = DrawPolygon.onClick = function (state, e) {
  if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state, e);
  return this.clickAnywhere(state, e);
};

DrawPolygon.onKeyUp = function (state, e) {
  if (CommonSelectors.isEscapeKey(e)) {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  } else if (CommonSelectors.isEnterKey(e)) {
    this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.polygon.id],
    });
  }
};

DrawPolygon.onStop = function (state) {
  this.updateUIClasses({ mouse: Constants.cursors.NONE });
  doubleClickZoom.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.polygon.id) === undefined) return;

  //remove last added coordinate
  state.polygon.removeCoordinate(`0.${state.currentVertexPosition}`);
  if (state.polygon.isValid()) {
    if (state.opts.measurement) {
      const { metric, standard } = create_distance(state.polygon.toGeoJSON());
      state.polygon.properties = {
        ...state.polygon.properties,
        distance: state.opts.unit === "metric" ? metric : standard,
      };
    }
    this.map.fire(Constants.events.CREATE, {
      features: [state.polygon.toGeoJSON()],
    });
  } else {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
  }
};

DrawPolygon.toDisplayFeatures = function (state, geojson, display) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = isActivePolygon ?
    Constants.activeStates.ACTIVE :
    Constants.activeStates.INACTIVE;
  if (!isActivePolygon) return display(geojson);

  // Don't render a polygon until it has two positions
  // (and a 3rd which is just the first repeated)
  if (geojson.geometry.coordinates.length === 0) return;

  const coordinateCount = geojson.geometry.coordinates[0].length;
  // 2 coordinates after selecting a draw type
  // 3 after creating the first point
  if (coordinateCount < 3) {
    return;
  }
  geojson.properties.meta = Constants.meta.FEATURE;
  // Create the vertex from createVertex
  const vertex = createVertex(
    state.polygon.id,
    geojson.geometry.coordinates[0][0],
    "0.0",
    false
  );

  // Modify the vertex properties by adding the user_color
  vertex.properties = {
    ...vertex.properties, // Preserve existing properties
    user_color: geojson.properties.user_color, // Add new field
  };

  // Display the updated vertex
  display(vertex);

  if (coordinateCount > 3) {
    // Add a start position marker to the map, clicking on this will finish the feature
    // This should only be shown when we're in a valid spot
    const endPos = geojson.geometry.coordinates[0].length - 3;
    // Create the vertex from createVertex
    const vertex = createVertex(
      state.polygon.id,
      geojson.geometry.coordinates[0][endPos],
      `0.${endPos}`,
      false
    );

    // Modify the vertex properties by adding the user_color
    vertex.properties = {
      ...vertex.properties, // Preserve existing properties
      user_color: geojson.properties.user_color, // Add new field
    };

    // Display the updated vertex
    display(vertex);
  }
  if (coordinateCount <= 4) {
    // If we've only drawn two positions (plus the closer),
    // make a LineString instead of a Polygon
    const lineCoordinates = [
      [
        geojson.geometry.coordinates[0][0][0],
        geojson.geometry.coordinates[0][0][1],
      ],
      [
        geojson.geometry.coordinates[0][1][0],
        geojson.geometry.coordinates[0][1][1],
      ],
    ];
    // create an initial vertex so that we can track the first point on mobile devices
    display({
      type: Constants.geojsonTypes.FEATURE,
      properties: geojson.properties,
      geometry: {
        coordinates: lineCoordinates,
        type: Constants.geojsonTypes.LINE_STRING,
      },
    });
    if (coordinateCount === 3) {
      return;
    }
  }
  // render the Polygon
  display(geojson);

  const opts = state.opts || {};
  if (opts.measurement) {
    const { metric, standard } = create_distance(state.polygon.toGeoJSON());
    const currentVertex = {
      type: "Feature",
      properties: {
        distance: state.opts.unit === "metric" ? metric : standard,
        user_color: geojson.properties.user_color || "#FF0010",
      },
      geometry: {
        type: "Point",
        coordinates: centerOfMass(geojson.geometry).geometry.coordinates,
      },
    };

    display(currentVertex);
  }

  return null;
};

DrawPolygon.onTrash = function (state) {
  this.deleteFeature([state.polygon.id], { silent: true });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

export default DrawPolygon;
