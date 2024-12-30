import * as CommonSelectors from '../lib/common_selectors';
import * as Constants from '../constants';

export const FORM_CONTAINER_ID = "mapbox-gl-draw-text-form-container";

let currentPoint = null;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function createFormContainer(map, lngLat) {
  const pixels = map.project(lngLat);
  const formContainer = document.createElement("div");
  formContainer.id = FORM_CONTAINER_ID;
  Object.assign(formContainer.style, {
    position: "absolute",
    left: `${pixels.x}px`,
    top: `${pixels.y}px`,
    zIndex: "10",
    display: "block"
  });

  const form = document.createElement("form");
  form.id = "text-input-form";
  const input = document.createElement("input");
  input.type = "text";
  input.id = "text-input";
  input.placeholder = "Enter text here";
  input.classList.add("mui-text-field");

  const button = document.createElement("button");
  button.type = "submit";
  button.innerText = "Submit";
  button.classList.add("mui-btn");

  form.appendChild(input);
  form.appendChild(button);
  formContainer.appendChild(form);

  return formContainer;
}

function finalizeInteraction(instance, formContainer) {
  instance.map.getContainer().removeChild(formContainer);
  instance.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [currentPoint.id] });
}

const DrawText = {
  onSetup(opts) {
    const properties = (opts && opts.properties) || {};
    currentPoint = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: { ...properties },
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: []
      }
    });

    this.addFeature(currentPoint);
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POINT);
    this.setActionableState({ trash: true });

    return {
      point: currentPoint,
      isInteractionAllowed: !document.getElementById(FORM_CONTAINER_ID)
    };
  },

  onClick(state, e) {
    if (!state.isInteractionAllowed) return;

    state.isInteractionAllowed = false;
    const map = this.map;
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    currentPoint.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);

    const existingContainer = document.getElementById(FORM_CONTAINER_ID);
    if (existingContainer) existingContainer.remove();

    const formContainer = createFormContainer(map, e.lngLat);
    map.getContainer().appendChild(formContainer);

    formContainer.querySelector('form').onsubmit = (event) => {
      event.preventDefault();
      const text = event.target.querySelector('input').value.trim();
      if (text) {
        currentPoint.properties.text = capitalizeFirstLetter(text);
        finalizeInteraction(this, formContainer);
        this.map.fire(Constants.events.CREATE, { features: [currentPoint.toGeoJSON()] });
      }
    };
  },

  onTap(state, e) {
    this.onClick(state, e);
  },

  onKeyUp(state, e) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      this.stopDrawingAndRemove(state);
    }
  },

  stopDrawingAndRemove(state) {
    this.deleteFeature([currentPoint.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  onStop(state) {
    this.activateUIButton();
    if (!currentPoint.getCoordinate().length) {
      this.deleteFeature([currentPoint.id], { silent: true });
    }
  },

  toDisplayFeatures(state, geojson, display) {
    const isActivePoint = geojson.properties.id === currentPoint.id;
    geojson.properties.active = isActivePoint ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActivePoint) display(geojson);
  },

  onTrash() {
    this.stopDrawingAndRemove(...arguments);
  },

  removeContainerAndFeature() {
    const container = document.getElementById(FORM_CONTAINER_ID);
    if (container) {
      this.map.getContainer().removeChild(container);
    }
    if (currentPoint) {
      this.deleteFeature([currentPoint.id], { silent: true });
      currentPoint = null;
    }
  }
};

// Expose the DrawText object and the removeContainerAndFeature method
export default DrawText;
export const removeTextFeatureAndContainer = () => {
  if (DrawText.removeContainerAndFeature) {
    DrawText.removeContainerAndFeature();
  }
};
