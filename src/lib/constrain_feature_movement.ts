import * as Constants from '../constants';
import type { Delta } from '../types';

const { LAT_MIN, LAT_MAX, LAT_RENDERED_MIN, LAT_RENDERED_MAX, LNG_MIN, LNG_MAX } = Constants;

const DEPTH_MAP: Record<string, number> = {
  Point: 0,
  LineString: 1,
  Polygon: 2,
  MultiPoint: 1,
  MultiLineString: 2,
  MultiPolygon: 3,
};

function extent(feature: any): [number, number, number, number] {
  const depth = DEPTH_MAP[feature.geometry.type];
  const coords: number[][] = [feature.geometry.coordinates].flat(depth);
  const lngs = coords.map((coord) => coord[0]);
  const lats = coords.map((coord) => coord[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

export default function constrainFeatureMovement(geojsonFeatures: any[], delta: Delta): Delta {
  let northInnerEdge = LAT_MIN;
  let southInnerEdge = LAT_MAX;
  let northOuterEdge = LAT_MIN;
  let southOuterEdge = LAT_MAX;
  let westEdge = LNG_MAX;
  let eastEdge = LNG_MIN;

  geojsonFeatures.forEach((feature) => {
    const bounds = extent(feature);
    const [featureWestEdge, featureSouthEdge, featureEastEdge, featureNorthEdge] = bounds;
    if (featureSouthEdge > northInnerEdge) northInnerEdge = featureSouthEdge;
    if (featureNorthEdge < southInnerEdge) southInnerEdge = featureNorthEdge;
    if (featureNorthEdge > northOuterEdge) northOuterEdge = featureNorthEdge;
    if (featureSouthEdge < southOuterEdge) southOuterEdge = featureSouthEdge;
    if (featureWestEdge < westEdge) westEdge = featureWestEdge;
    if (featureEastEdge > eastEdge) eastEdge = featureEastEdge;
  });

  const constrainedDelta = delta;
  if (northInnerEdge + constrainedDelta.lat > LAT_RENDERED_MAX) {
    constrainedDelta.lat = LAT_RENDERED_MAX - northInnerEdge;
  }
  if (northOuterEdge + constrainedDelta.lat > LAT_MAX) {
    constrainedDelta.lat = LAT_MAX - northOuterEdge;
  }
  if (southInnerEdge + constrainedDelta.lat < LAT_RENDERED_MIN) {
    constrainedDelta.lat = LAT_RENDERED_MIN - southInnerEdge;
  }
  if (southOuterEdge + constrainedDelta.lat < LAT_MIN) {
    constrainedDelta.lat = LAT_MIN - southOuterEdge;
  }
  if (westEdge + constrainedDelta.lng <= LNG_MIN) {
    constrainedDelta.lng += Math.ceil(Math.abs(constrainedDelta.lng) / 360) * 360;
  }
  if (eastEdge + constrainedDelta.lng >= LNG_MAX) {
    constrainedDelta.lng -= Math.ceil(Math.abs(constrainedDelta.lng) / 360) * 360;
  }

  return constrainedDelta;
}
