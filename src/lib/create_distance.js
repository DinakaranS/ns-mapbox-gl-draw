import lineDistance from '@turf/length';
import numeral from 'numeral';
import {distance as turfDistance} from '@turf/distance';
import {polygonToLine} from '@turf/polygon-to-line';
import {point, polygon} from '@turf/helpers';
import {area as turfArea} from '@turf/area';
import {LngLatBounds} from 'mapbox-gl';
import {bbox} from '@turf/bbox';

export default function (feature) {
  try {
    const drawnLength = (lineDistance(feature) * 1000); // meters
    const drawnArea = turfArea(feature); // square meters

    let metricUnits = 'm';
    let metricFormat = '0,0';
    let metricMeasurement;

    let standardUnits = 'feet';
    let standardFormat = '0,0';
    let standardMeasurement;

    if (drawnLength > drawnArea) { // user is drawing a line
      metricMeasurement = drawnLength;
      if (drawnLength >= 1000) { // if over 1000 meters, upgrade metric
        metricMeasurement = drawnLength / 1000;
        metricUnits = 'km';
        metricFormat = '0.00';
      }

      standardMeasurement = drawnLength * 3.28084;
      if (standardMeasurement >= 5280) { // if over 5280 feet, upgrade standard
        standardMeasurement /= 5280;
        standardUnits = 'mi';
        standardFormat = '0.00';
      }
    } else { // user is drawing a polygon
      metricUnits = 'm²';
      metricFormat = '0,0';
      metricMeasurement = drawnArea;

      standardUnits = 'ft²';
      standardFormat = '0,0';
      standardMeasurement = drawnArea * 10.7639;

      if (drawnArea >= 1000000) { // if over 1,000,000 meters, upgrade metric
        metricMeasurement = drawnArea / 1000000;
        metricUnits = 'km²';
        metricFormat = '0.00';
      }

      if (standardMeasurement >= 27878400) { // if over 27878400 sf, upgrade standard
        standardMeasurement /= 27878400;
        standardUnits = 'mi²';
        standardFormat = '0.00';
      }
    }
    if (feature.properties && feature.properties.name === 'Rectangle') {
      return {
        metric: getWidthHeight(feature, 'metric'),
        standard: getWidthHeight(feature, 'standard')
      };
    }
    return {
      metric: (drawnLength > drawnArea || drawnArea === 0) && (feature.geometry.type === 'LineString' || feature.geometry.type === 'Point') ? `${numeral(metricMeasurement).format(metricFormat)} ${metricUnits}` : `${getWidthHeight(feature, 'metric')}`,
      standard: (drawnLength > drawnArea || drawnArea === 0) && (feature.geometry.type === 'LineString' || feature.geometry.type === 'Point') ? `${numeral(standardMeasurement).format(standardFormat)} ${standardUnits}` : `${getWidthHeight(feature, 'standard')}`,
    };
  } catch (e) {
    return {
      metric: '', standard: ''
    };
  }
}

// eslint-disable-next-line no-unused-vars
function unitTransformation(value, measurementSystem, isArea = false) {
  let standardUnits = isArea ? 'ft²' : 'feet';
  const standardFormat = '0.00';
  let standardMeasurement = value;

  let metricUnits = isArea ? 'm²' : 'm';
  const metricFormat = '0.00';
  let metricMeasurement = value;

  if (measurementSystem === 'standard') {
    if (isArea) {
      if (standardMeasurement >= 43560) { // if over 43560 sf, upgrade standard
        standardMeasurement /= 43560;
        standardUnits = 'ac';
      }
    } else if (standardMeasurement >= 5280) { // if over 5280 f, upgrade standard
      standardMeasurement /= 5280;
      standardUnits = 'mi';
    }
    return `${numeral(standardMeasurement).format(standardFormat)} ${standardUnits}`;
  }
  if (isArea) {
    if (metricMeasurement >= 1000000) { // if over 1,000,000 meters, upgrade metric
      metricMeasurement /= 1000000;
      metricUnits = 'km²';
    }
  } else if (metricMeasurement >= 1000) { // if over 1000 m, upgrade standard
    metricMeasurement /= 1000;
    metricUnits = 'km';
  }
  return `${numeral(metricMeasurement).format(metricFormat)} ${metricUnits}`;
}

