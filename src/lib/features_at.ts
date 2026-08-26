import sortFeatures from './sort_features';
import mapEventToBoundingBox from './map_event_to_bounding_box';
import * as Constants from '../constants';
import StringSet from './string_set';
import type { DrawContext, DrawEvent } from '../types';

const META_TYPES = [Constants.meta.FEATURE, Constants.meta.MIDPOINT, Constants.meta.VERTEX];

function featuresAtClick(event: DrawEvent | null, bbox: any, ctx: DrawContext): any[] {
  return featuresAt(event, bbox, ctx, ctx.options.clickBuffer);
}

function featuresAtTouch(event: DrawEvent | null, bbox: any, ctx: DrawContext): any[] {
  return featuresAt(event, bbox, ctx, ctx.options.touchBuffer);
}

function featuresAt(event: DrawEvent | null, bbox: any, ctx: DrawContext, buffer: number): any[] {
  if (ctx.map === null) return [];

  const box = event ? mapEventToBoundingBox(event, buffer) : bbox;
  const queryParams: any = {};

  if (ctx.options.styles) {
    queryParams.layers = ctx.options.styles
      .map((s: any) => s.id)
      .filter((id: string) => ctx.map.getLayer(id) != null);
  }

  const features = ctx.map
    .queryRenderedFeatures(box, queryParams)
    .filter((feature: any) => META_TYPES.indexOf(feature.properties.meta) !== -1);

  const featureIds = new StringSet();
  const uniqueFeatures: any[] = [];
  features.forEach((feature: any) => {
    const featureId = feature.properties.id;
    if (featureIds.has(featureId)) return;
    featureIds.add(featureId);
    uniqueFeatures.push(feature);
  });

  return sortFeatures(uniqueFeatures);
}

export default {
  click: featuresAtClick,
  touch: featuresAtTouch,
};
