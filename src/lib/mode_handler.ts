import type { DrawContext, ModeHandler as ModeHandlerType, DrawEvent } from '../types';

type EventName =
  | 'drag'
  | 'click'
  | 'mousemove'
  | 'mousedown'
  | 'mouseup'
  | 'mouseout'
  | 'keydown'
  | 'keyup'
  | 'touchstart'
  | 'touchmove'
  | 'touchend'
  | 'tap';

interface Handler {
  selector: (event: DrawEvent) => boolean;
  fn: (this: any, event: DrawEvent) => boolean | void;
}

const ModeHandler = function (mode: any, DrawContext: DrawContext): ModeHandlerType {
  const handlers: Record<EventName, Handler[]> = {
    drag: [],
    click: [],
    mousemove: [],
    mousedown: [],
    mouseup: [],
    mouseout: [],
    keydown: [],
    keyup: [],
    touchstart: [],
    touchmove: [],
    touchend: [],
    tap: [],
  };

  const ctx = {
    on(
      event: EventName,
      selector: (event: DrawEvent) => boolean,
      fn: (event: DrawEvent) => boolean | void,
    ) {
      if (handlers[event] === undefined) {
        throw new Error(`Invalid event type: ${event}`);
      }
      handlers[event].push({ selector, fn });
    },
    render(id: string) {
      DrawContext.store.featureChanged(id);
    },
  };

  const delegate = function (eventName: EventName, event: DrawEvent) {
    const handles = handlers[eventName];
    let iHandle = handles.length;
    while (iHandle--) {
      const handle = handles[iHandle];
      if (handle.selector(event)) {
        const skipRender = handle.fn.call(ctx, event);
        if (!skipRender) {
          DrawContext.store.render();
        }
        DrawContext.ui.updateMapClasses();
        break;
      }
    }
  };

  mode.start.call(ctx);

  return {
    render: mode.render,
    stop() {
      if (mode.stop) mode.stop();
    },
    trash() {
      if (mode.trash) {
        mode.trash();
        DrawContext.store.render();
      }
    },
    combineFeatures() {
      if (mode.combineFeatures) mode.combineFeatures();
    },
    uncombineFeatures() {
      if (mode.uncombineFeatures) mode.uncombineFeatures();
    },
    drag(event) {
      delegate('drag', event);
    },
    click(event) {
      delegate('click', event);
    },
    mousemove(event) {
      delegate('mousemove', event);
    },
    mousedown(event) {
      delegate('mousedown', event);
    },
    mouseup(event) {
      delegate('mouseup', event);
    },
    mouseout(event) {
      delegate('mouseout', event);
    },
    keydown(event) {
      delegate('keydown', event);
    },
    keyup(event) {
      delegate('keyup', event);
    },
    touchstart(event) {
      delegate('touchstart', event);
    },
    touchmove(event) {
      delegate('touchmove', event);
    },
    touchend(event) {
      delegate('touchend', event);
    },
    tap(event) {
      delegate('tap', event);
    },
  };
};

export default ModeHandler;
