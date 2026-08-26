import * as CommonSelectors from '../lib/common_selectors';
import * as Constants from '../constants';
import type { ModeObject, DrawFeatureInstance } from '../types';

export const FORM_CONTAINER_ID = 'mapbox-gl-draw-text-form-container';

let currentPoint: DrawFeatureInstance | null = null;

function capitalizeFirstLetter(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function createFormContainer(map: any, lngLat: any): HTMLDivElement {
  const pixels = map.project(lngLat);
  const formContainer = document.createElement('div');
  formContainer.id = FORM_CONTAINER_ID;

  Object.assign(formContainer.style, {
    position: 'absolute',
    left: `${pixels.x}px`,
    top: `${pixels.y}px`,
    zIndex: '10',
    display: 'block',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '260px',
    transform: 'translate(-50%, -100%)',
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

    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();
    const formRect = formContainer.getBoundingClientRect();

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

  map.on('move', updatePosition);
  map.on('zoom', updatePosition);

  (formContainer as any).cleanup = () => {
    map.off('move', updatePosition);
    map.off('zoom', updatePosition);
    formContainer.remove();
  };

  return formContainer;
}

function cancelInteraction(instance: any, formContainer: any) {
  if (formContainer) formContainer.cleanup();
  if (currentPoint) instance.deleteFeature([currentPoint.id], { silent: true });
  instance.map.fire('cancel_text');
  instance.changeMode('draw_text');
}

function finalizeInteraction(instance: any, formContainer: any, text: string) {
  if (formContainer) formContainer.cleanup();
  if (!currentPoint) return;
  currentPoint.properties.text = capitalizeFirstLetter(text);

  instance.addFeature(currentPoint);

  instance.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [currentPoint.id] });
  instance.map.fire(Constants.events.CREATE, { features: [currentPoint.toGeoJSON()] });
}

const DrawText: ModeObject = {
  onSetup(this: any, opts: any) {
    const properties = opts?.properties || {};
    currentPoint = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: { ...properties },
      geometry: { type: Constants.geojsonTypes.POINT, coordinates: [] },
    });

    this.addFeature(currentPoint!);
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POINT);
    this.setActionableState({ trash: true });

    return {
      point: currentPoint,
      isInteractionAllowed: !document.getElementById(FORM_CONTAINER_ID),
    };
  },

  onClick(this: any, state: any, e: any) {
    if (!state?.isInteractionAllowed) return;
    state.isInteractionAllowed = false;

    const map = this.map;
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    currentPoint!.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);

    const existingContainer = document.getElementById(FORM_CONTAINER_ID);
    if (existingContainer) existingContainer.remove();

    const formContainer = createFormContainer(map, e.lngLat);
    map.getContainer().appendChild(formContainer);

    formContainer.querySelector('#cancel')!.addEventListener('click', () => {
      cancelInteraction(this, formContainer);
    });

    formContainer.querySelector('form')!.onsubmit = (event: Event) => {
      event.preventDefault();
      const text = (
        (event.target as HTMLFormElement).querySelector('input') as HTMLInputElement
      ).value.trim();
      if (text) finalizeInteraction(this, formContainer, text);
    };
  },

  onTap(this: any, state: any, e: any) {
    this.onClick(state, e);
  },

  onKeyUp(this: any, state: any, e: any) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      this.onTrash(state);
      const container = document.getElementById(FORM_CONTAINER_ID);
      if (container) container.remove();
      if (currentPoint) {
        this.deleteFeature([currentPoint.id], { silent: true });
        currentPoint = null;
      }
    }
  },

  onStop(this: any) {
    this.activateUIButton();
    if (currentPoint && !currentPoint.getCoordinate().length) {
      this.deleteFeature([currentPoint.id], { silent: true });
    }
  },

  toDisplayFeatures(_state: any, geojson: any, display: any) {
    if (!geojson.properties.text) return display(geojson);

    geojson.properties.active =
      geojson.properties.id === currentPoint?.id
        ? Constants.activeStates.ACTIVE
        : Constants.activeStates.INACTIVE;

    display(geojson);

    display({
      type: Constants.geojsonTypes.FEATURE,
      geometry: geojson.geometry,
      properties: { text: geojson.properties.text, meta: 'text-label' },
    });
  },

  onTrash(this: any) {
    if (currentPoint) {
      this.deleteFeature([currentPoint.id], { silent: true });
    }
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  },
};

export default DrawText;
