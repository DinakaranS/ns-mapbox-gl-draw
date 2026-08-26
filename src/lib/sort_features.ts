import area from '@mapbox/geojson-area';
import * as Constants from '../constants';

const FEATURE_SORT_RANKS: Record<string, number> = {
  Point: 0,
  LineString: 1,
  MultiLineString: 1,
  Polygon: 2,
};

function comparator(a: any, b: any): number {
  const score = FEATURE_SORT_RANKS[a.geometry.type] - FEATURE_SORT_RANKS[b.geometry.type];
  if (score === 0 && a.geometry.type === Constants.geojsonTypes.POLYGON) {
    return a.area - b.area;
  }
  return score;
}

export default function sortFeatures(features: any[]): any[] {
  return features
    .map((feature) => {
      if (feature.geometry.type === Constants.geojsonTypes.POLYGON) {
        feature.area = (area as any).geometry({
          type: Constants.geojsonTypes.FEATURE,
          property: {},
          geometry: feature.geometry,
        });
      }
      return feature;
    })
    .sort(comparator)
    .map((feature) => {
      delete feature.area;
      return feature;
    });
}
