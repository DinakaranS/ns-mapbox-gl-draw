import {
  noTarget,
  isOfMetaType,
  isActiveFeature,
  isInactiveFeature,
  isShiftDown,
} from '../lib/common_selectors';
import createSupplementaryPoints from '../lib/create_supplementary_points';
import constrainFeatureMovement from '../lib/constrain_feature_movement';
import doubleClickZoom from '../lib/double_click_zoom';
import * as Constants from '../constants';
import moveFeatures from '../lib/move_features';
import createDistance from '../lib/create_distance';
import type { ModeObject } from '../types';

const isVertex = isOfMetaType(Constants.meta.VERTEX);
const isMidpoint = isOfMetaType(Constants.meta.MIDPOINT);

const DirectSelect: ModeObject = {
  fireUpdate(this: any) {
    this.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: this.getSelected().map((f: any) => f.toGeoJSON()),
    });
  },

  fireActionable(this: any, state: any) {
    this.setActionableState({
      combineFeatures: false,
      uncombineFeatures: false,
      trash: state.selectedCoordPaths.length > 0,
    });
  },

  startDragging(this: any, state: any, e: any) {
    if (state.initialDragPanState == null) {
      state.initialDragPanState = this.map.dragPan.isEnabled();
    }
    this.map.dragPan.disable();
    state.canDragMove = true;
    state.dragMoveLocation = e.lngLat;
  },

  stopDragging(this: any, state: any) {
    if (state.canDragMove && state.initialDragPanState === true) {
      this.map.dragPan.enable();
    }
    state.initialDragPanState = null;
    state.dragMoving = false;
    state.canDragMove = false;
    state.dragMoveLocation = null;
  },

  onVertex(this: any, state: any, e: any) {
    this.startDragging(state, e);
    const about = e.featureTarget.properties;
    const selectedIndex = state.selectedCoordPaths.indexOf(about.coord_path);
    if (!isShiftDown(e) && selectedIndex === -1) {
      state.selectedCoordPaths = [about.coord_path];
    } else if (isShiftDown(e) && selectedIndex === -1) {
      state.selectedCoordPaths.push(about.coord_path);
    }

    this.setSelectedCoordinates(
      state.selectedCoordPaths.map((coord_path: string) => ({
        feature_id: state.featureId,
        coord_path,
      })),
    );
  },

  onMidpoint(this: any, state: any, e: any) {
    this.startDragging(state, e);
    const about = e.featureTarget.properties;
    state.feature.addCoordinate(about.coord_path, about.lng, about.lat);
    const { metric, standard } = createDistance(state.feature.toGeoJSON());
    state.feature.properties = {
      ...state.feature.properties,
      distance: state?.opts?.unit === 'metric' ? metric : standard,
    };
    this.fireUpdate();
    state.selectedCoordPaths = [about.coord_path];
  },

  onFeature(this: any, state: any, e: any) {
    if (state.selectedCoordPaths.length === 0) this.startDragging(state, e);
    else this.stopDragging(state);
  },

  dragFeature(this: any, state: any, e: any, delta: any) {
    moveFeatures(this.getSelected(), delta);
    state.dragMoveLocation = e.lngLat;
  },

  dragVertex(this: any, state: any, e: any, delta: any) {
    const selectedCoords = state.selectedCoordPaths.map((coord_path: string) =>
      state.feature.getCoordinate(coord_path),
    );
    const selectedCoordPoints = selectedCoords.map((coords: number[]) => ({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: { type: Constants.geojsonTypes.POINT, coordinates: coords },
    }));

    const constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);
    for (let i = 0; i < selectedCoords.length; i++) {
      const coord = selectedCoords[i];
      state.feature.updateCoordinate(
        state.selectedCoordPaths[i],
        coord[0] + constrainedDelta.lng,
        coord[1] + constrainedDelta.lat,
      );
    }
    const { metric, standard } = createDistance(state.feature.toGeoJSON());
    state.feature.properties = {
      ...state.feature.properties,
      distance: state?.opts?.unit === 'metric' ? metric : standard,
    };
    this.fireUpdate();
  },

  clickNoTarget(this: any) {
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  clickInactive(this: any) {
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  clickActiveFeature(this: any, state: any) {
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    state.feature.changed();
  },

  onSetup(this: any, opts: any) {
    const featureId = opts.featureId;
    const feature = this.getFeature(featureId);

    if (!feature) throw new Error('You must provide a featureId to enter direct_select mode');
    if (feature.type === Constants.geojsonTypes.POINT) {
      throw new TypeError("direct_select mode doesn't handle point features");
    }

    const state = {
      featureId,
      feature,
      dragMoveLocation: opts.startPos || null,
      dragMoving: false,
      canDragMove: false,
      selectedCoordPaths: opts.coordPath ? [opts.coordPath] : [],
      initialDragPanState: null as boolean | null,
      opts,
    };

    this.setSelectedCoordinates(
      state.selectedCoordPaths.map((coord_path: string) => ({
        feature_id: featureId,
        coord_path,
      })),
    );
    this.setSelected(featureId);
    doubleClickZoom.disable(this);
    this.setActionableState({ trash: true });

    return state;
  },

  onStop(this: any) {
    doubleClickZoom.enable(this);
    this.clearSelectedCoordinates();
  },

  toDisplayFeatures(this: any, state: any, geojson: any, push: any) {
    if (state.featureId === geojson.properties.id) {
      geojson.properties.active = Constants.activeStates.ACTIVE;
      push(geojson);
      createSupplementaryPoints(geojson, {
        map: this.map,
        midpoints: true,
        selectedPaths: state.selectedCoordPaths,
      }).forEach(push);
    } else {
      geojson.properties.active = Constants.activeStates.INACTIVE;
      push(geojson);
    }
    this.fireActionable(state);
  },

  onTrash(this: any, state: any) {
    state.selectedCoordPaths
      .sort((a: string, b: string) => b.localeCompare(a, 'en', { numeric: true }))
      .forEach((id: string) => state.feature.removeCoordinate(id));
    this.fireUpdate();
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    this.fireActionable(state);
    if (state.feature.isValid() === false) {
      this.deleteFeature([state.featureId]);
      this.changeMode(Constants.modes.SIMPLE_SELECT, {});
    }
  },

  onMouseMove(this: any, state: any, e: any) {
    const isFeatureTarget = isActiveFeature(e);
    const onVertexTarget = isVertex(e);
    const isMidPoint = isMidpoint(e);
    const noCoords = state.selectedCoordPaths.length === 0;

    if (isFeatureTarget && noCoords) this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    else if (onVertexTarget && !noCoords) this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    else this.updateUIClasses({ mouse: Constants.cursors.NONE });

    const isDraggableItem = onVertexTarget || isFeatureTarget || isMidPoint;
    if (isDraggableItem && state.dragMoving) this.fireUpdate();

    this.stopDragging(state);
    return true;
  },

  onMouseOut(this: any, state: any) {
    if (state.dragMoving) this.fireUpdate();
    return true;
  },

  onMouseDown(this: any, state: any, e: any) {
    if (isVertex(e)) return this.onVertex(state, e);
    if (isActiveFeature(e)) return this.onFeature(state, e);
    if (isMidpoint(e)) return this.onMidpoint(state, e);
  },

  onTouchStart(this: any, state: any, e: any) {
    this.onMouseDown(state, e);
  },

  onDrag(this: any, state: any, e: any) {
    if (state.canDragMove !== true) return;
    state.dragMoving = true;
    e.originalEvent.stopPropagation();

    const delta = {
      lng: e.lngLat.lng - state.dragMoveLocation.lng,
      lat: e.lngLat.lat - state.dragMoveLocation.lat,
    };
    if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
    else this.dragFeature(state, e, delta);

    state.dragMoveLocation = e.lngLat;
  },

  onClick(this: any, state: any, e: any) {
    if (noTarget(e)) return this.clickNoTarget(state, e);
    if (isActiveFeature(e)) return this.clickActiveFeature(state, e);
    if (isInactiveFeature(e)) return this.clickInactive(state, e);
    this.stopDragging(state);
  },

  onTap(this: any, state: any, e: any) {
    if (noTarget(e)) return this.clickNoTarget(state, e);
    if (isActiveFeature(e)) return this.clickActiveFeature(state, e);
    if (isInactiveFeature(e)) return this.clickInactive(state, e);
  },

  onMouseUp(this: any, state: any) {
    if (state.dragMoving) this.fireUpdate();
    this.stopDragging(state);
  },

  onTouchEnd(this: any, state: any) {
    this.onMouseUp(state);
  },
};

export default DirectSelect;
