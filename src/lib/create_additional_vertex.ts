import { geojsonTypes, activeStates } from '../constants';
import bearing from '@turf/bearing';
import { lineString } from '@turf/helpers';
import calculateDistance from './create_distance';

export default function createAdditionalVertex(
  parentId: string,
  currentVertexPosition: number,
  coordinates: number[][],
  isSelected: boolean,
  metaType = 'arrowPosition',
  units = '',
  showBearing = true,
): any | null {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < currentVertexPosition) {
    console.error('Invalid coordinates provided for vertex creation.');
    return null;
  }

  const prevCoord = coordinates[currentVertexPosition - 1];
  const currCoord = coordinates[currentVertexPosition];

  if (!prevCoord || !currCoord) {
    console.error('Invalid vertex positions for arrow creation.');
    return null;
  }

  const properties: Record<string, any> = {
    meta: metaType,
    parent: parentId,
    active: isSelected ? activeStates.ACTIVE : activeStates.INACTIVE,
  };

  if (units) {
    const distanceVertex = lineString([prevCoord, currCoord]);
    const { metric, standard } = calculateDistance(distanceVertex);
    properties.distance = units === 'metric' ? metric : standard;
  }

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
