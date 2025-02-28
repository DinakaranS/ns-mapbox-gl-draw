import * as CommonSelectors from "../lib/common_selectors";
import * as Constants from "../constants";

export const FORM_CONTAINER_ID = "mapbox-gl-draw-text-form-container";

let currentPoint = null;

function capitalizeFirstLetter(string) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : "";
}

/**
 * Creates the text input form container, ensuring it stays within the map bounds.
 */
function createFormContainer(map, lngLat) {
  const pixels = map.project(lngLat);
  const formContainer = document.createElement("div");
  formContainer.id = FORM_CONTAINER_ID;

  Object.assign(formContainer.style, {
    position: "absolute",
    left: `${pixels.x}px`,
    top: `${pixels.y}px`,
    zIndex: "10",
    display: "block",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    width: "260px",
    transform: "translate(-50%, -100%)",
  });

  formContainer.innerHTML = `
    <span id="cancel" style="cursor:pointer; position:absolute; top:-12px; right:-12px; background:white; border:2px solid #ccc; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:bold; color:black;">&times;</span>
    <form id="text-input-form" style="width: 100%">
      <input type="text" id="text-input" placeholder="Enter text here" style="width:75%;margin-bottom:5px;" required />
      <button type="submit" style="width:25%;">Submit</button>
    </form>
  `;

  function updatePosition() {
    const newPixels = map.project(lngLat);
    formContainer.style.left = `${newPixels.x}px`;
    formContainer.style.top = `${newPixels.y}px`;

    // Ensure the form stays within viewport bounds
    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();
    const formRect = formContainer.getBoundingClientRect();

    // Adjust position if out of bounds
    if (formRect.right > mapRect.right) {
      formContainer.style.left = `${newPixels.x - (formRect.right - mapRect.right)}px`;
    }
    if (formRect.left < mapRect.left) {
      formContainer.style.left = `${newPixels.x + (mapRect.left - formRect.left)}px`;
    }
    if (formRect.top < mapRect.top) {
      formContainer.style.top = `${newPixels.y + (mapRect.top - formRect.top)}px`;
    }
    if (formRect.bottom > mapRect.bottom) {
      formContainer.style.top = `${newPixels.y - (formRect.bottom - mapRect.bottom)}px`;
    }
  }

  map.on("move", updatePosition);
  map.on("zoom", updatePosition);

  formContainer.cleanup = () => {
    map.off("move", updatePosition);
    map.off("zoom", updatePosition);
    formContainer.remove();
  };

  return formContainer;
}

/**
 * Cancels text input interaction and resets mode.
 */
function cancelInteraction(instance, formContainer) {
  if (formContainer) formContainer.cleanup();
  if (currentPoint) instance.deleteFeature([currentPoint.id], { silent: true });
  instance.map.fire("cancel_text");
  instance.changeMode("draw_text");
}

/**
 * Finalizes text input and stores it in the feature properties.
 */
function finalizeInteraction(instance, formContainer, text) {
  if (formContainer) formContainer.cleanup();
  currentPoint.properties.text = capitalizeFirstLetter(text);

  // Re-add feature to the map to ensure text appears
  instance.addFeature(currentPoint);

  instance.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [currentPoint.id],
  });

  instance.map.fire(Constants.events.CREATE, {
    features: [currentPoint.toGeoJSON()],
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
    if (!state || !state.isInteractionAllowed) return;
    state.isInteractionAllowed = false;

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
      if (text) finalizeInteraction(this, formContainer, text);
    };
  },

  onTap(state, e) {
    this.onClick(state, e);
  },

  onKeyUp(state, e) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      this.stopDrawingAndRemove(state);
      this.removeContainerAndFeature();
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
    if (!geojson.properties.text) return display(geojson);

    geojson.properties.active = geojson.properties.id === currentPoint?.id ?
      Constants.activeStates.ACTIVE :
      Constants.activeStates.INACTIVE;

    display(geojson);

    const textFeature = {
      type: "Feature",
      geometry: geojson.geometry,
      properties: {
        text: geojson.properties.text,
        meta: "text-label",
      },
    };
    display(textFeature);
  },

  onTrash() {
    this.stopDrawingAndRemove();
  },

  removeContainerAndFeature() {
    const container = document.getElementById(FORM_CONTAINER_ID);
    if (container) container.remove();
    if (currentPoint) {
      this.deleteFeature([currentPoint.id], { silent: true });
      currentPoint = null;
    }
  },
};

export default DrawText;
export const removeTextFeatureAndContainer = () => DrawText.removeContainerAndFeature();
