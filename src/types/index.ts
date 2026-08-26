import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, Position } from 'geojson';

// ─── Map Types ───────────────────────────────────────────────────
export interface MapboxMap {
  on(type: string, listener: (...args: any[]) => void): void;
  off(type: string, listener: (...args: any[]) => void): void;
  fire(type: string, data?: Record<string, any>): void;
  getSource(id: string): any;
  addSource(id: string, source: any): void;
  removeSource(id: string): void;
  addLayer(layer: any): void;
  removeLayer(id: string): void;
  getLayer(id: string): any;
  getContainer(): HTMLElement;
  getCanvasContainer(): HTMLElement;
  queryRenderedFeatures(geometry?: any, options?: any): any[];
  project(lngLat: LngLatLike): PixelPoint;
  loaded(): boolean;
  boxZoom: MapInteraction;
  dragPan: MapInteraction;
  doubleClickZoom: MapInteraction;
  scrollZoom: MapInteraction;
  dragRotate: MapInteraction;
  keyboard: MapInteraction;
  touchZoomRotate: MapInteraction;
  [key: string]: any;
}

export interface MapInteraction {
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
}

export interface LngLat {
  lng: number;
  lat: number;
}

export type LngLatLike = LngLat | [number, number];

export interface PixelPoint {
  x: number;
  y: number;
}

// ─── Event Types ─────────────────────────────────────────────────
export interface DrawEvent {
  point: PixelPoint;
  lngLat: LngLat;
  originalEvent: MouseEvent | TouchEvent;
  featureTarget?: DrawFeatureTarget;
  type?: string;
  srcElement?: HTMLElement;
  target?: any;
  keyCode?: number;
  key?: string;
  dataType?: string;
}

export interface DrawFeatureTarget {
  properties: {
    id?: string;
    meta?: string;
    parent?: string;
    coord_path?: string;
    active?: string;
    lng?: number;
    lat?: number;
    'meta:type'?: string;
    [key: string]: any;
  };
  geometry: Geometry;
  type?: string;
}

export interface EventInfo {
  point: PixelPoint;
  time: number;
}

// ─── Feature Types ───────────────────────────────────────────────
export interface DrawFeatureGeoJSON extends Feature {
  id?: string;
}

export interface InternalFeature {
  type: string;
  properties: Record<string, any>;
  geometry: {
    coordinates: any;
    type: string;
  };
}

export interface DrawFeatureInstance {
  id: string;
  type: string;
  properties: Record<string, any>;
  coordinates: any;
  ctx: DrawContext;
  changed(): void;
  incomingCoords(coords: any): void;
  setCoordinates(coords: any): void;
  getCoordinates(): any;
  getCoordinate(path?: string): any;
  setProperty(property: string, value: any): void;
  toGeoJSON(): Feature;
  internal(mode: string): InternalFeature;
  isValid(): boolean;
  updateCoordinate(...args: any[]): void;
  addCoordinate(path: string, lng: number, lat: number): void;
  removeCoordinate(path: string): void;
}

// ─── Context & Options ───────────────────────────────────────────
export interface DrawControls {
  point?: boolean;
  line_string?: boolean;
  polygon?: boolean;
  trash?: boolean;
  combine_features?: boolean;
  uncombine_features?: boolean;
  [key: string]: boolean | undefined;
}

export interface DrawOptions {
  defaultMode: string;
  keybindings: boolean;
  touchEnabled: boolean;
  clickBuffer: number;
  touchBuffer: number;
  boxSelect: boolean;
  displayControlsDefault: boolean;
  styles: any[];
  modes: Record<string, any>;
  controls: DrawControls;
  userProperties: boolean;
  suppressAPIEvents: boolean;
  [key: string]: any;
}

export interface DrawContext {
  options: DrawOptions;
  map: MapboxMap;
  container: HTMLElement;
  store: DrawStore;
  events: DrawEvents;
  ui: DrawUI;
  api: DrawAPI;
  setup: DrawSetup;
  boxZoomInitial?: boolean;
}

export interface DrawStore {
  render(): void;
  createRenderBatch(): () => void;
  setDirty(dirty?: boolean): DrawStore;
  featureCreated(featureId: string, options?: SilentOptions): DrawStore;
  featureChanged(featureId: string, options?: SilentOptions): DrawStore;
  getChangedIds(): string[];
  clearChangedIds(): DrawStore;
  getAllIds(): string[];
  add(feature: DrawFeatureInstance, options?: SilentOptions): DrawStore;
  delete(featureIds: string | string[], options?: SilentOptions): DrawStore;
  get(id: string): DrawFeatureInstance | undefined;
  getAll(): DrawFeatureInstance[];
  select(featureIds: string | string[], options?: SilentOptions): DrawStore;
  deselect(featureIds: string | string[], options?: SilentOptions): DrawStore;
  clearSelected(options?: SilentOptions): DrawStore;
  setSelected(featureIds: string | string[], options?: SilentOptions): DrawStore;
  setSelectedCoordinates(coordinates: SelectedCoordinate[]): DrawStore;
  clearSelectedCoordinates(): DrawStore;
  getSelectedIds(): string[];
  getSelected(): DrawFeatureInstance[];
  getSelectedCoordinates(): { coordinates: Position }[];
  isSelected(featureId: string): boolean;
  setFeatureProperty(
    featureId: string,
    property: string,
    value: any,
    options?: SilentOptions,
  ): void;
  storeMapConfig(): void;
  restoreMapConfig(): void;
  getInitialConfigValue(interaction: string): boolean;
  isDirty: boolean;
  sources: { hot: any[]; cold: any[] };
  ctx: DrawContext;
  changeZoom(): void;
}

