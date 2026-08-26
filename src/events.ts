import setupModeHandler from './lib/mode_handler';
import getFeaturesAndSetCursor from './lib/get_features_and_set_cursor';
import * as CommonSelectors from './lib/common_selectors';
import featuresAt from './lib/features_at';
import isClick from './lib/is_click';
import isTap from './lib/is_tap';
import * as Constants from './constants';
import objectToMode from './modes/object_to_mode';
import type {
  DrawContext,
  DrawEvents,
  DrawEvent,
  ActionState,
  SilentOptions,
  ModeHandler,
  EventInfo,
} from './types';

export default function createEvents(ctx: DrawContext): DrawEvents {
  const modes: Record<string, (ctx: DrawContext, opts?: any) => any> = Object.keys(
    ctx.options.modes,
  ).reduce(
    (m: Record<string, any>, k) => {
      m[k] = objectToMode(ctx.options.modes[k]);
      return m;
    },
    {} as Record<string, any>,
  );

  let mouseDownInfo: Partial<EventInfo> = {};
  let touchStartInfo: Partial<EventInfo> = {};
  const events: Record<string, any> = {};
  let currentModeName: string | null = null;
  let currentMode: ModeHandler | null = null;

  events.drag = function (event: DrawEvent, isDrag: (endInfo: EventInfo) => boolean) {
    if (isDrag({ point: event.point, time: new Date().getTime() })) {
      ctx.ui.queueMapClasses({ mouse: Constants.cursors.DRAG });
      currentMode!.drag(event);
    } else {
      event.originalEvent.stopPropagation();
    }
  };

  events.mousedrag = function (event: DrawEvent) {
    events.drag(event, (endInfo: EventInfo) => !isClick(mouseDownInfo, endInfo));
  };

  events.touchdrag = function (event: DrawEvent) {
    events.drag(event, (endInfo: EventInfo) => !isTap(touchStartInfo, endInfo));
  };

  events.mousemove = function (event: DrawEvent) {
    const button =
      (event.originalEvent as MouseEvent).buttons !== undefined
        ? (event.originalEvent as MouseEvent).buttons
        : (event.originalEvent as MouseEvent).which;
    if (button === 1) {
      return events.mousedrag(event);
    }
    const target = getFeaturesAndSetCursor(event, ctx);
    event.featureTarget = target;
    currentMode!.mousemove(event);
  };

  events.mousedown = function (event: DrawEvent) {
    mouseDownInfo = { time: new Date().getTime(), point: event.point };
    const target = getFeaturesAndSetCursor(event, ctx);
    event.featureTarget = target;
    currentMode!.mousedown(event);
  };

  events.mouseup = function (event: DrawEvent) {
    const target = getFeaturesAndSetCursor(event, ctx);
    event.featureTarget = target;

    if (isClick(mouseDownInfo, { point: event.point, time: new Date().getTime() })) {
      currentMode!.click(event);
    } else {
      currentMode!.mouseup(event);
    }
  };

  events.mouseout = function (event: DrawEvent) {
    currentMode!.mouseout(event);
  };

  events.touchstart = function (event: DrawEvent) {
    if (!ctx.options.touchEnabled) return;

    touchStartInfo = { time: new Date().getTime(), point: event.point };
    const target = featuresAt.touch(event, null, ctx)[0];
    event.featureTarget = target;
    currentMode!.touchstart(event);
  };

  events.touchmove = function (event: DrawEvent) {
    if (!ctx.options.touchEnabled) return;

    currentMode!.touchmove(event);
    return events.touchdrag(event);
  };

  events.touchend = function (event: DrawEvent) {
    event.originalEvent.preventDefault();
    if (!ctx.options.touchEnabled) return;

    const target = featuresAt.touch(event, null, ctx)[0];
    event.featureTarget = target;
    if (isTap(touchStartInfo, { time: new Date().getTime(), point: event.point })) {
      currentMode!.tap(event);
    } else {
      currentMode!.touchend(event);
    }
  };

  const isKeyModeValid = (event: DrawEvent) =>
    !(
      CommonSelectors.isBackspaceKey(event) ||
      CommonSelectors.isDeleteKey(event) ||
      CommonSelectors.isDigitKey(event)
    );

  events.keydown = function (event: DrawEvent) {
    const isMapElement = ((event as any).srcElement || (event as any).target).classList.contains(
      Constants.classes.CANVAS,
    );
    if (!isMapElement) return;

    if (
      (CommonSelectors.isBackspaceKey(event) || CommonSelectors.isDeleteKey(event)) &&
      ctx.options.controls.trash
    ) {
      (event as any).preventDefault();
      currentMode!.trash();
    } else if (isKeyModeValid(event)) {
      currentMode!.keydown(event);
    } else if (CommonSelectors.isDigit1Key(event) && ctx.options.controls.point) {
      changeMode(Constants.modes.DRAW_POINT);
    } else if (CommonSelectors.isDigit2Key(event) && ctx.options.controls.line_string) {
      changeMode(Constants.modes.DRAW_LINE_STRING);
    } else if (CommonSelectors.isDigit3Key(event) && ctx.options.controls.polygon) {
      changeMode(Constants.modes.DRAW_POLYGON);
    }
  };

  events.keyup = function (event: DrawEvent) {
    if (isKeyModeValid(event)) {
      currentMode!.keyup(event);
    }
  };

  events.zoomend = function () {
    ctx.store.changeZoom();
  };

  events.data = function (event: any) {
    if (event.dataType === 'style') {
      const { setup, map, options, store } = ctx;
      const hasLayers = options.styles.some((style: any) => map.getLayer(style.id));
      if (!hasLayers) {
        setup.addLayers();
        store.setDirty();
        store.render();
      }
    }
  };

  function changeMode(modename: string, nextModeOptions?: any, eventOptions: SilentOptions = {}) {
    currentMode!.stop();

    const modebuilder = modes[modename];
    if (modebuilder === undefined) {
      throw new Error(`${modename} is not valid`);
    }
    currentModeName = modename;
    const mode = modebuilder(ctx, nextModeOptions);
    currentMode = setupModeHandler(mode, ctx);

    if (!eventOptions.silent) {
      ctx.map.fire(Constants.events.MODE_CHANGE, { mode: modename });
    }

    ctx.store.setDirty();
    ctx.store.render();
  }

  const actionState: ActionState = {
    trash: false,
    combineFeatures: false,
    uncombineFeatures: false,
  };

  function actionable(actions: ActionState) {
    let changed = false;
    (Object.keys(actions) as (keyof ActionState)[]).forEach((action) => {
      if ((actionState as any)[action] === undefined) throw new Error('Invalid action type');
      if ((actionState as any)[action] !== (actions as any)[action]) changed = true;
      (actionState as any)[action] = (actions as any)[action];
    });
    if (changed) ctx.map.fire(Constants.events.ACTIONABLE, { actions: actionState });
  }

  const api: DrawEvents = {
    start() {
      currentModeName = ctx.options.defaultMode;
      currentMode = setupModeHandler(modes[currentModeName!](ctx), ctx);
    },
    changeMode,
    actionable,
    currentModeName() {
      return currentModeName!;
    },
    currentModeRender(geojson: any, push: (geojson: any) => void) {
      return currentMode!.render(geojson, push);
    },
    fire(eventName: string, eventData?: any) {
      if (!ctx.map) return;
      ctx.map.fire(eventName, eventData);
    },
    addEventListeners() {
      ctx.map.on('mousemove', events.mousemove);
      ctx.map.on('mousedown', events.mousedown);
      ctx.map.on('mouseup', events.mouseup);
      ctx.map.on('data', events.data);
      ctx.map.on('touchmove', events.touchmove);
      ctx.map.on('touchstart', events.touchstart);
      ctx.map.on('touchend', events.touchend);

      ctx.container.addEventListener('mouseout', events.mouseout);

      if (ctx.options.keybindings) {
        ctx.container.addEventListener('keydown', events.keydown);
        ctx.container.addEventListener('keyup', events.keyup);
      }
    },
    removeEventListeners() {
      ctx.map.off('mousemove', events.mousemove);
      ctx.map.off('mousedown', events.mousedown);
      ctx.map.off('mouseup', events.mouseup);
      ctx.map.off('data', events.data);
      ctx.map.off('touchmove', events.touchmove);
      ctx.map.off('touchstart', events.touchstart);
      ctx.map.off('touchend', events.touchend);

      ctx.container.removeEventListener('mouseout', events.mouseout);

      if (ctx.options.keybindings) {
        ctx.container.removeEventListener('keydown', events.keydown);
        ctx.container.removeEventListener('keyup', events.keyup);
      }
    },
    trash(options?: SilentOptions) {
      currentMode!.trash();
    },
    combineFeatures() {
      currentMode!.combineFeatures();
    },
    uncombineFeatures() {
      currentMode!.uncombineFeatures();
    },
    getMode() {
      return currentModeName!;
    },
  };

  return api;
}
