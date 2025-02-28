import draw_line_string from "./draw_line_string";
import * as Constants from "../constants";
import createVertex from "../lib/create_vertex";
import create_additional_vertex from "../lib/create_additional_vertex";

const DrawLineArrow = { ...draw_line_string };

// Handle Key Events
DrawLineArrow.onKeyUp = function (state, e) {
  if (e.key === "Enter") {
    this.changeMode("simple_select");
  }
};

// Render Features with Arrow
DrawLineArrow.toDisplayFeatures = function (state, geojson, display) {
  if (!state.line || geojson.properties.id !== state.line.id) {
    return display(geojson);
  }

  geojson.properties.active = Constants.activeStates.ACTIVE;

  const { coordinates } = geojson.geometry;
  if (coordinates.length < 2) return;

  geojson.properties.meta = Constants.meta.FEATURE;

  // Determine vertex index
  const lastIndex = coordinates.length - 2;
  const vertexIndex = state.direction === "forward" ? lastIndex : 1;

  display(createVertex(state.line.id, coordinates[vertexIndex], `${vertexIndex}`, false));

  display(geojson);

  display(create_additional_vertex(state.line.id, state.currentVertexPosition, coordinates, false));
};

export default DrawLineArrow;
