import isEqual from 'fast-deep-equal';
import normalize from '@mapbox/geojson-normalize';
import { generateID } from './lib/id';
import featuresAt from './lib/features_at';
import stringSetsAreEqual from './lib/string_sets_are_equal';
import * as Constants from './constants';
import StringSet from './lib/string_set';
import Polygon from './feature_types/polygon';
import LineString from './feature_types/line_string';
import Point from './feature_types/point';
import MultiFeature from './feature_types/multi_feature';
import type { DrawContext, DrawAPI } from './types';

const featureTypes: Record<string, any> = {
  Polygon,
  LineString,
  Point,
  MultiPolygon: MultiFeature,
  MultiLineString: MultiFeature,
  MultiPoint: MultiFeature,
};

export default function setupAPI(ctx: DrawContext, api: any): DrawAPI {
  api.modes = Constants.modes;

  const silent =
    ctx.options.suppressAPIEvents !== undefined ? !!ctx.options.suppressAPIEvents : true;

  api.getFeatureIdsAt = function (point: { x: number; y: number }) {
    const features = featuresAt.click({ point } as any, null, ctx);
    return features.map((feature: any) => feature.properties.id);
  };

  api.getSelectedIds = function () {
    return ctx.store.getSelectedIds();
  };

  api.getSelected = function () {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: ctx.store
        .getSelectedIds()
        .map((id) => ctx.store.get(id))
        .map((feature) => feature!.toGeoJSON()),
    };
  };

  api.getSelectedPoints = function () {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: ctx.store.getSelectedCoordinates().map((coordinate) => ({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
          type: Constants.geojsonTypes.POINT,
          coordinates: coordinate.coordinates,
        },
      })),
    };
  };

  api.set = function (featureCollection: any) {
    if (
      featureCollection.type === undefined ||
      featureCollection.type !== Constants.geojsonTypes.FEATURE_COLLECTION ||
      !Array.isArray(featureCollection.features)
    ) {
      throw new Error('Invalid FeatureCollection');
    }
    const renderBatch = ctx.store.createRenderBatch();
    let toDelete = ctx.store.getAllIds().slice();
    const newIds = api.add(featureCollection);
    const newIdsLookup = new StringSet(newIds);

    toDelete = toDelete.filter((id: string) => !newIdsLookup.has(id));
    if (toDelete.length) {
      api.delete(toDelete);
    }

    renderBatch();
    return newIds;
  };

  api.add = function (geojson: any) {
    const featureCollection = JSON.parse(JSON.stringify(normalize(geojson)));

    const ids = featureCollection.features.map((feature: any) => {
      feature.id = feature.id || generateID();

      if (feature.geometry === null) {
        throw new Error('Invalid geometry: null');
      }

      if (
        ctx.store.get(feature.id) === undefined ||
        ctx.store.get(feature.id)!.type !== feature.geometry.type
      ) {
        const Model = featureTypes[feature.geometry.type];
        if (Model === undefined) {
          throw new Error(`Invalid geometry type: ${feature.geometry.type}.`);
        }
        const internalFeature = new Model(ctx, feature);
        ctx.store.add(internalFeature, { silent });
      } else {
        const internalFeature = ctx.store.get(feature.id)!;
        const originalProperties = internalFeature.properties;
        internalFeature.properties = feature.properties;
        if (!isEqual(originalProperties, feature.properties)) {
          ctx.store.featureChanged(internalFeature.id, { silent });
        }
        if (!isEqual(internalFeature.getCoordinates(), feature.geometry.coordinates)) {
          internalFeature.incomingCoords(feature.geometry.coordinates);
        }
      }
      return feature.id;
    });

    ctx.store.render();
    return ids;
  };

  api.get = function (id: string) {
    const feature = ctx.store.get(id);
    if (feature) {
      return feature.toGeoJSON();
    }
  };

  api.getAll = function () {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: ctx.store.getAll().map((feature) => feature.toGeoJSON()),
    };
  };

  api.delete = function (featureIds: string | string[]) {
    ctx.store.delete(featureIds, { silent });
    if (api.getMode() === Constants.modes.DIRECT_SELECT && !ctx.store.getSelectedIds().length) {
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, undefined, { silent });
    } else {
      ctx.store.render();
    }
    return api;
  };

  api.deleteAll = function () {
    ctx.store.delete(ctx.store.getAllIds(), { silent });
    if (api.getMode() === Constants.modes.DIRECT_SELECT) {
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, undefined, { silent });
    } else {
      ctx.store.render();
    }
    return api;
  };

  api.changeMode = function (mode: string, modeOptions: any = {}) {
    if (mode === Constants.modes.SIMPLE_SELECT && api.getMode() === Constants.modes.SIMPLE_SELECT) {
      if (stringSetsAreEqual(modeOptions.featureIds || [], ctx.store.getSelectedIds())) return api;
      ctx.store.setSelected(modeOptions.featureIds, { silent });
      ctx.store.render();
      return api;
    }

    if (
      mode === Constants.modes.DIRECT_SELECT &&
      api.getMode() === Constants.modes.DIRECT_SELECT &&
      modeOptions.featureId === ctx.store.getSelectedIds()[0]
    ) {
      return api;
    }

    ctx.events.changeMode(mode, modeOptions, { silent });
    return api;
  };

  api.getMode = function () {
    return ctx.events.getMode();
  };

  api.trash = function () {
    ctx.events.trash({ silent });
    return api;
  };

  api.combineFeatures = function () {
    ctx.events.combineFeatures();
    return api;
  };

  api.uncombineFeatures = function () {
    ctx.events.uncombineFeatures();
    return api;
  };

  api.setFeatureProperty = function (featureId: string, property: string, value: any) {
    ctx.store.setFeatureProperty(featureId, property, value, { silent });
    return api;
  };

  return api;
}
