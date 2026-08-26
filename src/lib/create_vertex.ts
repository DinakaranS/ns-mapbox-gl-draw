import * as Constants from '../constants';

export default function createVertex(
  parentId: string,
  coordinates: number[],
  path: string,
  selected: boolean,
): any {
  return {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      meta: Constants.meta.VERTEX,
      parent: parentId,
      coord_path: path,
      active: selected ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE,
    },
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates,
    },
  };
}