function getWidthHeight(feature, measurementSystem) {
  const [minX, minY, maxX, maxY] = bbox(feature);
  const width = turfDistance(point([minX, minY]), point([maxX, minY]), { units: 'meters' });
  const height = turfDistance(point([minX, minY]), point([minX, maxY]), { units: 'meters' });

  const isRectangle = feature.properties?.name === 'Rectangle';
  const fArea = turfArea(feature); // in square meters
  const perimeter = isRectangle ?
    2 * (width + height) :
    lineDistance(polygonToLine(polygon(feature.geometry.coordinates))) * 1000;

  const convertUnits = (value, isArea = false) => {
    let formattedValue = value;
    let unit = '';

    if (measurementSystem === 'metric') {
      if (isArea) {
        if (value >= 1000000) {
          formattedValue = value / 1000000;
          unit = 'km²';
        } else {
          unit = 'm²';
        }
      } else if (value >= 1000) {
        formattedValue = value / 1000;
        unit = 'km';
      } else {
        unit = 'm';
      }
    } else if (measurementSystem === 'standard') {
      if (isArea) {
        // Convert m² → acres (1 ac = 4046.8564224 m²)
        formattedValue = value / 4046.8564224;
        unit = 'ac';
      } else {
        // Convert meters → feet
        formattedValue = value * 3.28084;
        if (formattedValue >= 5280) {
          formattedValue /= 5280;
          unit = 'mi';
        } else {
          unit = 'feet';
        }
      }
    }

    const format = formattedValue >= 100 ? '0,0' : '0.00';
    return `${numeral(formattedValue).format(format)} ${unit}`;
  };


  if (feature.properties?.meta === 'radius') {
    const radiusMeters = Math.sqrt(fArea / Math.PI);
    return `Radius: ${convertUnits(radiusMeters)}\n\rPerimeter: ${convertUnits(perimeter)}\n\rArea: ${convertUnits(fArea, true)}`;
  }

  return `Width: ${convertUnits(width)}\n\rHeight: ${convertUnits(height)}\n\rPerimeter: ${convertUnits(perimeter)}\n\rArea: ${convertUnits(fArea, true)}`;
}


// eslint-disable-next-line no-unused-vars
function returnBound(features) {
  if (!features || features.length === 0) return [];

  try {
    let combinedCoordinates = [];

    features.forEach((feature) => {
      const featureCoordinates = feature.geometry.coordinates;
      // Check for Polygon and append the coordinates
      if (featureCoordinates[0] && featureCoordinates[0][0] && featureCoordinates[0][0].length > 2) {
        // eslint-disable-next-line array-callback-return
        featureCoordinates.map((coordinates) => {
          if (coordinates[0] && coordinates[0].length > 2) {
            combinedCoordinates = combinedCoordinates.concat(coordinates[0]);
          } else {
            combinedCoordinates = combinedCoordinates.concat(coordinates);
          }
        });// Check for Linestring
      } else if (featureCoordinates[0] && featureCoordinates[0][0] && featureCoordinates[0][0].length === 2) {
        combinedCoordinates = combinedCoordinates.concat(featureCoordinates[0]);
      } else if (featureCoordinates.length > 2 || (featureCoordinates[0] && featureCoordinates[0].length === 2)) {
        combinedCoordinates = combinedCoordinates.concat(featureCoordinates);
      } else {
        combinedCoordinates = combinedCoordinates.concat([featureCoordinates]);
      } // Check for Point
    });

    return combinedCoordinates && combinedCoordinates.length > 0 && combinedCoordinates.reduce((bounds, coord) => bounds.extend(coord), new LngLatBounds(combinedCoordinates[0], combinedCoordinates[0]));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
  return [];
}
