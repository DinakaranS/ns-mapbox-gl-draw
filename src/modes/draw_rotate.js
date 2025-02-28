import distance from "@turf/distance";
import centroid from "@turf/centroid";
import bearing from "@turf/bearing";
import destination from "@turf/destination";

const RotateMode = {
  rotatestart(selectedFeature, originalCenter) {},
  rotating(selectedFeature, originalCenter, lastMouseDown) {},
  rotateend(selectedFeature) {},

  onSetup(opts) {
    const state = {};

    state.selectedFeature = opts.selectedFeature || false;
    state.lastMouseDownLngLat = false;
    state.originalCenter = false;
    state.mode = "rotate" || false;
    return state;
  },

  onMouseDown(state, e) {
    if (e.featureTarget) {
      if (this._ctx.api.get(e.featureTarget.properties.id)) {
        e.target["dragPan"].disable();
        state.selectedFeature = this._ctx.api.get(
          e.featureTarget.properties.id
        );
        state.originalCenter = centroid(e.featureTarget);
        state.originalFeature = e.featureTarget;
        // emitter.emit('rotatestart');
      }
    }
    return state;
  },

  toDisplayFeatures(state, geojson, display) {
    display(geojson);
  },

  onDrag(state, e) {
    if (state.selectedFeature && state.mode) {
      if (state.mode === "rotate") {
        state.lastMouseDownLngLat = {lng: e.lngLat.lng, lat: e.lngLat.lat};
        const draggedBearing = bearing(state.originalCenter, [
          e.lngLat.lng,
          e.lngLat.lat,
        ]);
        let rotatedCoords = [];
        switch (state.originalFeature.properties["meta:type"]) {
        case "Point": {
          // Use the point itself as the center for a point geometry
          const pointCoords = state.originalFeature.geometry.coordinates;

          // Calculate the bearing from the original center to the point itself
          const bearingFromCenter = bearing(
            state.originalCenter,
            pointCoords
          );

          // Adjust the bearing by the dragged angle (rotation)
          const newPoint = destination(
            state.originalCenter, // The center point around which to rotate
            0, // Distance is zero because it's the same point
            bearingFromCenter + draggedBearing // New bearing after rotation
          );
            // Update the point coordinates
          rotatedCoords = newPoint.geometry.coordinates;

          // Apply the new coordinates to the selected feature
          state.selectedFeature.geometry.coordinates = rotatedCoords;
          break;
        }
        case "LineString": {
          state.originalFeature.geometry.coordinates.forEach((
            coords,
          ) => {
            const distanceFromCenter = distance(state.originalCenter, coords);
            const bearingFromCenter = bearing(state.originalCenter, coords);
            const newPoint = destination(
              state.originalCenter,
              distanceFromCenter,
              bearingFromCenter + draggedBearing
            );
              // console.log(distanceFromCenter);
            rotatedCoords.push(newPoint.geometry.coordinates);
          });
          break;
        }
        case "Polygon": {
          const polyCoords = [];
          state.originalFeature.geometry.coordinates[0].forEach((
            coords,
          ) => {
            const distanceFromCenter = distance(state.originalCenter, coords);
            const bearingFromCenter = bearing(state.originalCenter, coords);
            const newPoint = destination(
              state.originalCenter,
              distanceFromCenter,
              bearingFromCenter + draggedBearing
            );
              // console.log(distanceFromCenter);
            polyCoords.push(newPoint.geometry.coordinates);
          });
          // console.log(polyCoords);
          rotatedCoords.push(polyCoords);
          break;
        }
        case "MultiLineString": {
          const multipolys = [];
          state.originalFeature.geometry.coordinates.forEach((
            polygon,
          ) => {
            const polyCoords = [];
            polygon.forEach((coords) => {
              const distanceFromCenter = distance(
                state.originalCenter,
                coords
              );
              const bearingFromCenter = bearing(state.originalCenter, coords);
              const newPoint = destination(
                state.originalCenter,
                distanceFromCenter,
                bearingFromCenter + draggedBearing
              );
              polyCoords.push(newPoint.geometry.coordinates);
            });
            multipolys.push(polyCoords);
          });
          rotatedCoords = multipolys;
          break;
        }
        case "MultiPolygon": {
          const multipolys = [];
          state.originalFeature.geometry.coordinates.forEach((
            polygon
          ) => {
            const polyCoords = [];
            polygon.forEach((polygonHoles) => {
              const polyHoleCoords = [];
              polygonHoles.forEach((coords) => {
                const distanceFromCenter = distance(
                  state.originalCenter,
                  coords
                );
                const bearingFromCenter = bearing(
                  state.originalCenter,
                  coords
                );
                const newPoint = destination(
                  state.originalCenter,
                  distanceFromCenter,
                  bearingFromCenter + draggedBearing
                );
                polyHoleCoords.push(newPoint.geometry.coordinates);
              });
              polyCoords.push(polyHoleCoords);
            });
            multipolys.push(polyCoords);
          });
          rotatedCoords = multipolys;
          break;
        }
        default:
          return;
        }
        //  emitter.emit('rotating');
        const newFeature = state.selectedFeature;
        newFeature.geometry.coordinates = rotatedCoords;
        const thisFeat = this._ctx.api.add(newFeature);
      }
    }
  },

  onMouseUp(state, e) {
    e.target["dragPan"].enable();
    state.selectedFeature = false;
    state.lastMouseDownLngLat = false;
    state.originalCenter = false;
    return state;
  },
};

export default RotateMode;
