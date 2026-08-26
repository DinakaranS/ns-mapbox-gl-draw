interface ModeContext {
  map: any;
  _ctx: any;
}

const doubleClickZoom = {
  enable(ctx: ModeContext): void {
    setTimeout(() => {
      if (!ctx.map || !ctx.map.doubleClickZoom || !ctx._ctx?.store?.getInitialConfigValue) return;
      if (!ctx._ctx.store.getInitialConfigValue('doubleClickZoom')) return;
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
  disable(ctx: ModeContext): void {
    setTimeout(() => {
      if (!ctx.map || !ctx.map.doubleClickZoom) return;
      ctx.map.doubleClickZoom.disable();
    }, 0);
  },
};

export default doubleClickZoom;
