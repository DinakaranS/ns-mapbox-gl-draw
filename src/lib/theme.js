export const H_COLOR = '#4264fb';
export const T_COLOR = 'rgb(46, 70, 175)';

export default [
  {
    'id': 'gl-draw-polygon-fill-inactive',
    'type': 'fill',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'fill-color': H_COLOR,
      'fill-outline-color': H_COLOR,
      'fill-opacity': 0.1
    }
  },
  {
    'id': 'gl-draw-polygon-fill-active',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': H_COLOR,
      'fill-outline-color': H_COLOR,
      'fill-opacity': 0.1
    }
  },
  {
    'id': 'gl-draw-polygon-midpoint',
    'type': 'circle',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['==', 'meta', 'midpoint']],
    'paint': {
      'circle-radius': 3,
      'circle-color': H_COLOR
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-inactive',
    'type': 'line',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': H_COLOR,
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-active',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': H_COLOR,
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-line-inactive',
    'type': 'line',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'LineString'],
      ['!=', 'mode', 'static']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': H_COLOR,
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-line-active',
    'type': 'line',
    'filter': ['all',
      ['==', '$type', 'LineString'],
      ['==', 'active', 'true']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': H_COLOR,
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
    'type': 'circle',
    'filter': ['all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#fff'
    }
  },
  {
    'id': 'gl-draw-polygon-and-line-vertex-inactive',
    'type': 'circle',
    'filter': ['all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static'],
    ],
    'paint': {
      'circle-radius': 3,
      'circle-color': H_COLOR
    }
  },
  {
    'id': 'gl-draw-point-point-stroke-inactive',
    'type': 'circle',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static'],
      ['!has', 'user_text'],
      ['!has', 'user_icon']
    ],
    'paint': {
      'circle-radius': 5,
      'circle-opacity': 1,
      'circle-color': '#fff'
    }
  },
  {
    'id': 'gl-draw-point-inactive',
    'type': 'circle',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static'],
      ['!has', 'user_text'],
      ['!has', 'user_icon']
    ],
    'paint': {
      'circle-radius': 3,
      'circle-color': H_COLOR
    }
  },
  {
    'id': 'gl-draw-point-stroke-active',
    'type': 'circle',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['==', 'active', 'true'],
      ['!=', 'meta', 'midpoint'],
      ['!has', 'text'],
      ['!has', 'icon']
    ],
    'paint': {
      'circle-radius': 7,
      'circle-color': '#fff'
    }
  },
  {
    'id': 'gl-draw-point-active',
    'type': 'circle',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['!=', 'meta', 'midpoint'],
      ['==', 'active', 'true'],
      ['!has', 'text'],
      ['!has', 'icon']
    ],
    'paint': {
      'circle-radius': 5,
      'circle-color': H_COLOR
    }
  },
  {
    'id': 'gl-draw-polygon-fill-static',
    'type': 'fill',
    'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#404040',
      'fill-outline-color': '#404040',
      'fill-opacity': 0.1
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-static',
    'type': 'line',
    'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#404040',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-line-static',
    'type': 'line',
    'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#404040',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-point-static',
    'type': 'circle',
    'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Point']],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#404040'
    }
  },

  {
    id: 'gl-draw-point-arrow-inactive',
    type: 'symbol',
    filter: ['all',
      ['has', 'user_bearing'], // Ensure the feature has an icon field
    ],
    layout: {
      'icon-image': 'gl-draw-arrow-icon',
      'icon-size': 0.04,
      'icon-rotate': {
        type: 'identity',
        property: 'user_bearing',
        default: 0
      },
      'icon-anchor': 'top',
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': false,
    },
    ignore: true,
  },
  {
    id: 'gl-draw-point-arrow-active',
    type: 'symbol',
    filter: ['all', ['==', 'meta', 'arrowPosition']],
    layout: {
      'icon-image': 'gl-draw-arrow-icon',
      'icon-size': 0.07,
      'icon-rotate': {
        type: 'identity',
        property: 'bearing',
        default: 0
      },
      'icon-anchor': 'top',
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': false,
    },
    paint: {
      'icon-color': H_COLOR,
      'icon-opacity': 1,
      'icon-halo-color': '#FFF'
    }
  },

  {
    id: 'gl-draw-marker-active',
    type: 'symbol',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['has', 'user_icon'], // Ensure the feature has an icon field
      ['==', 'active', 'true'], // Active markers
    ],
    layout: {
      'icon-image': ['get', 'icon'], // Dynamically get the icon image from the feature's properties
      'icon-size': 0.8, // Larger icon size for active markers
    },
    paint: {
      "icon-color": H_COLOR,
      "icon-halo-color": H_COLOR,
      "icon-halo-width": 2
    }
  },

  {
    id: 'gl-draw-marker-inactive',
    type: 'symbol',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['has', 'user_icon'], // Ensure the feature has an icon field
      ['!=', 'active', 'true'], // Inactive markers or those without the 'active' property
    ],
    layout: {
      'icon-image': ['get', 'user_icon'], // Dynamically get the icon image from the feature's properties
      'icon-size': 0.8, // Smaller icon size for inactive markers
    },
    paint: {
      "icon-color": H_COLOR,
      "icon-halo-color": H_COLOR,
      "icon-halo-width": 2
    }
  },

  {
    id: 'gl-draw-text-active',
    type: 'symbol',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['has', 'user_text'], // Ensure the feature has a text field
      ['==', 'active', 'true'], // Active text have the 'active' property set to true
    ],
    layout: {
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-field': ['get', 'text'],
      'text-size': 14,
      'text-allow-overlap': true,
      'text-ignore-placement': false,
      'text-justify': 'center',
      'text-line-height': 0.2, // Setting the line height
      'text-letter-spacing': 0.2 // Setting the letter spacing
    },
    paint: {
      'text-color': T_COLOR, // More prominent text color
      'text-halo-color': '#fff',
      'text-halo-width': 2,
    }
  },

  {
    id: 'gl-draw-text-inactive',
    type: 'symbol',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['has', 'user_text'], // Ensure the feature has a text field
      ['!=', 'active', 'true'], // Inactive text do not have the 'active' property or it's not true
    ],
    layout: {
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-field': ['get', 'user_text'],
      'text-size': 14,
      'text-allow-overlap': true,
      'text-ignore-placement': false,
      'text-justify': 'center',
      'text-line-height': 0.2, // Setting the line height
      'text-letter-spacing': 0.2 // Setting the letter spacing
    },
    paint: {
      'text-color': T_COLOR, // Less prominent text color
      'text-halo-color': '#fff',
      'text-halo-width': 2,
    }
  },

  // Custom circle data active
  {
    'id': 'gl-draw-polygon-fill-custom-circle-active',
    'filter': ['all',
      ['==', 'meta', "radius"],
      ['==', 'active', 'true']
    ],
    'type': 'line',
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': H_COLOR,
      'line-width': 3
    }
  },

  // Custom circle data inactive
  {
    'id': 'gl-draw-polygon-fill-custom-circle-inactive',
    'filter': ['all',
      ['==', 'user_meta', "radius"],
      ['==', 'user_active', 'false']
    ],
    'type': 'line',
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': H_COLOR,
      'line-width': 3
    }
  },

  // radius label
  {
    id: 'gl-draw-radius-label-active',
    type: 'symbol',
    filter: ['has', 'distance'],
    layout: {
      'text-field': '{distance}',
      'text-anchor': 'center',
      'text-offset': [
        1,
        0,
      ],
      'text-size': 14,
    },
    paint: {
      'text-color': T_COLOR,
      'text-halo-color': 'rgba(255, 255, 255, 1)',
      'text-halo-width': 2,
      'icon-opacity': {
        base: 1,
        stops: [
          [
            7.99,
            1,
          ],
          [
            8,
            0,
          ],
        ],
      },
      'text-halo-blur': 1,
    },
  },

  {
    id: 'gl-draw-radius-label-inactive',
    type: 'symbol',
    filter: ['has', 'user_distance'],
    layout: {
      'text-field': '{user_distance}',
      'text-anchor': 'center',
      'text-offset': [
        1,
        0,
      ],
      'text-size': 14,
    },
    paint: {
      'text-color': T_COLOR,
      'text-halo-color': 'rgba(255, 255, 255, 1)',
      'text-halo-width': 2,
      'icon-opacity': {
        base: 1,
        stops: [
          [
            7.99,
            1,
          ],
          [
            8,
            0,
          ],
        ],
      },
      'text-halo-blur': 1,
    },
  },
];
