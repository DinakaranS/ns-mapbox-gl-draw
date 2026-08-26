import * as Constants from '../constants';
import featuresAt from '../lib/features_at';
import Point from '../feature_types/point';
import LineString from '../feature_types/line_string';
import Polygon from '../feature_types/polygon';
import MultiFeature from '../feature_types/multi_feature';
import type { DrawContext, DrawFeatureInstance, SelectedCoordinate } from '../types';

export default class ModeInterface {
  map: any;
  drawConfig: any;
  _ctx: DrawContext;

  constructor(ctx: DrawContext) {
    this.map = ctx.map;
    this.drawConfig = JSON.parse(JSON.stringify(ctx.options || {}));
    this._ctx = ctx;
  }

  setSelected(features: string | string[]) {
    return this._ctx.store.setSelected(features);
  }

  setSelectedCoordinates(coords: SelectedCoordinate[]) {
    this._ctx.store.setSelectedCoordinates(coords);
    coords.reduce(
      (m: Record<string, boolean>, c) => {
        if (m[c.feature_id] === undefined) {
          m[c.feature_id] = true;
          this._ctx.store.get(c.feature_id)!.changed();
        }
        return m;
      },
      {} as Record<string, boolean>,
    );
  }

  getSelected(): DrawFeatureInstance[] {
    return this._ctx.store.getSelected();
  }

  getSelectedIds(): string[] {
    return this._ctx.store.getSelectedIds();
  }

  isSelected(id: string): boolean {
    return this._ctx.store.isSelected(id);
  }

  getFeature(id: string): DrawFeatureInstance | undefined {
    return this._ctx.store.get(id);
  }

  select(id: string | string[]) {
    return this._ctx.store.select(id);
  }

  deselect(id: string | string[]) {
    return this._ctx.store.deselect(id);
  }

  deleteFeature(id: string | string[], opts: any = {}) {
    return this._ctx.store.delete(id, opts);
  }

  addFeature(feature: DrawFeatureInstance, opts: any = {}) {
    return this._ctx.store.add(feature, opts);
  }

  clearSelectedFeatures() {
    return this._ctx.store.clearSelected();
  }

  clearSelectedCoordinates() {
    return this._ctx.store.clearSelectedCoordinates();
  }

  setActionableState(actions: any = {}) {
    const newSet = {
      trash: actions.trash || false,
      combineFeatures: actions.combineFeatures || false,
      uncombineFeatures: actions.uncombineFeatures || false,
    };
    return this._ctx.events.actionable(newSet);
  }

  changeMode(mode: string, opts: any = {}, eventOpts: any = {}) {
    return this._ctx.events.changeMode(mode, opts, eventOpts);
  }

  fire(eventName: string, eventData?: any) {
    return this._ctx.events.fire(eventName, eventData);
  }

  updateUIClasses(opts: any) {
    return this._ctx.ui.queueMapClasses(opts);
  }

  activateUIButton(name?: string) {
    return this._ctx.ui.setActiveButton(name);
  }

  featuresAt(event: any, bbox: any, bufferType: 'click' | 'touch' = 'click') {
    if (bufferType !== 'click' && bufferType !== 'touch') throw new Error('invalid buffer type');
    return (featuresAt as any)[bufferType](event, bbox, this._ctx);
  }

  newFeature(geojson: any): DrawFeatureInstance {
    const type = geojson.geometry.type;
    if (type === Constants.geojsonTypes.POINT) return new Point(this._ctx, geojson);
    if (type === Constants.geojsonTypes.LINE_STRING) return new LineString(this._ctx, geojson);
    if (type === Constants.geojsonTypes.POLYGON) return new Polygon(this._ctx, geojson);
    return new MultiFeature(this._ctx, geojson);
  }

  isInstanceOf(type: string, feature: any): boolean {
    if (type === Constants.geojsonTypes.POINT) return feature instanceof Point;
    if (type === Constants.geojsonTypes.LINE_STRING) return feature instanceof LineString;
    if (type === Constants.geojsonTypes.POLYGON) return feature instanceof Polygon;
    if (type === 'MultiFeature') return feature instanceof MultiFeature;
    throw new Error(`Unknown feature class: ${type}`);
  }

  doRender(id: string) {
    return this._ctx.store.featureChanged(id);
  }

  // Default lifecycle methods - overridden by modes
  onSetup(_opts?: any): any {
    return {};
  }
  onDrag(_state: any, _e: any): void {}
  onClick(_state: any, _e: any): void {}
  onMouseMove(_state: any, _e: any): boolean | void {}
  onMouseDown(_state: any, _e: any): void {}
  onMouseUp(_state: any, _e: any): void {}
  onMouseOut(_state: any, _e: any): boolean | void {}
  onKeyUp(_state: any, _e: any): void {}
  onKeyDown(_state: any, _e: any): void {}
  onTouchStart(_state: any, _e: any): void {}
  onTouchMove(_state: any, _e: any): void {}
  onTouchEnd(_state: any, _e: any): void {}
  onTap(_state: any, _e: any): void {}
  onStop(_state: any): void {}
  onTrash(_state: any): void {}
  onCombineFeatures(_state: any): void {}
  onUncombineFeatures(_state: any): void {}

  toDisplayFeatures(_state: any, _geojson: any, _display: (geojson: any) => void): void {
    throw new Error('You must overwrite toDisplayFeatures');
  }
}
