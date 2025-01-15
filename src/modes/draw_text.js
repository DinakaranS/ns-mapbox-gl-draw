import * as CommonSelectors from "../lib/common_selectors";
import * as Constants from "../constants";

const DrawText = {};

DrawText.onSetup = function () {
  const point = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POINT,
      coordinates: [],
    },
  });

  this.addFeature(point);

  this.clearSelectedFeatures();
  this.updateUIClasses({ mouse: Constants.cursors.ADD });
  this.activateUIButton(Constants.types.POINT);

  this.setActionableState({
    trash: true,
  });

  return { point };
};

DrawText.stopDrawingAndRemove = function (state) {
  this.deleteFeature([state.point.id], { silent: true });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawText.onTap = DrawText.onClick = function (state, e) {
  const map = this.map;
  this.updateUIClasses({ mouse: Constants.cursors.MOVE });
  state.point.updateCoordinate("", e.lngLat.lng, e.lngLat.lat);

  // First, try to remove any existing form container
  const existingContainer = document.getElementById(
    "mapbox-gl-draw-text-form-container"
  );
  if (existingContainer) {
    existingContainer.remove(); // Remove the existing form if it's there
  }

  const pixels = map.project(e.lngLat);
  const formContainer = document.createElement("div");
  formContainer.id = "mapbox-gl-draw-text-form-container"; // Unique identifier for the form container
  formContainer.style.position = "absolute";
  formContainer.style.left = `${pixels.x}px`;
  formContainer.style.top = `${pixels.y}px`;
  formContainer.style.zIndex = "10";
  formContainer.style.display = "block";
  formContainer.style.backgroundColor = "white"; // White background for the form
  formContainer.style.padding = "10px"; // Padding for the form
  formContainer.style.borderRadius = "10px"; // Optional rounded corners
  formContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)"; // Optional shadow effect
  formContainer.style.width = "auto"; // Let the form container adjust based on its content
  formContainer.style.maxWidth = "350px"; // Max width for the form container

  // Create form element
  const form = document.createElement("form");
  form.id = "text-input-form";
  form.style.display = "flex";
  form.style.alignItems = "center";
  form.style.flexDirection = "row"; // Keep the form elements horizontally aligned
  form.style.width = "100%";

  // Cross icon positioned at the top-right of the form
  const cancelIcon = document.createElement("span");
  cancelIcon.style.position = "absolute";
  cancelIcon.style.right = "10px"; // Position the icon 10px from the right edge
  cancelIcon.style.top = "1px"; // Position the icon 10px from the top edge
  cancelIcon.style.cursor = "pointer"; // Make it clickable
  cancelIcon.innerHTML = "&times;"; // Use the HTML entity for a cross (×)
  cancelIcon.style.fontSize = "20px"; // Optional: adjust icon size

  cancelIcon.onclick = function () {
    map.getContainer().removeChild(formContainer); // Remove form on cancel
  };

  // Input field (60% width)
  const input = document.createElement("input");
  input.type = "text";
  input.id = "text-input";
  input.placeholder = "Enter text here";
  input.classList.add("mui-text-field");
  input.style.width = "60%"; // 60% width for the text field
  input.style.height = "40px"; // Ensure the height is consistent with the submit button
  input.style.marginRight = "10px"; // Add space between text field and submit button

  // Submit button (30% width)
  const buttonSubmit = document.createElement("button");
  buttonSubmit.type = "submit";
  buttonSubmit.innerText = "Submit";
  buttonSubmit.classList.add("mui-btn");
  buttonSubmit.style.padding = "5px 5px"; // Adjust button padding for consistency
  buttonSubmit.style.height = "35px"; // Set the height of the submit button to match the text field
  buttonSubmit.style.width = "25%";
  buttonSubmit.style.marginBottom = "8px"; // 30% width for the submit button

  // Empty space (remaining 10%) after submit button
  const emptySpace = document.createElement("div");
  emptySpace.style.flex = "1"; // The remaining space after the button

  // Append input, submit button, and empty space to the form
  form.appendChild(input);
  form.appendChild(buttonSubmit);
  form.appendChild(emptySpace); // Empty space after the submit button

  // Append the form to the container and the cancel icon
  formContainer.appendChild(form);
  formContainer.appendChild(cancelIcon); // Append the cancel icon separately (not part of the form)

  // Append the form container to the map container
  map.getContainer().appendChild(formContainer);

  // Handle form submission
  form.onsubmit = function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (text) {
      state.point.properties.text = text;
      // Clean up the form after submission
      map.getContainer().removeChild(formContainer);
    }
  };

  this.map.fire(Constants.events.CREATE, {
    features: [state.point.toGeoJSON()],
  });
  this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.point.id],
  });
};

DrawText.onStop = function (state) {
  this.activateUIButton();
  if (!state.point.getCoordinate().length) {
    this.deleteFeature([state.point.id], { silent: true });
  }
};

DrawText.toDisplayFeatures = function (state, geojson, display) {
  // Never render the point we're drawing
  const isActivePoint = geojson.properties.id === state.point.id;
  geojson.properties.active = isActivePoint ?
    Constants.activeStates.ACTIVE :
    Constants.activeStates.INACTIVE;
  if (!isActivePoint) return display(geojson);
};

DrawText.onTrash = DrawText.stopDrawingAndRemove;

DrawText.onKeyUp = function (state, e) {
  if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
    return this.stopDrawingAndRemove(state, e);
  }
};

export default DrawText;
