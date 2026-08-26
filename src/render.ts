import * as Constants from './constants';

export default function render(this: any): void {
  // `render` is invoked as a Store method, so `this` is the store. The alias is
  // deliberate and used throughout, including by the nested `cleanup()` closure.
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const store = this;
  const mapExists = store.ctx.map && store.ctx.map.getSource(Constants.sources.HOT) !== undefined;
  if (!mapExists) return cleanup();

  const mode = store.ctx.events.currentModeName();

  store.ctx.ui.queueMapClasses({ mode });

  let newHotIds: string[] = [];
  let newColdIds: string[];

  if (store.isDirty) {
    newColdIds = store.getAllIds();
  } else {
    newHotIds = store.getChangedIds().filter((id: string) => store.get(id) !== undefined);
    newColdIds = store.sources.hot
      .filter(
        (geojson: any) =>
          geojson.properties.id &&
          newHotIds.indexOf(geojson.properties.id) === -1 &&
          store.get(geojson.properties.id) !== undefined,
      )
      .map((geojson: any) => geojson.properties.id);
  }

  store.sources.hot = [];
  const lastColdCount = store.sources.cold.length;
  store.sources.cold = store.isDirty
    ? []
    : store.sources.cold.filter((geojson: any) => {
        const id = geojson.properties.id || geojson.properties.parent;
        return newHotIds.indexOf(id) === -1;
      });

  const coldChanged = lastColdCount !== store.sources.cold.length || newColdIds.length > 0;
  newHotIds.forEach((id) => renderFeature(id, 'hot'));
  newColdIds.forEach((id) => renderFeature(id, 'cold'));

  function renderFeature(id: string, source: 'hot' | 'cold') {
    const feature = store.get(id);
    const featureInternal = feature.internal(mode);
    store.ctx.events.currentModeRender(featureInternal, (geojson: any) => {
      geojson.properties.mode = mode;
      store.sources[source].push(geojson);
    });
  }

  if (coldChanged) {
    store.ctx.map.getSource(Constants.sources.COLD).setData({
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: store.sources.cold,
    });
  }

  store.ctx.map.getSource(Constants.sources.HOT).setData({
    type: Constants.geojsonTypes.FEATURE_COLLECTION,
    features: store.sources.hot,
  });

  cleanup();

  function cleanup() {
    store.isDirty = false;
    store.clearChangedIds();
  }
}