export interface DrawEvents {
  start(): void;
  changeMode(mode: string, opts?: any, eventOpts?: SilentOptions): void;
  actionable(actions: ActionState): void;
  currentModeName(): string;
  currentModeRender(geojson: any, push: (geojson: any) => void): void;
  fire(eventName: string, eventData?: any): void;
  addEventListeners(): void;
  removeEventListeners(): void;
  trash(options?: SilentOptions): void;
  combineFeatures(): void;
  uncombineFeatures(): void;
  getMode(): string;
}

export interface DrawUI {
  setActiveButton(name?: string): void;
  queueMapClasses(options: Partial<MapClasses>): void;
  updateMapClasses(): void;
  clearMapClasses(): void;
  addButtons(): HTMLElement;
  removeButtons(): void;
}

export interface DrawSetup {
  onAdd(map: MapboxMap): HTMLElement;
  onRemove(): void;
  addLayers(): void;
  removeLayers(): void;
  connect(): void;
}

export interface DrawAPI {
  modes: Record<string, string>;
  getFeatureIdsAt(point: PixelPoint): string[];
  getSelectedIds(): string[];
  getSelected(): FeatureCollection;
  getSelectedPoints(): FeatureCollection;
  set(featureCollection: FeatureCollection): string[];
  add(geojson: Feature | FeatureCollection | Geometry): string[];
  get(id: string): Feature | undefined;
  getAll(): FeatureCollection;
  delete(featureIds: string | string[]): DrawAPI;
  deleteAll(): DrawAPI;
  changeMode(mode: string, options?: any): DrawAPI;
  getMode(): string;
  trash(): DrawAPI;
  combineFeatures(): DrawAPI;
  uncombineFeatures(): DrawAPI;
  setFeatureProperty(featureId: string, property: string, value: any): DrawAPI;
  onAdd: (map: MapboxMap) => HTMLElement;
  onRemove: () => void;
  types: Record<string, string>;
  options: DrawOptions;
}

// ─── State Types ─────────────────────────────────────────────────
export interface SilentOptions {
  silent?: boolean;
  action?: string;
}

export interface ActionState {
  trash: boolean;
  combineFeatures: boolean;
  uncombineFeatures: boolean;
}

export interface MapClasses {
  mode: string | null;
  feature: string | null;
  mouse: string | null;
}

export interface SelectedCoordinate {
  feature_id: string;
  coord_path: string;
}

// ─── Mode Types ──────────────────────────────────────────────────
export interface ModeObject {
  onSetup?(opts: any): any;
  onDrag?(state: any, e: DrawEvent): void;
  onClick?(state: any, e: DrawEvent): void;
  onMouseMove?(state: any, e: DrawEvent): boolean | void;
  onMouseDown?(state: any, e: DrawEvent): void;
  onMouseUp?(state: any, e: DrawEvent): void;
  onMouseOut?(state: any, e: DrawEvent): boolean | void;
  onKeyUp?(state: any, e: DrawEvent): void;
  onKeyDown?(state: any, e: DrawEvent): void;
  onTouchStart?(state: any, e: DrawEvent): void;
  onTouchMove?(state: any, e: DrawEvent): void;
  onTouchEnd?(state: any, e: DrawEvent): void;
  onTap?(state: any, e: DrawEvent): void;
  onStop?(state: any): void;
  onTrash?(state: any): void;
  onCombineFeatures?(state: any): void;
  onUncombineFeatures?(state: any): void;
  toDisplayFeatures(state: any, geojson: any, display: (geojson: any) => void): void;
  [key: string]: any;
}

export interface ModeInstance {
  start(): void;
  stop(): void;
  trash(): void;
  combineFeatures(): void;
  uncombineFeatures(): void;
  render(geojson: any, push: (geojson: any) => void): void;
}

export interface ModeHandler {
  render(geojson: any, push: (geojson: any) => void): void;
  stop(): void;
  trash(): void;
  combineFeatures(): void;
  uncombineFeatures(): void;
  drag(event: DrawEvent): void;
  click(event: DrawEvent): void;
  mousemove(event: DrawEvent): void;
  mousedown(event: DrawEvent): void;
  mouseup(event: DrawEvent): void;
  mouseout(event: DrawEvent): void;
  keydown(event: DrawEvent): void;
  keyup(event: DrawEvent): void;
  touchstart(event: DrawEvent): void;
  touchmove(event: DrawEvent): void;
  touchend(event: DrawEvent): void;
  tap(event: DrawEvent): void;
}

export interface Delta {
  lng: number;
  lat: number;
}

export interface MeasurementResult {
  metric: string;
  standard: string;
}

export interface ModeOpts {
  measurement?: boolean;
  unit?: 'metric' | 'standard';
  properties?: GeoJsonProperties;
  featureId?: string;
  featureIds?: string[];
  from?: any;
  coordPath?: string;
  startPos?: LngLat;
  selectedFeature?: any;
  [key: string]: any;
}
