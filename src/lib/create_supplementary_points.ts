import createVertex from './create_vertex';
import createMidpoint from './create_midpoint';
import * as Constants from '../constants';

interface SupplementaryOptions {
  map?: any;
  midpoints?: boolean;
  selectedPaths?: string[];
}

function createSupplementaryPoints(
  geojson: any,
  options: SupplementaryOptions = {},
  basePath: string | number | null = null,
): any[] {
  const { type, coordinates } = geojson.geometry;
  const featureId = geojson.properties?.id;

  let supplementaryPoints: any[] = [];

  if (type === Constants.geojsonTypes.POINT) {
    supplementaryPoints.push(
      createVertex(featureId, coordinates, String(basePath), isSelectedPath(String(basePath))),
    );
  } else if (type === Constants.geojsonTypes.POLYGON) {
    coordinates.forEach((line: number[][], lineIndex: number) => {
      processLine(line, basePath !== null ? `${basePath}.${lineIndex}` : String(lineIndex));
    });
  } else if (type === Constants.geojsonTypes.LINE_STRING) {
    processLine(coordinates, basePath !== null ? String(basePath) : undefined);
  } else if (type.indexOf(Constants.geojsonTypes.MULTI_PREFIX) === 0) {
    processMultiGeometry();
  }

  function processLine(line: number[][], lineBasePath?: string) {
    let firstPointString = '';
    let lastVertex: any = null;
    line.forEach((point: number[], pointIndex: number) => {
      const pointPath =
        lineBasePath !== undefined && lineBasePath !== null
          ? `${lineBasePath}.${pointIndex}`
          : String(pointIndex);
      const vertex = createVertex(featureId, point, pointPath, isSelectedPath(pointPath));

      if (options.midpoints && lastVertex) {
        const midpoint = createMidpoint(featureId, lastVertex, vertex);
        if (midpoint) {
          supplementaryPoints.push(midpoint);
        }
      }
      lastVertex = vertex;

      const stringifiedPoint = JSON.stringify(point);
      if (firstPointString !== stringifiedPoint) {
        supplementaryPoints.push(vertex);
      }
      if (pointIndex === 0) {
        firstPointString = stringifiedPoint;
      }
    });
  }

  function isSelectedPath(path: string): boolean {
    if (!options.selectedPaths) return false;
    return options.selectedPaths.indexOf(path) !== -1;
  }

  function processMultiGeometry() {
    const subType = type.replace(Constants.geojsonTypes.MULTI_PREFIX, '');
    coordinates.forEach((subCoordinates: any, index: number) => {
      const subFeature = {
        type: Constants.geojsonTypes.FEATURE,
        properties: geojson.properties,
        geometry: {
          type: subType,
          coordinates: subCoordinates,
        },
      };
      supplementaryPoints = supplementaryPoints.concat(
        createSupplementaryPoints(subFeature, options, index),
      );
    });
  }

  return supplementaryPoints;
}

export default createSupplementaryPoints;
