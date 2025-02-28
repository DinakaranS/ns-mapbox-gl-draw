import lineDistance from '@turf/length';
import numeral from 'numeral';
import distance from '@turf/distance';
import {polygonToLine} from '@turf/polygon-to-line';
import {point, polygon} from '@turf/helpers';
import area from '@turf/area';
import {LngLatBounds} from 'mapbox-gl';

export default function (feature) {
  try {
    const drawnLength = (lineDistance(feature) * 1000); // meters
    const drawnArea = area(feature); // square meters

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
  const bounds = returnBound([feature]);
  const fArea = area(feature);
  const poly = polygon(feature.geometry.coordinates);
  const newline = polygonToLine(poly);
  const lengthCalc = lineDistance(newline) * 1000;

  const topLeft = point([bounds._ne.lng, bounds._ne.lat]);
  const topRight = point([bounds._sw.lng, bounds._ne.lat]);
  const bottomLeft = point([bounds._ne.lng, bounds._sw.lat]);
  const bottomRight = point([bounds._sw.lng, bounds._sw.lat]);

  const options = 'miles';
  const distanceWidth = distance(bottomLeft, bottomRight, options);
  const distanceHeight = distance(topLeft, bottomLeft, options);

  let rectangleFlag1 = false;
  let rectangleFlag2 = false;
  let rectangleFlag3 = false;
  let rectangleFlag4 = false;

  if (feature.geometry && Object.keys(feature.properties).length === 0) {
    if (feature.geometry.coordinates) {
      if (feature.geometry.coordinates[0] && !feature.geometry.coordinates[1]) {
        if (feature.geometry.coordinates[0].length === 6) {
          if (feature.geometry.coordinates[0][0][0] === feature.geometry.coordinates[0][3][0] && feature.geometry.coordinates[0][3][0] === feature.geometry.coordinates[0][4][0] && feature.geometry.coordinates[0][4][0] === feature.geometry.coordinates[0][5][0]) {
            rectangleFlag1 = true;
          }
          if (feature.geometry.coordinates[0][0][1] === feature.geometry.coordinates[0][1][1] && feature.geometry.coordinates[0][1][1] === feature.geometry.coordinates[0][4][1] && feature.geometry.coordinates[0][4][1] === feature.geometry.coordinates[0][5][1]) {
            rectangleFlag2 = true;
          }
          if (feature.geometry.coordinates[0][1][0] === feature.geometry.coordinates[0][2][0]) {
            rectangleFlag3 = true;
          }
          if (feature.geometry.coordinates[0][2][1] === feature.geometry.coordinates[0][3][1]) {
            rectangleFlag4 = true;
          }
        }
      }
    }
  }

  if (feature.properties &&
    feature.properties.name === 'Rectangle') {
    rectangleFlag1 = true;
    rectangleFlag2 = true;
    rectangleFlag3 = true;
    rectangleFlag4 = true;
  }

  if (measurementSystem === 'standard') {
    if (feature.properties.meta === 'radius') {
      return `Radius: ${unitTransformation(Math.sqrt((fArea * 10.764) / Math.PI), measurementSystem)} \n\r Perimeter: ${unitTransformation((rectangleFlag1 && rectangleFlag2 && rectangleFlag3 && rectangleFlag4 ? (((distanceWidth * 5280) + (distanceHeight * 5280)) * 2) : lengthCalc * 3.28084), measurementSystem)} \n\r Area: ${rectangleFlag1 && rectangleFlag2 && rectangleFlag3 && rectangleFlag4 ? unitTransformation(((distanceWidth * 5280) * (distanceHeight * 5280)), measurementSystem, true) : unitTransformation(fArea * 10.764, measurementSystem, true)}`;
    }

    return `Width: ${unitTransformation(distanceWidth * 5280, measurementSystem)} \n\r Height: ${unitTransformation(distanceHeight * 5280, measurementSystem)} \n\r Perimeter: ${unitTransformation((rectangleFlag1 && rectangleFlag2 && rectangleFlag3 && rectangleFlag4 ? (((distanceWidth * 5280) + (distanceHeight * 5280)) * 2) : lengthCalc * 3.28084), measurementSystem)} \n\r Area: ${rectangleFlag1 && rectangleFlag2 && rectangleFlag3 && rectangleFlag4 ? unitTransformation(((distanceWidth * 5280) * (distanceHeight * 5280)), measurementSystem, true) : unitTransformation(fArea * 10.764, measurementSystem, true)}`;
  }

  if (feature.properties.meta === 'radius') {
    return `Radius: ${unitTransformation(Math.sqrt(fArea / Math.PI), measurementSystem)} \n\r Perimeter: ${unitTransformation((rectangleFlag1 && rectangleFlag2 && rectangleFlag3 && rectangleFlag4 ? (((distanceWidth * 1609.344) + (distanceHeight * 1609.344)) * 2) : lengthCalc), measurementSystem)} \n\r Area: ${rectangleFlag1 && rectangleFlag2 && rectangleFlag3 && rectangleFlag4 ? unitTransformation(((distanceWidth * 1609.344) * (distanceHeight * 1609.344)), measurementSystem, true) : unitTransformation(fArea, measurementSystem, true)}`;
  }

  return `Width: ${unitTransformation(distanceWidth * 1609.344, measurementSystem)} \n\r Height: ${unitTransformation(distanceHeight * 1609.344, measurementSystem)} \n\r Perimeter: ${unitTransformation((rectangleFlag1 && rectangleFlag2 && rectangleFlag3 && rectangleFlag4 ? (((distanceWidth * 1609.344) + (distanceHeight * 1609.344)) * 2) : lengthCalc), measurementSystem)} \n\r Area: ${rectangleFlag1 && rectangleFlag2 && rectangleFlag3 && rectangleFlag4 ? unitTransformation(((distanceWidth * 1609.344) * (distanceHeight * 1609.344)), measurementSystem, true) : unitTransformation(fArea, measurementSystem, true)}`;
}

function returnBound(features) {
  if (!features || features.length === 0) return [];

  try {
    let combinedCoordinates = [];

    features.forEach((feature) => {
      const featureCoordinates = feature.geometry.coordinates;
      // Check for Polygon and append the coordinates
      if (featureCoordinates[0] && featureCoordinates[0][0] && featureCoordinates[0][0].length > 2) {
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
    console.log(e);
  }
  return [];
}
