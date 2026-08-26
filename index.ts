import runSetup from './src/setup';
import setupOptions from './src/options';
import setupAPI from './src/api';
import modes from './src/modes/index';
import * as Constants from './src/constants';
import * as lib from './src/lib/index';
import type { DrawContext, DrawOptions, MapboxMap, DrawAPI } from './src/types';

export type {
  DrawContext,
  DrawOptions,
  MapboxMap,
  DrawAPI,
  DrawEvent,
  DrawFeatureInstance,
  DrawStore,
  DrawEvents,
  DrawUI,
  DrawSetup,
  ModeObject,
  ModeOpts,
  MeasurementResult,
  Delta,
  ActionState,
  SilentOptions,
  SelectedCoordinate,
  DrawControls,
} from './src/types';

const setupDraw = function (options: Partial<DrawOptions>, api: any) {
  const opts = setupOptions(options);

  const ctx: Partial<DrawContext> = {
    options: opts,
  };

  api = setupAPI(ctx as DrawContext, api);
  (ctx as DrawContext).api = api;

  const setup = runSetup(ctx as DrawContext);

  api.onAdd = setup.onAdd;
  api.onRemove = setup.onRemove;
  api.types = Constants.types;
  api.options = opts;

  return api;
};

function MapboxDraw(this: any, options?: Partial<DrawOptions>) {
  setupDraw(options || {}, this);
}

(MapboxDraw as any).modes = modes;
(MapboxDraw as any).constants = Constants;
(MapboxDraw as any).lib = lib;

export default MapboxDraw;
export { modes, Constants as constants, lib };
