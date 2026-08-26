import toDenseArray from './lib/to_dense_array';
import StringSet from './lib/string_set';
import render from './render';
import * as Constants from './constants';
import type {
  DrawContext,
  DrawFeatureInstance,
  DrawStore,
  SilentOptions,
  SelectedCoordinate,
} from './types';

export default class Store implements DrawStore {
  private _features: Record<string, DrawFeatureInstance> = {};
  private _featureIds = new StringSet();
  private _selectedFeatureIds = new StringSet();
  private _selectedCoordinates: SelectedCoordinate[] = [];
  private _changedFeatureIds = new StringSet();
  private _emitSelectionChange = false;
  private _mapInitialConfig: Record<string, boolean> = {};

  ctx: DrawContext;
  isDirty = false;
  sources: { hot: any[]; cold: any[] } = { hot: [], cold: [] };
  render: () => void;

  constructor(ctx: DrawContext) {
    this.ctx = ctx;

    let renderRequest: number | null;
    this.render = () => {
      if (!renderRequest) {
        renderRequest = requestAnimationFrame(() => {
          renderRequest = null;
          render.call(this);

          if (this._emitSelectionChange) {
            this.ctx.events.fire(Constants.events.SELECTION_CHANGE, {
              features: this.getSelected()
                .map((feature) => (feature ? feature.toGeoJSON() : null))
                .filter(Boolean),
              points: this.getSelectedCoordinates().map((coordinate) => ({
                type: Constants.geojsonTypes.FEATURE,
                properties: {},
                geometry: {
                  type: Constants.geojsonTypes.POINT,
                  coordinates: coordinate.coordinates,
                },
              })),
            });
            this._emitSelectionChange = false;
          }

          this.ctx.events.fire(Constants.events.RENDER, {});
        });
      }
    };
  }

  createRenderBatch(): () => void {
    const holdRender = this.render;
    let numRenders = 0;
    this.render = () => {
      numRenders++;
    };

    return () => {
      this.render = holdRender;
      if (numRenders > 0) {
        this.render();
      }
    };
  }

  setDirty(): this {
    this.isDirty = true;
    return this;
  }

  featureCreated(featureId: string, options: SilentOptions = {}): this {
    this._changedFeatureIds.add(featureId);
    const silent = options.silent ?? this.ctx.options.suppressAPIEvents;
    if (silent !== true) {
      const feature = this.get(featureId);
      if (feature) {
        this.ctx.events.fire(Constants.events.CREATE, {
          features: [feature.toGeoJSON()],
        });
      }
    }
    return this;
  }

  featureChanged(featureId: string, options: SilentOptions = {}): this {
    this._changedFeatureIds.add(featureId);
    const silent = options.silent ?? this.ctx.options.suppressAPIEvents;
    if (silent !== true) {
      const feature = this.get(featureId);
      if (feature) {
        this.ctx.events.fire(Constants.events.UPDATE, {
          action: options.action || Constants.updateActions.CHANGE_COORDINATES,
          features: [feature.toGeoJSON()],
        });
      }
    }
    return this;
  }

  getChangedIds(): string[] {
    return this._changedFeatureIds.values();
  }

  clearChangedIds(): this {
    this._changedFeatureIds.clear();
    return this;
  }

  getAllIds(): string[] {
    return this._featureIds.values();
  }

  add(feature: DrawFeatureInstance, options: SilentOptions = {}): this {
    this._features[feature.id] = feature;
    this._featureIds.add(feature.id);
    this.featureCreated(feature.id, { silent: options.silent });
    return this;
  }

  delete(featureIds: string | string[], options: SilentOptions = {}): this {
    const deletedFeaturesToEmit: any[] = [];
    toDenseArray(featureIds).forEach((id) => {
      if (!this._featureIds.has(id)) return;
      this._featureIds.delete(id);
      this._selectedFeatureIds.delete(id);
      if (!options.silent) {
        if (deletedFeaturesToEmit.indexOf(this._features[id]) === -1) {
          deletedFeaturesToEmit.push(this._features[id].toGeoJSON());
        }
      }
      delete this._features[id];
      this.isDirty = true;
    });

    if (deletedFeaturesToEmit.length) {
      this.ctx.events.fire(Constants.events.DELETE, { features: deletedFeaturesToEmit });
    }

    this._refreshSelectedCoordinates(options);
    return this;
  }

