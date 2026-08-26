import lineDistance from '@turf/length';
import numeral from 'numeral';
import { distance as turfDistance } from '@turf/distance';
import { polygonToLine } from '@turf/polygon-to-line';
import { point, polygon } from '@turf/helpers';
import { area as turfArea } from '@turf/area';
import { bbox } from '@turf/bbox';
import type { MeasurementResult } from '../types';

const SQ_METERS_TO_SQ_FEET = 10.7639104;
const SQ_FEET_PER_ACRE = 43560;

function formatValue(value: number, format: string, unit: string): string {
  return `${numeral(value).format(format)} ${unit}`;
}

/**
 * Imperial area is reported as acres *and* square feet \u2014 "1.23 ac (53,578.80 ft\u00B2)" \u2014
 * so the square footage is always visible regardless of how large the feature is.
 * Non-breaking spaces keep each number glued to its unit when the label wraps.
 */
function formatStandardArea(areaSqMeters: number): string {
  const areaInSquareFeet = areaSqMeters * SQ_METERS_TO_SQ_FEET;
  const acres = `${numeral(areaInSquareFeet / SQ_FEET_PER_ACRE).format('0.00')}\u00A0ac`;
  const squareFeet = `${numeral(areaInSquareFeet).format('0,0.00')}\u00A0ft\u00B2`;
  return `${acres}\u00A0(${squareFeet})`;
}

function convertUnits(value: number, measurementSystem: string, isArea = false): string {
  let formattedValue = value;
  let unit = '';

  if (measurementSystem === 'metric') {
    if (isArea) {
      if (value >= 1000000) {
        formattedValue = value / 1000000;
        unit = 'km\u00B2';
      } else {
        unit = 'm\u00B2';
      }
    } else if (value >= 1000) {
      formattedValue = value / 1000;
      unit = 'km';
    } else {
      unit = 'm';
    }
  } else if (measurementSystem === 'standard') {
    if (isArea) {
      return formatStandardArea(value);
    }
    formattedValue = value * 3.28084;
    if (formattedValue >= 5280) {
      formattedValue /= 5280;
      unit = 'mi';
    } else {
      unit = 'feet';
    }
  }

  const format = formattedValue >= 100 ? '0,0' : '0.00';
  return formatValue(formattedValue, format, unit);
}

function getWidthHeight(feature: any, measurementSystem: string): string {
  const [minX, minY, maxX, maxY] = bbox(feature);
  const width = turfDistance(point([minX, minY]), point([maxX, minY]), { units: 'meters' });
  const height = turfDistance(point([minX, minY]), point([minX, maxY]), { units: 'meters' });

  const isRectangle = feature.properties?.name === 'Rectangle';
  const fArea = turfArea(feature);
  const perimeter = isRectangle
    ? 2 * (width + height)
    : (lineDistance as any)(polygonToLine(polygon(feature.geometry.coordinates))) * 1000;

  if (feature.properties?.meta === 'radius') {
    const radiusMeters = Math.sqrt(fArea / Math.PI);
    return `Radius: ${convertUnits(radiusMeters, measurementSystem)}\n\rPerimeter: ${convertUnits(perimeter, measurementSystem)}\n\rArea: ${convertUnits(fArea, measurementSystem, true)}`;
  }

  return `Width: ${convertUnits(width, measurementSystem)}\n\rHeight: ${convertUnits(height, measurementSystem)}\n\rPerimeter: ${convertUnits(perimeter, measurementSystem)}\n\rArea: ${convertUnits(fArea, measurementSystem, true)}`;
}

export default function createDistance(feature: any): MeasurementResult {
  try {
    const drawnLength = (lineDistance as any)(feature) * 1000;
    const drawnArea = turfArea(feature);

    let metricUnits = 'm';
    let metricFormat = '0,0';
    let metricMeasurement = drawnLength;

    let standardUnits = 'feet';
    let standardFormat = '0,0';
    let standardMeasurement = drawnLength * 3.28084;

    if (drawnLength > drawnArea) {
      if (drawnLength >= 1000) {
        metricMeasurement = drawnLength / 1000;
        metricUnits = 'km';
        metricFormat = '0.00';
      }
      if (standardMeasurement >= 5280) {
        standardMeasurement /= 5280;
        standardUnits = 'mi';
        standardFormat = '0.00';
      }
    } else {
      metricUnits = 'm\u00B2';
      metricFormat = '0,0';
      metricMeasurement = drawnArea;
      standardUnits = 'ft\u00B2';
      standardFormat = '0,0';
      standardMeasurement = drawnArea * 10.7639;

      if (drawnArea >= 1000000) {
        metricMeasurement = drawnArea / 1000000;
        metricUnits = 'km\u00B2';
        metricFormat = '0.00';
      }
      if (standardMeasurement >= 27878400) {
        standardMeasurement /= 27878400;
        standardUnits = 'mi\u00B2';
        standardFormat = '0.00';
      }
    }

    if (feature.properties?.name === 'Rectangle') {
      return {
        metric: getWidthHeight(feature, 'metric'),
        standard: getWidthHeight(feature, 'standard'),
      };
    }

    const isLine =
      (drawnLength > drawnArea || drawnArea === 0) &&
      (feature.geometry.type === 'LineString' || feature.geometry.type === 'Point');

    return {
      metric: isLine
        ? formatValue(metricMeasurement, metricFormat, metricUnits)
        : getWidthHeight(feature, 'metric'),
      standard: isLine
        ? formatValue(standardMeasurement, standardFormat, standardUnits)
        : getWidthHeight(feature, 'standard'),
    };
  } catch {
    return { metric: '', standard: '' };
  }
}
