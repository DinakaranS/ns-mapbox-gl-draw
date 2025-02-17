import * as CommonSelectors from "../lib/common_selectors";
import * as Constants from "../constants";

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
    position: "absolute", // Change to absolute to keep it relative to the map
    left: `${pixels.x}px`,
    top: `${pixels.y}px`,
    zIndex: "10",
    display: "block",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    width: "260px",
    transform: "translate(-50%, -100%)", // Center the container above the point
  });

  const cancelButton = document.createElement("span");
  cancelButton.innerHTML = "&times;";
  cancelButton.id = "cancel";

  const form = document.createElement("form");
  form.id = "text-input-form";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "text-input";
  input.placeholder = "Enter text here";

  const button = document.createElement("button");
  button.type = "submit";
  button.innerText = "Submit";

  form.appendChild(input);
  form.appendChild(button);
  formContainer.appendChild(cancelButton);
  formContainer.appendChild(form);

  // Function to update container position on map movements
  const updatePosition = () => {
    const newPixels = map.project(lngLat);
    formContainer.style.left = `${newPixels.x}px`;
    formContainer.style.top = `${newPixels.y}px`;
  };

  map.on("move", updatePosition);
  map.on("zoom", updatePosition);

  // Cleanup event listeners when form is removed
  formContainer.removeEventListener = () => {
    map.off("move", updatePosition);
    map.off("zoom", updatePosition);
  };

  return formContainer;
}


function cancelInteraction(instance, formContainer) {
  const mapContainer = instance.map.getContainer();

  if (formContainer && mapContainer.contains(formContainer)) {
    mapContainer.removeChild(formContainer);
  }

  if (currentPoint) {
    instance.deleteFeature([currentPoint.id], { silent: true });
  }
  instance.map.fire("cancel_text");
  instance.changeMode("draw_text");
}

function finalizeInteraction(instance, formContainer) {
  instance.map.getContainer().removeChild(formContainer);
  instance.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [currentPoint.id],
  });
}

const DrawText = {
  onSetup(opts) {
    const properties = (opts && opts.properties) || {};
    currentPoint = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: { ...properties },
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: [],
      },
    });

    this.addFeature(currentPoint);
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POINT);
    this.setActionableState({ trash: true });

    return {
      point: currentPoint,
      isInteractionAllowed: !document.getElementById(FORM_CONTAINER_ID),
    };
  },

  onClick(state, e) {
    // Make sure state is defined and interaction is allowed
    if (!state || !state.isInteractionAllowed) return;

    state.isInteractionAllowed = false; // Disable interaction while the form is shown
    const map = this.map;
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    currentPoint.updateCoordinate("", e.lngLat.lng, e.lngLat.lat);

    // Check if the form container already exists, remove it if necessary
    const existingContainer = document.getElementById(FORM_CONTAINER_ID);
    if (existingContainer) existingContainer.remove();

    // Create and append the new form container
    const formContainer = createFormContainer(map, e.lngLat);
    map.getContainer().appendChild(formContainer);

    // Ensure this code runs after the button has been added to the DOM
    formContainer.querySelector("#cancel").addEventListener("click", () => {
      cancelInteraction(this, formContainer);
    });

    formContainer.querySelector("form").onsubmit = (event) => {
      event.preventDefault();
      const text = event.target.querySelector("input").value.trim();
      if (text) {
        currentPoint.properties.text = capitalizeFirstLetter(text);
        finalizeInteraction(this, formContainer);
        this.map.fire(Constants.events.CREATE, {
          features: [currentPoint.toGeoJSON()],
        });
      }
    };
  },

  onTap(state, e) {
    this.onClick(state, e); // Just call onClick for tap interaction
  },

  onKeyUp(state, e) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      this.stopDrawingAndRemove(state);
    }
  },

  stopDrawingAndRemove() {
    this.deleteFeature([currentPoint.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },

  onStop() {
    this.activateUIButton();
    if (!currentPoint.getCoordinate().length) {
      this.deleteFeature([currentPoint.id], { silent: true });
    }
  },

  toDisplayFeatures(state, geojson, display) {
    const isActivePoint = geojson.properties.id === currentPoint.id;
    geojson.properties.active = isActivePoint ?
      Constants.activeStates.ACTIVE :
      Constants.activeStates.INACTIVE;
    if (!isActivePoint) display(geojson);
  },

  onTrash() {
    // eslint-disable-next-line prefer-rest-params
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
  },
};

// Expose the DrawText object and the removeContainerAndFeature method
export default DrawText;
export const removeTextFeatureAndContainer = () => {
  if (DrawText.removeContainerAndFeature) {
    DrawText.removeContainerAndFeature();
  }
};