  get(id: string): DrawFeatureInstance | undefined {
    return this._features[id];
  }

  getAll(): DrawFeatureInstance[] {
    return Object.keys(this._features).map((id) => this._features[id]);
  }

  select(featureIds: string | string[], options: SilentOptions = {}): this {
    toDenseArray(featureIds).forEach((id) => {
      if (this._selectedFeatureIds.has(id)) return;
      this._selectedFeatureIds.add(id);
      this._changedFeatureIds.add(id);
      if (!options.silent) {
        this._emitSelectionChange = true;
      }
    });
    return this;
  }

  deselect(featureIds: string | string[], options: SilentOptions = {}): this {
    toDenseArray(featureIds).forEach((id) => {
      if (!this._selectedFeatureIds.has(id)) return;
      this._selectedFeatureIds.delete(id);
      this._changedFeatureIds.add(id);
      if (!options.silent) {
        this._emitSelectionChange = true;
      }
    });
    this._refreshSelectedCoordinates(options);
    return this;
  }

  clearSelected(options: SilentOptions = {}): this {
    this.deselect(this._selectedFeatureIds.values(), { silent: options.silent });
    return this;
  }

  setSelected(featureIds: string | string[], options: SilentOptions = {}): this {
    const ids = toDenseArray(featureIds);
    this.deselect(
      this._selectedFeatureIds.values().filter((id) => ids.indexOf(id) === -1),
      { silent: options.silent },
    );
    this.select(
      ids.filter((id) => !this._selectedFeatureIds.has(id)),
      { silent: options.silent },
    );
    return this;
  }

  setSelectedCoordinates(coordinates: SelectedCoordinate[]): this {
    this._selectedCoordinates = coordinates;
    this._emitSelectionChange = true;
    return this;
  }

  clearSelectedCoordinates(): this {
    this._selectedCoordinates = [];
    this._emitSelectionChange = true;
    return this;
  }

  getSelectedIds(): string[] {
    return this._selectedFeatureIds.values();
  }

  getSelected(): DrawFeatureInstance[] {
    return this.getSelectedIds().map((id) => this.get(id)!);
  }

  getSelectedCoordinates(): { coordinates: any }[] {
    return this._selectedCoordinates.map((coordinate) => {
      const feature = this.get(coordinate.feature_id);
      return {
        coordinates: feature!.getCoordinate(coordinate.coord_path),
      };
    });
  }

  isSelected(featureId: string): boolean {
    return this._selectedFeatureIds.has(featureId);
  }

  setFeatureProperty(
    featureId: string,
    property: string,
    value: any,
    options: SilentOptions = {},
  ): void {
    this.get(featureId)!.setProperty(property, value);
    this.featureChanged(featureId, {
      silent: options.silent,
      action: Constants.updateActions.CHANGE_PROPERTIES,
    });
  }

  storeMapConfig(): void {
    Constants.interactions.forEach((interaction) => {
      const interactionSet = (this.ctx.map as any)[interaction];
      if (interactionSet) {
        this._mapInitialConfig[interaction] = (this.ctx.map as any)[interaction].isEnabled();
      }
    });
  }

  restoreMapConfig(): void {
    Object.keys(this._mapInitialConfig).forEach((key) => {
      const value = this._mapInitialConfig[key];
      if (value) {
        (this.ctx.map as any)[key].enable();
      } else {
        (this.ctx.map as any)[key].disable();
      }
    });
  }

  getInitialConfigValue(interaction: string): boolean {
    if (this._mapInitialConfig[interaction] !== undefined) {
      return this._mapInitialConfig[interaction];
    }
    return true;
  }

  changeZoom(): void {
    // Placeholder for zoom change handling
  }

  private _refreshSelectedCoordinates(options: SilentOptions = {}): void {
    const newSelectedCoordinates = this._selectedCoordinates.filter((point) =>
      this._selectedFeatureIds.has(point.feature_id),
    );
    if (this._selectedCoordinates.length !== newSelectedCoordinates.length && !options.silent) {
      this._emitSelectionChange = true;
    }
    this._selectedCoordinates = newSelectedCoordinates;
  }
}
