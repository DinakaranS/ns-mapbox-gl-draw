import * as CommonSelectors from '../lib/common_selectors';
import mouseEventPoint from '../lib/mouse_event_point';
import createSupplementaryPoints from '../lib/create_supplementary_points';
import StringSet from '../lib/string_set';
import doubleClickZoom from '../lib/double_click_zoom';
import moveFeatures from '../lib/move_features';
import * as Constants from '../constants';
import type { ModeObject } from '../types';

const SimpleSelect: ModeObject = {
  onSetup(this: any, opts: any) {
    const state = {
      dragMoveLocation: null as any,
      boxSelectStartLocation: null as any,
      boxSelectElement: undefined as HTMLDivElement | undefined,
      boxSelecting: false,
      canBoxSelect: false,
      dragMoving: false,
      canDragMove: false,
      initialDragPanState: this.map.dragPan.isEnabled(),
      initiallySelectedFeatureIds: opts.featureIds || [],
    };

    this.setSelected(
      state.initiallySelectedFeatureIds.filter((id: string) => this.getFeature(id) !== undefined),
    );
    this.fireActionable();
    this.setActionableState({ combineFeatures: true, uncombineFeatures: true, trash: true });

    return state;
  },

  fireUpdate(this: any) {
    this.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.MOVE,
      features: this.getSelected().map((f: any) => f.toGeoJSON()),
    });
  },

  fireActionable(this: any) {
    const selectedFeatures = this.getSelected();
    const multiFeatures = selectedFeatures.filter((feature: any) =>
      this.isInstanceOf('MultiFeature', feature),
    );

    let combineFeatures = false;
    if (selectedFeatures.length > 1) {
      combineFeatures = true;
      const featureType = selectedFeatures[0].type.replace('Multi', '');
      selectedFeatures.forEach((feature: any) => {
        if (feature.type.replace('Multi', '') !== featureType) combineFeatures = false;
      });
    }

    this.setActionableState({
      combineFeatures,
      uncombineFeatures: multiFeatures.length > 0,
      trash: selectedFeatures.length > 0,
    });
  },

  getUniqueIds(allFeatures: any[]) {
    if (!allFeatures.length) return [];
    const ids = allFeatures
      .map((s) => s.properties.id)
      .filter((id: string) => id !== undefined)
      .reduce((memo: StringSet, id: string) => {
        memo.add(id);
        return memo;
      }, new StringSet());
    return ids.values();
  },

  stopExtendedInteractions(this: any, state: any) {
    if (state.boxSelectElement) {
      if (state.boxSelectElement.parentNode)
        state.boxSelectElement.parentNode.removeChild(state.boxSelectElement);
      state.boxSelectElement = null;
    }
    if ((state.canDragMove || state.canBoxSelect) && state.initialDragPanState === true) {
      this.map.dragPan.enable();
    }
    state.boxSelecting = false;
    state.canBoxSelect = false;
    state.dragMoving = false;
    state.canDragMove = false;
  },

  onStop(this: any) {
    doubleClickZoom.enable(this);
  },

  onMouseMove(this: any, state: any, e: any) {
    const isFeatureTarget = CommonSelectors.isFeature(e);
    if (isFeatureTarget && state.dragMoving) this.fireUpdate();
    this.stopExtendedInteractions(state);
    return true;
  },

  onMouseOut(this: any, state: any) {
    if (state.dragMoving) return this.fireUpdate();
    return true;
  },

  onClick(this: any, state: any, e: any) {
    if (CommonSelectors.noTarget(e)) return this.clickAnywhere(state, e);
    if (CommonSelectors.isOfMetaType(Constants.meta.VERTEX)(e)) return this.clickOnVertex(state, e);
    if (CommonSelectors.isFeature(e)) {
      if (e?.type !== undefined) {
        return this.clickOnFeature(state, e);
      } else {
        console.warn('Invalid feature object or missing type:', e);
        return false;
      }
    }
  },

  onTap(this: any, state: any, e: any) {
    this.onClick(state, e);
  },

  clickAnywhere(this: any, state: any) {
    const wasSelected = this.getSelectedIds();
    if (wasSelected.length) {
      this.clearSelectedFeatures();
      wasSelected.forEach((id: string) => this.doRender(id));
    }
    doubleClickZoom.enable(this);
    this.stopExtendedInteractions(state);
  },

  clickOnVertex(this: any, state: any, e: any) {
    const featureTarget = e.featureTarget;
    if (featureTarget?.properties?.parent && featureTarget.properties.coord_path && e.lngLat) {
      const featureId = featureTarget.properties.parent;
      const feature = this.getFeature(featureId);
      if (!feature) {
        console.warn('Feature not found for ID:', featureId);
        return;
      }
      this.changeMode(Constants.modes.DIRECT_SELECT, {
        featureId,
        coordPath: featureTarget.properties.coord_path,
        startPos: e.lngLat,
      });
    } else {
      console.warn('Missing required data for direct_select mode:', featureTarget);
    }
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
  },

  startOnActiveFeature(this: any, state: any, e: any) {
    this.stopExtendedInteractions(state);
    this.map.dragPan.disable();
    this.doRender(e.featureTarget.properties.id);
    state.canDragMove = true;
    state.dragMoveLocation = e.lngLat;
  },

  clickOnFeature(this: any, state: any, e: any) {
    doubleClickZoom.disable(this);
    this.stopExtendedInteractions(state);

    const isShiftClick = CommonSelectors.isShiftDown(e);
    const selectedFeatureIds = this.getSelectedIds();
    const featureId = e.featureTarget?.properties?.id;
    if (!featureId) {
      console.warn('Feature ID not found in clicked feature:', e.featureTarget);
      return;
    }
    const feature = this.getFeature(featureId);
    if (!feature?.type) {
      console.warn('Feature not found for ID:', featureId);
      return;
    }

    const isFeatureSelected = this.isSelected(featureId);

    if (!isShiftClick && isFeatureSelected && feature.type !== Constants.geojsonTypes.POINT) {
      return this.changeMode(Constants.modes.DIRECT_SELECT, { featureId });
    }

    if (isFeatureSelected && isShiftClick) {
      this.deselect(featureId);
      this.updateUIClasses({ mouse: Constants.cursors.POINTER });
      if (selectedFeatureIds.length === 1) doubleClickZoom.enable(this);
    } else if (!isFeatureSelected && isShiftClick) {
      this.select(featureId);
      this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    } else if (!isFeatureSelected && !isShiftClick) {
      selectedFeatureIds.forEach((id: string) => this.doRender(id));
      this.setSelected(featureId);
      this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    }

    this.doRender(featureId);
  },

  onMouseDown(this: any, state: any, e: any) {
    state.initialDragPanState = this.map.dragPan.isEnabled();
    if (CommonSelectors.isActiveFeature(e)) return this.startOnActiveFeature(state, e);
    if (this.drawConfig.boxSelect && CommonSelectors.isShiftMousedown(e))
      return this.startBoxSelect(state, e);
  },

  startBoxSelect(this: any, state: any, e: any) {
    this.stopExtendedInteractions(state);
    this.map.dragPan.disable();
    state.boxSelectStartLocation = mouseEventPoint(e.originalEvent, this.map.getContainer());
    state.canBoxSelect = true;
  },

  onTouchStart(this: any, state: any, e: any) {
    if (CommonSelectors.isActiveFeature(e)) return this.startOnActiveFeature(state, e);
  },

  onDrag(this: any, state: any, e: any) {
    if (state.canDragMove) return this.dragMove(state, e);
    if (this.drawConfig.boxSelect && state.canBoxSelect) return this.whileBoxSelect(state, e);
  },

  whileBoxSelect(this: any, state: any, e: any) {
    state.boxSelecting = true;
    this.updateUIClasses({ mouse: Constants.cursors.ADD });

    if (!state.boxSelectElement) {
      state.boxSelectElement = document.createElement('div');
      state.boxSelectElement.classList.add(Constants.classes.BOX_SELECT);
      this.map.getContainer().appendChild(state.boxSelectElement);
    }

    const current = mouseEventPoint(e.originalEvent, this.map.getContainer());
    const minX = Math.min(state.boxSelectStartLocation.x, current.x);
    const maxX = Math.max(state.boxSelectStartLocation.x, current.x);
    const minY = Math.min(state.boxSelectStartLocation.y, current.y);
    const maxY = Math.max(state.boxSelectStartLocation.y, current.y);
    const translateValue = `translate(${minX}px, ${minY}px)`;
    state.boxSelectElement.style.transform = translateValue;
    state.boxSelectElement.style.WebkitTransform = translateValue;
    state.boxSelectElement.style.width = `${maxX - minX}px`;
    state.boxSelectElement.style.height = `${maxY - minY}px`;
  },

  dragMove(this: any, state: any, e: any) {
    state.dragMoving = true;
    e.originalEvent.stopPropagation();
    const delta = {
      lng: e.lngLat.lng - state.dragMoveLocation.lng,
      lat: e.lngLat.lat - state.dragMoveLocation.lat,
    };
    moveFeatures(this.getSelected(), delta);
    state.dragMoveLocation = e.lngLat;
  },

  onMouseUp(this: any, state: any, e: any) {
    if (state.dragMoving) {
      this.fireUpdate();
    } else if (state.boxSelecting) {
      const bbox = [
        state.boxSelectStartLocation,
        mouseEventPoint(e.originalEvent, this.map.getContainer()),
      ];
      const featuresInBox = this.featuresAt(null, bbox, 'click');
      const idsToSelect = this.getUniqueIds(featuresInBox).filter(
        (id: string) => !this.isSelected(id),
      );

      if (idsToSelect.length) {
        this.select(idsToSelect);
        idsToSelect.forEach((id: string) => this.doRender(id));
        this.updateUIClasses({ mouse: Constants.cursors.MOVE });
      }
    }
    this.stopExtendedInteractions(state);
  },

  onTouchEnd(this: any, state: any, e: any) {
    this.onMouseUp(state, e);
  },

  toDisplayFeatures(this: any, state: any, geojson: any, display: any) {
    geojson.properties.active = this.isSelected(geojson.properties.id)
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE;
    display(geojson);
    this.fireActionable();
    if (
      geojson.properties.active !== Constants.activeStates.ACTIVE ||
      geojson.geometry.type === Constants.geojsonTypes.POINT
    )
      return;
    createSupplementaryPoints(geojson).forEach(display);
  },

  onTrash(this: any) {
    this.deleteFeature(this.getSelectedIds());
    this.fireActionable();
  },

  onCombineFeatures(this: any) {
    const selectedFeatures = this.getSelected();
    if (selectedFeatures.length < 2) return;

    const coordinates: any[] = [];
    const featuresCombined: any[] = [];
    const featureType = selectedFeatures[0].type.replace('Multi', '');

    for (const feature of selectedFeatures) {
      if (feature.type.replace('Multi', '') !== featureType) return;
      if (feature.type.includes('Multi')) {
        feature.getCoordinates().forEach((subcoords: any) => coordinates.push(subcoords));
      } else {
        coordinates.push(feature.getCoordinates());
      }
      featuresCombined.push(feature.toGeoJSON());
    }

    if (featuresCombined.length > 1) {
      const multiFeature = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: featuresCombined[0].properties,
        geometry: { type: `Multi${featureType}`, coordinates },
      });

      this.addFeature(multiFeature);
      this.deleteFeature(this.getSelectedIds(), { silent: true });
      this.setSelected([multiFeature.id]);

      this.fire(Constants.events.COMBINE_FEATURES, {
        createdFeatures: [multiFeature.toGeoJSON()],
        deletedFeatures: featuresCombined,
      });
    }
    this.fireActionable();
  },

  onUncombineFeatures(this: any) {
    const selectedFeatures = this.getSelected();
    if (selectedFeatures.length === 0) return;

    const createdFeatures: any[] = [];
    const featuresUncombined: any[] = [];

    for (const feature of selectedFeatures) {
      if (this.isInstanceOf('MultiFeature', feature)) {
        feature.getFeatures().forEach((subFeature: any) => {
          this.addFeature(subFeature);
          subFeature.properties = feature.properties;
          createdFeatures.push(subFeature.toGeoJSON());
          this.select([subFeature.id]);
        });
        this.deleteFeature(feature.id, { silent: true });
        featuresUncombined.push(feature.toGeoJSON());
      }
    }

    if (createdFeatures.length > 1) {
      this.fire(Constants.events.UNCOMBINE_FEATURES, {
        createdFeatures,
        deletedFeatures: featuresUncombined,
      });
    }
    this.fireActionable();
  },
};

export default SimpleSelect;
