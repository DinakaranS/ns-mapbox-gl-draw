import { geojsonTypes, activeStates } from "../constants";
import bearing from "@turf/bearing";
import { lineString } from "@turf/helpers";
import calculateDistance from "./create_distance"; // Renamed for clarity

export default function createVertex(
  parentId,
  currentVertexPosition,
  coordinates,
  isSelected,
  meta = "arrowPosition",
  units = "",
  showBearing = true
) {
  // Validate coordinates
  if (
    !coordinates ||
    !Array.isArray(coordinates) ||
    coordinates.length < currentVertexPosition
  ) {
    console.error("Invalid coordinates provided for vertex creation.");
    return null;
  }

  const prevCoord = coordinates[currentVertexPosition - 1];
  const currCoord = coordinates[currentVertexPosition];

  if (!prevCoord || !currCoord) {
    console.error("Invalid vertex positions for arrow creation.");
    return null;
  }

  const properties = {
    meta,
    parent: parentId,
    active: isSelected ? activeStates.ACTIVE : activeStates.INACTIVE,
  };

  // Calculate distance if units are provided
  if (units) {
    const distanceVertex = lineString([prevCoord, currCoord]);
    const { metric, standard } = calculateDistance(distanceVertex);
    properties.distance = units === "metric" ? metric : standard;
  }

  // Calculate bearing if required
  if (showBearing) {
    properties.bearing = bearing(prevCoord, currCoord) || 0;
  }

  return {
    type: geojsonTypes.FEATURE,
    properties,
    geometry: {
      type: geojsonTypes.POINT,
      coordinates: currCoord,
    },
  };
}
