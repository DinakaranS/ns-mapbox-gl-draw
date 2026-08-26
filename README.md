# ns-mapbox-gl-draw

Adds support for drawing and editing features on [mapbox-gl-js](https://www.mapbox.com/mapbox-gl-js/) maps.

Inspired by and tracking [@mapbox/mapbox-gl-draw](https://github.com/mapbox/mapbox-gl-draw) (currently in sync with upstream **1.5.1**), rewritten in TypeScript and extended with extra drawing modes and live measurement.

**Requires [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js) v2 or newer.**

### Installing

```
yarn add ns-mapbox-gl-draw
```

Draw ships with CSS — make sure you include it in your build.

### Usage in your application

#### JavaScript

```js
import mapboxgl from 'mapbox-gl';
import MapboxDraw from 'ns-mapbox-gl-draw';
```

The package also ships CommonJS (`require`) and UMD builds; the UMD bundle expects `mapboxgl` to already be on the page and exposes the global `MapboxDraw`.

#### CSS

```js
import 'ns-mapbox-gl-draw/dist/mapbox-gl-draw.css';
```

or, from plain HTML:

```html
<link rel="stylesheet" href="node_modules/ns-mapbox-gl-draw/dist/mapbox-gl-draw.css" type="text/css" />
```

### TypeScript

Type definitions are bundled with the package — there is nothing extra to install, and you should **not** install `@types/mapbox__mapbox-gl-draw` (those describe upstream, not this fork).

```ts
import MapboxDraw, { type DrawOptions, type DrawEvent } from 'ns-mapbox-gl-draw';
```

### Example usage

```js
mapboxgl.accessToken = 'YOUR_ACCESS_TOKEN';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-74.5, 40],
  zoom: 9,
});

const draw = new MapboxDraw();

// Map#addControl takes an optional second argument to set the position of the
// control. If no position is specified it defaults to `top-right`.
map.addControl(draw, 'top-left');

map.on('load', () => {
  // ALL YOUR APPLICATION CODE
});
```

### Modes

Alongside the upstream modes (`simple_select`, `direct_select`, `draw_point`, `draw_line_string`, `draw_polygon`), this fork adds:

| Mode | Constant | Description |
| --- | --- | --- |
| `draw_rectangle` | `DRAW_RECTANGLE` | Drag out an axis-aligned rectangle, with live width/height/area readout |
| `draw_circle` | `DRAW_CIRCLE` | Drag out a circle, with live radius/perimeter/area readout |
| `draw_text` | `DRAW_TEXT` | Place a text label via an inline form |
| `draw_line_arrow` | `DRAW_LINE_ARROW` | Line string annotated with directional arrow vertices |
| `draw_rotate` | `DRAW_ROTATE` | Rotate an existing feature about its centre |
| `draw_marker` | `DRAW_MARKER` | Place a marker feature |

Every name is reachable through the public constants, and each resolves to a registered mode:

```js
draw.changeMode(MapboxDraw.constants.modes.DRAW_RECTANGLE);
```

Measurement helpers backing those modes are exported for use in your own custom modes:

```js
const { createDistance, createAdditionalVertex } = MapboxDraw.lib;
```

See [docs/API.md](docs/API.md) and [docs/MODES.md](docs/MODES.md) for the full reference.

### Developing and testing

Requires Node `^20.19.0 || >=22.12.0`.

```
git clone git@github.com:DinakaranS/ns-mapbox-gl-draw.git
cd ns-mapbox-gl-draw
yarn install
yarn build
yarn start          # serves example/ — add your Mapbox token in example/index.html
```

Other useful scripts:

```
yarn typecheck      # tsc --noEmit
yarn lint           # eslint
yarn format         # prettier --write
yarn test           # runtime + all-modes suites (runs against dist/, so build first)
```

### Publishing

```
npm version (major|minor|patch)
git push --follow-tags
npm publish
```

`prepublishOnly` runs lint and a full build, so `dist/` is always regenerated before publish.

### Naming actions

We're trying to follow standards when naming things. Here is a collection of links where we look for inspiration.

- https://turfjs.org
- https://shapely.readthedocs.io/en/latest/manual.html
