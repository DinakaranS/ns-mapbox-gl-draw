import ModeInterface from './mode_interface';
import type { DrawContext, ModeObject } from '../types';

const eventMapper: Record<string, string> = {
  drag: 'onDrag',
  click: 'onClick',
  mousemove: 'onMouseMove',
  mousedown: 'onMouseDown',
  mouseup: 'onMouseUp',
  mouseout: 'onMouseOut',
  keyup: 'onKeyUp',
  keydown: 'onKeyDown',
  touchstart: 'onTouchStart',
  touchmove: 'onTouchMove',
  touchend: 'onTouchEnd',
  tap: 'onTap',
};

const eventKeys = Object.keys(eventMapper);

export default function objectToMode(modeObject: ModeObject) {
  const modeObjectKeys = Object.keys(modeObject);

  return function (ctx: DrawContext, startOpts: any = {}) {
    let state: any = {};

    const mode: any = modeObjectKeys.reduce((m: any, k) => {
      m[k] = (modeObject as any)[k];
      return m;
    }, new ModeInterface(ctx));

    function wrapper(eh: string) {
      return (e: any) => mode[eh](state, e);
    }

    return {
      start(this: any) {
        state = mode.onSetup(startOpts);

        eventKeys.forEach((key) => {
          const modeHandler = eventMapper[key];
          let selector = () => false;
          if ((modeObject as any)[modeHandler]) {
            selector = () => true;
          }
          this.on(key, selector, wrapper(modeHandler));
        });
      },
      stop() {
        mode.onStop(state);
      },
      trash() {
        mode.onTrash(state);
      },
      combineFeatures() {
        mode.onCombineFeatures(state);
      },
      uncombineFeatures() {
        mode.onUncombineFeatures(state);
      },
      render(geojson: any, push: (geojson: any) => void) {
        mode.toDisplayFeatures(state, geojson, push);
      },
    };
  };
}
