import constrainFeatureMovement from './constrain_feature_movement';
import * as Constants from '../constants';
import type { DrawFeatureInstance, Delta } from '../types';

export default function moveFeatures(features: DrawFeatureInstance[], delta: Delta): void {
  const constrainedDelta = constrainFeatureMovement(
    features.map((feature) => feature.toGeoJSON()),
    delta,
  );

  features.forEach((feature) => {
    const currentCoordinates = feature.getCoordinates();

    const moveCoordinate = (coord: number[]): number[] => [
      coord[0] + constrainedDelta.lng,
      coord[1] + constrainedDelta.lat,
    ];
    const moveRing = (ring: number[][]): number[][] => ring.map(moveCoordinate);
    const moveMultiPolygon = (multi: number[][][]): number[][][] => multi.map(moveRing);

    let nextCoordinates: any;
    if (feature.type === Constants.geojsonTypes.POINT) {
      nextCoordinates = moveCoordinate(currentCoordinates);
    } else if (
      feature.type === Constants.geojsonTypes.LINE_STRING ||
      feature.type === Constants.geojsonTypes.MULTI_POINT
    ) {
      nextCoordinates = currentCoordinates.map(moveCoordinate);
    } else if (
      feature.type === Constants.geojsonTypes.POLYGON ||
      feature.type === Constants.geojsonTypes.MULTI_LINE_STRING
    ) {
      nextCoordinates = currentCoordinates.map(moveRing);
    } else if (feature.type === Constants.geojsonTypes.MULTI_POLYGON) {
      nextCoordinates = currentCoordinates.map(moveMultiPolygon);
    }

    feature.incomingCoords(nextCoordinates);
  });
}
