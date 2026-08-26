import createEvents from './events';
import Store from './store';
import createUI from './ui';
import * as Constants from './constants';
import type { DrawContext, DrawSetup, MapboxMap } from './types';

export default function runSetup(ctx: DrawContext): DrawSetup {
  let controlContainer: HTMLElement | null = null;
  let mapLoadedInterval: ReturnType<typeof setInterval> | null = null;

  const setup: DrawSetup = {
    onRemove() {
      ctx.map.off('load', setup.connect);
      if (mapLoadedInterval) clearInterval(mapLoadedInterval);

      setup.removeLayers();
      ctx.store.restoreMapConfig();
      ctx.ui.removeButtons();
      ctx.events.removeEventListeners();
      ctx.ui.clearMapClasses();
      if (ctx.boxZoomInitial) ctx.map.boxZoom.enable();
      (ctx as any).map = null;
      (ctx as any).container = null;
      (ctx as any).store = null;

      if (controlContainer && controlContainer.parentNode) {
        controlContainer.parentNode.removeChild(controlContainer);
      }
      controlContainer = null;
    },
    connect() {
      ctx.map.off('load', setup.connect);
      if (mapLoadedInterval) clearInterval(mapLoadedInterval);
      setup.addLayers();
      ctx.store.storeMapConfig();
      ctx.events.addEventListeners();
    },
    onAdd(map: MapboxMap) {
      ctx.map = map;
      ctx.events = createEvents(ctx);
      ctx.ui = createUI(ctx);
      ctx.container = map.getContainer();
      ctx.store = new Store(ctx);

      controlContainer = ctx.ui.addButtons();

      if (ctx.options.boxSelect) {
        ctx.boxZoomInitial = map.boxZoom.isEnabled();
        map.boxZoom.disable();
        const dragPanIsEnabled = map.dragPan.isEnabled();
        map.dragPan.disable();
        map.dragPan.enable();
        if (!dragPanIsEnabled) {
          map.dragPan.disable();
        }
      }

      if (map.loaded()) {
        setup.connect();
      } else {
        map.on('load', setup.connect);
        mapLoadedInterval = setInterval(() => {
          if (map.loaded()) setup.connect();
        }, 16);
      }

      ctx.events.start();
      return controlContainer;
    },
    addLayers() {
      ctx.map.addSource(Constants.sources.COLD, {
        data: {
          type: Constants.geojsonTypes.FEATURE_COLLECTION,
          features: [],
        },
        type: 'geojson',
      });

      ctx.map.addSource(Constants.sources.HOT, {
        data: {
          type: Constants.geojsonTypes.FEATURE_COLLECTION,
          features: [],
        },
        type: 'geojson',
      });

      ctx.options.styles.forEach((style: any) => {
        ctx.map.addLayer(style);
      });

      ctx.store.setDirty();
      ctx.store.render();
    },
    removeLayers() {
      ctx.options.styles.forEach((style: any) => {
        if (ctx.map.getLayer(style.id)) {
          ctx.map.removeLayer(style.id);
        }
      });

      if (ctx.map.getSource(Constants.sources.COLD)) {
        ctx.map.removeSource(Constants.sources.COLD);
      }

      if (ctx.map.getSource(Constants.sources.HOT)) {
        ctx.map.removeSource(Constants.sources.HOT);
      }
    },
  };

  ctx.setup = setup;
  return setup;
}
