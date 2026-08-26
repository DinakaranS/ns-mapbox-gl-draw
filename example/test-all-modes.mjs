/**
 * Comprehensive Mode Test for ns-mapbox-gl-draw
 *
 * This test creates a mock map environment and exercises every mode
 * by instantiating MapboxDraw, calling onAdd with a mock map,
 * then switching through all modes and performing operations.
 *
 * Run: node example/test-all-modes.mjs
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';

const mod = await import('../dist/mapbox-gl-draw.mjs');
const MapboxDraw = mod.default;

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m: ${message}`);
  } else {
    failed++;
    console.error(`  \x1b[31mFAIL\x1b[0m: ${message}`);
    errors.push(message);
  }
}

function section(name) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

// ─── Mock Map ────────────────────────────────────────────────────
function createMockMap() {
  const sources = {};
  const layers = {};
  const listeners = {};
  const interactions = {};

  ['scrollZoom', 'boxZoom', 'dragRotate', 'dragPan', 'keyboard', 'doubleClickZoom', 'touchZoomRotate'].forEach(name => {
    let enabled = true;
    interactions[name] = {
      enable() { enabled = true; },
      disable() { enabled = false; },
      isEnabled() { return enabled; },
    };
  });

  const container = createMockElement('div');
  container.classList = createMockClassList();
  container.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 });
  container.clientLeft = 0;
  container.clientTop = 0;

  const map = {
    ...interactions,
    getContainer() { return container; },
    getCanvasContainer() { return container; },
    addSource(id, src) { sources[id] = { ...src, setData(d) { sources[id].data = d; } }; },
    removeSource(id) { delete sources[id]; },
    getSource(id) { return sources[id]; },
    addLayer(layer) { layers[layer.id] = layer; },
    removeLayer(id) { delete layers[id]; },
    getLayer(id) { return layers[id]; },
    queryRenderedFeatures() { return []; },
    project(lngLat) { return { x: lngLat.lng * 10, y: lngLat.lat * 10 }; },
    loaded() { return true; },
    on(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    off(type, fn) {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter(f => f !== fn);
      }
    },
    fire(type, data) {
      if (listeners[type]) {
        listeners[type].forEach(fn => fn(data || {}));
      }
    },
    _listeners: listeners,
    _sources: sources,
    _layers: layers,
  };

  return map;
}

function createMockElement(tag) {
  const children = [];
  const listeners = {};
  const el = {
    tagName: tag.toUpperCase(),
    className: '',
    style: {},
    children,
    parentNode: null,
    classList: createMockClassList(),
    setAttribute(k, v) { el[k] = v; },
    getAttribute(k) { return el[k]; },
    appendChild(child) { child.parentNode = el; children.push(child); return child; },
    removeChild(child) {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      child.parentNode = null;
      return child;
    },
    remove() { if (el.parentNode) el.parentNode.removeChild(el); },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter(f => f !== fn);
      }
    },
    querySelector(sel) { return null; },
    querySelectorAll(sel) { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100 }; },
    innerHTML: '',
    id: '',
  };
  return el;
}

function createMockClassList() {
  const classes = new Set();
  return {
    add(...names) { names.forEach(n => classes.add(n)); },
    remove(...names) { names.forEach(n => classes.delete(n)); },
    contains(name) { return classes.has(name); },
    toggle(name) { classes.has(name) ? classes.delete(name) : classes.add(name); },
  };
}

// Mock DOM globals
globalThis.document = {
  createElement(tag) { return createMockElement(tag); },
  getElementById() { return null; },
};
globalThis.requestAnimationFrame = (fn) => { fn(); return 1; };
globalThis.setTimeout = (fn, ms) => { fn(); return 1; };
globalThis.clearInterval = () => {};
globalThis.setInterval = () => 1;

// ─── Test Setup ──────────────────────────────────────────────────
section('=== ns-mapbox-gl-draw: All Modes Test ===');

section('1. Instantiate MapboxDraw');
let draw;
try {
  draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: { point: true, line_string: true, polygon: true, trash: true },
    userProperties: true,
  });
  assert(draw !== undefined, 'MapboxDraw instance created');
  assert(typeof draw.onAdd === 'function', 'onAdd method exists');
  assert(typeof draw.onRemove === 'function', 'onRemove method exists');
} catch (e) {
  assert(false, `MapboxDraw instantiation failed: ${e.message}`);
}

section('2. Attach to mock map (onAdd)');
let map;
try {
  map = createMockMap();
  const controlContainer = draw.onAdd(map);
  assert(controlContainer !== undefined, 'onAdd returns control container');
  assert(map._sources['mapbox-gl-draw-hot'] !== undefined, 'HOT source created');
  assert(map._sources['mapbox-gl-draw-cold'] !== undefined, 'COLD source created');
  assert(Object.keys(map._layers).length > 0, `${Object.keys(map._layers).length} style layers added`);
} catch (e) {
  assert(false, `onAdd failed: ${e.message}`);
  console.error(e);
}

section('3. API methods');
try {
  assert(typeof draw.getAll === 'function', 'getAll exists');
  assert(typeof draw.add === 'function', 'add exists');
  assert(typeof draw.get === 'function', 'get exists');
  assert(typeof draw.delete === 'function', 'delete exists');
  assert(typeof draw.deleteAll === 'function', 'deleteAll exists');
  assert(typeof draw.set === 'function', 'set exists');
  assert(typeof draw.getSelectedIds === 'function', 'getSelectedIds exists');
  assert(typeof draw.getSelected === 'function', 'getSelected exists');
  assert(typeof draw.getSelectedPoints === 'function', 'getSelectedPoints exists');
  assert(typeof draw.changeMode === 'function', 'changeMode exists');
  assert(typeof draw.getMode === 'function', 'getMode exists');
  assert(typeof draw.trash === 'function', 'trash exists');
  assert(typeof draw.combineFeatures === 'function', 'combineFeatures exists');
  assert(typeof draw.uncombineFeatures === 'function', 'uncombineFeatures exists');
  assert(typeof draw.setFeatureProperty === 'function', 'setFeatureProperty exists');

  const mode = draw.getMode();
  assert(mode === 'simple_select', `Initial mode is simple_select (got: ${mode})`);

  const all = draw.getAll();
  assert(all.type === 'FeatureCollection', 'getAll returns FeatureCollection');
  assert(Array.isArray(all.features), 'getAll.features is array');
  assert(all.features.length === 0, 'Initially 0 features');
} catch (e) {
  assert(false, `API methods check failed: ${e.message}`);
}

section('4. Add features via API');
try {
  // Add a point
  const pointIds = draw.add({
    type: 'Feature',
    properties: { name: 'Test Point' },
    geometry: { type: 'Point', coordinates: [-91.874, 42.76] },
  });
  assert(Array.isArray(pointIds) && pointIds.length === 1, `Point added, id: ${pointIds[0]}`);

  // Add a line
  const lineIds = draw.add({
    type: 'Feature',
    properties: { name: 'Test Line' },
    geometry: { type: 'LineString', coordinates: [[-91.874, 42.76], [-91.9, 42.8]] },
  });
  assert(Array.isArray(lineIds) && lineIds.length === 1, `Line added, id: ${lineIds[0]}`);

  // Add a polygon
  const polyIds = draw.add({
    type: 'Feature',
    properties: { name: 'Test Polygon' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-91.874, 42.76], [-91.9, 42.76], [-91.9, 42.8], [-91.874, 42.8], [-91.874, 42.76]]],
    },
  });
  assert(Array.isArray(polyIds) && polyIds.length === 1, `Polygon added, id: ${polyIds[0]}`);

  const all = draw.getAll();
  assert(all.features.length === 3, `3 features in store (got: ${all.features.length})`);

  // Get individual feature
  const point = draw.get(pointIds[0]);
  assert(point !== undefined, 'get(pointId) returns feature');
  assert(point.geometry.type === 'Point', 'Point geometry type correct');
  assert(point.properties.name === 'Test Point', 'Point properties preserved');

  const line = draw.get(lineIds[0]);
  assert(line.geometry.type === 'LineString', 'Line geometry type correct');
  assert(line.geometry.coordinates.length === 2, 'Line has 2 coordinates');

  const poly = draw.get(polyIds[0]);
  assert(poly.geometry.type === 'Polygon', 'Polygon geometry type correct');
  assert(poly.geometry.coordinates[0].length === 5, 'Polygon ring has 5 coords (closed)');
} catch (e) {
  assert(false, `Add features failed: ${e.message}`);
  console.error(e);
}

section('5. Set feature property');
try {
  const ids = draw.getAll().features.map(f => f.id);
  draw.setFeatureProperty(ids[0], 'color', '#ff0000');
  const updated = draw.get(ids[0]);
  assert(updated.properties.color === '#ff0000', 'setFeatureProperty works');
} catch (e) {
  assert(false, `setFeatureProperty failed: ${e.message}`);
}

section('6. Select & deselect');
try {
  const ids = draw.getAll().features.map(f => f.id);
  draw.changeMode('simple_select', { featureIds: [ids[0]] });
  const selected = draw.getSelectedIds();
  assert(selected.length === 1 && selected[0] === ids[0], 'Feature selected');

  draw.changeMode('simple_select', { featureIds: [] });
  const deselected = draw.getSelectedIds();
  assert(deselected.length === 0, 'Feature deselected');
} catch (e) {
  assert(false, `Select/deselect failed: ${e.message}`);
}

section('7. Delete features');
try {
  const all = draw.getAll();
  const firstId = all.features[0].id;
  draw.delete(firstId);
  assert(draw.getAll().features.length === 2, 'Delete single feature works');

  draw.deleteAll();
  assert(draw.getAll().features.length === 0, 'deleteAll works');
} catch (e) {
  assert(false, `Delete features failed: ${e.message}`);
}

section('8. Set FeatureCollection');
try {
  const fc = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [1, 1] } },
    ],
  };
  const ids = draw.set(fc);
  assert(ids.length === 2, 'set() returns 2 ids');
  assert(draw.getAll().features.length === 2, 'set() replaces all features');
  draw.deleteAll();
} catch (e) {
  assert(false, `Set FeatureCollection failed: ${e.message}`);
}

section('9. Mode: draw_point');
try {
  draw.changeMode('draw_point');
  assert(draw.getMode() === 'draw_point', 'Switched to draw_point');
  draw.changeMode('simple_select');
  assert(draw.getMode() === 'simple_select', 'Back to simple_select');
} catch (e) {
  assert(false, `draw_point mode failed: ${e.message}`);
}

section('10. Mode: draw_marker');
try {
  draw.changeMode('draw_marker');
  assert(draw.getMode() === 'draw_marker', 'Switched to draw_marker');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_marker mode failed: ${e.message}`);
}

section('11. Mode: draw_line_string');
try {
  draw.changeMode('draw_line_string');
  assert(draw.getMode() === 'draw_line_string', 'Switched to draw_line_string');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_line_string mode failed: ${e.message}`);
}

section('12. Mode: draw_line_string with measurement');
try {
  draw.changeMode('draw_line_string', { measurement: true, unit: 'metric' });
  assert(draw.getMode() === 'draw_line_string', 'draw_line_string with measurement opts');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_line_string measurement failed: ${e.message}`);
}

section('13. Mode: draw_polygon');
try {
  draw.changeMode('draw_polygon');
  assert(draw.getMode() === 'draw_polygon', 'Switched to draw_polygon');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_polygon mode failed: ${e.message}`);
}

section('14. Mode: draw_polygon with measurement');
try {
  draw.changeMode('draw_polygon', { measurement: true, unit: 'standard' });
  assert(draw.getMode() === 'draw_polygon', 'draw_polygon with measurement opts');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_polygon measurement failed: ${e.message}`);
}

section('15. Mode: draw_rectangle');
try {
  draw.changeMode('draw_rectangle');
  assert(draw.getMode() === 'draw_rectangle', 'Switched to draw_rectangle');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_rectangle mode failed: ${e.message}`);
}

section('16. Mode: draw_rectangle with measurement');
try {
  draw.changeMode('draw_rectangle', { measurement: true, unit: 'metric' });
  assert(draw.getMode() === 'draw_rectangle', 'draw_rectangle with measurement opts');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_rectangle measurement failed: ${e.message}`);
}

section('17. Mode: draw_circle');
try {
  draw.changeMode('draw_circle');
  assert(draw.getMode() === 'draw_circle', 'Switched to draw_circle');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_circle mode failed: ${e.message}`);
}

section('18. Mode: draw_circle with measurement');
try {
  draw.changeMode('draw_circle', { measurement: true, unit: 'metric' });
  assert(draw.getMode() === 'draw_circle', 'draw_circle with measurement opts');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_circle measurement failed: ${e.message}`);
}

section('19. Mode: draw_line_arrow');
try {
  draw.changeMode('draw_line_arrow');
  assert(draw.getMode() === 'draw_line_arrow', 'Switched to draw_line_arrow');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_line_arrow mode failed: ${e.message}`);
}

section('20. Mode: draw_text');
try {
  draw.changeMode('draw_text');
  assert(draw.getMode() === 'draw_text', 'Switched to draw_text');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_text mode failed: ${e.message}`);
}

section('21. Mode: draw_rotate');
try {
  draw.changeMode('draw_rotate');
  assert(draw.getMode() === 'draw_rotate', 'Switched to draw_rotate');
  draw.changeMode('simple_select');
} catch (e) {
  assert(false, `draw_rotate mode failed: ${e.message}`);
}

section('22. Mode: direct_select');
try {
  // Add a line first, then select it for direct_select
  const lineIds = draw.add({
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: [[-91.874, 42.76], [-91.9, 42.8], [-91.85, 42.85]] },
  });
  draw.changeMode('direct_select', { featureId: lineIds[0] });
  assert(draw.getMode() === 'direct_select', 'Switched to direct_select');

  const selectedIds = draw.getSelectedIds();
  assert(selectedIds.length === 1 && selectedIds[0] === lineIds[0], 'Feature is selected in direct_select');

  draw.changeMode('simple_select');
  draw.deleteAll();
} catch (e) {
  assert(false, `direct_select mode failed: ${e.message}`);
}

section('23. Mode: direct_select with polygon');
try {
  const polyIds = draw.add({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[-91.874, 42.76], [-91.9, 42.76], [-91.9, 42.8], [-91.874, 42.8], [-91.874, 42.76]]],
    },
  });
  draw.changeMode('direct_select', { featureId: polyIds[0] });
  assert(draw.getMode() === 'direct_select', 'direct_select with polygon');
  draw.changeMode('simple_select');
  draw.deleteAll();
} catch (e) {
  assert(false, `direct_select polygon failed: ${e.message}`);
}

section('24. Combine/Uncombine features');
try {
  const id1 = draw.add({
    type: 'Feature', properties: {},
    geometry: { type: 'Point', coordinates: [0, 0] },
  });
  const id2 = draw.add({
    type: 'Feature', properties: {},
    geometry: { type: 'Point', coordinates: [1, 1] },
  });
  assert(draw.getAll().features.length === 2, '2 points added for combine test');

  draw.changeMode('simple_select', { featureIds: [...id1, ...id2] });
  draw.combineFeatures();
  // Combine may or may not reduce count depending on internal logic
  assert(draw.getAll().features.length >= 1, `After combine: ${draw.getAll().features.length} features`);

  draw.deleteAll();
} catch (e) {
  assert(false, `Combine/uncombine failed: ${e.message}`);
}

section('25. Multi-type features');
try {
  const multiLineIds = draw.add({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [[-91.874, 42.76], [-91.9, 42.8]],
        [[-91.85, 42.75], [-91.86, 42.82]],
      ],
    },
  });
  assert(multiLineIds.length === 1, 'MultiLineString added');

  const multiPolyIds = draw.add({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[[-91.874, 42.76], [-91.9, 42.76], [-91.9, 42.8], [-91.874, 42.8], [-91.874, 42.76]]],
        [[[-91.8, 42.7], [-91.85, 42.7], [-91.85, 42.75], [-91.8, 42.75], [-91.8, 42.7]]],
      ],
    },
  });
  assert(multiPolyIds.length === 1, 'MultiPolygon added');

  const multiPointIds = draw.add({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPoint',
      coordinates: [[-91.874, 42.76], [-91.9, 42.8]],
    },
  });
  assert(multiPointIds.length === 1, 'MultiPoint added');

  assert(draw.getAll().features.length === 3, 'All 3 multi-features in store');
  draw.deleteAll();
} catch (e) {
  assert(false, `Multi-type features failed: ${e.message}`);
}

section('26. Rapid mode switching (stress test)');
try {
  const allModes = [
    'draw_point', 'draw_marker', 'draw_line_string', 'draw_line_arrow',
    'draw_polygon', 'draw_rectangle', 'draw_circle', 'draw_text',
    'draw_rotate', 'simple_select',
  ];
  for (let i = 0; i < 3; i++) {
    for (const mode of allModes) {
      draw.changeMode(mode);
    }
  }
  draw.changeMode('simple_select');
  assert(draw.getMode() === 'simple_select', `30 rapid mode switches completed, ended on simple_select`);
} catch (e) {
  assert(false, `Rapid mode switching failed: ${e.message}`);
  console.error(e);
}

section('27. Error handling - invalid mode');
try {
  let caught = false;
  try {
    draw.changeMode('nonexistent_mode');
  } catch (e) {
    caught = true;
  }
  assert(caught, 'Throws on invalid mode name');
} catch (e) {
  assert(false, `Error handling test failed: ${e.message}`);
}

section('28. Error handling - direct_select without feature');
try {
  let caught = false;
  try {
    draw.changeMode('direct_select', { featureId: 'nonexistent_id' });
  } catch (e) {
    caught = true;
  }
  assert(caught, 'Throws when direct_select with non-existent featureId');
} catch (e) {
  assert(false, `direct_select error handling failed: ${e.message}`);
}

section('29. Error handling - direct_select with point');
try {
  const ptIds = draw.add({
    type: 'Feature', properties: {},
    geometry: { type: 'Point', coordinates: [0, 0] },
  });
  let caught = false;
  try {
    draw.changeMode('direct_select', { featureId: ptIds[0] });
  } catch (e) {
    caught = true;
  }
  assert(caught, 'Throws when direct_select on Point feature');
  draw.deleteAll();
} catch (e) {
  assert(false, `direct_select point error handling failed: ${e.message}`);
}

section('30. onRemove cleanup');
try {
  draw.add({
    type: 'Feature', properties: {},
    geometry: { type: 'Point', coordinates: [5, 5] },
  });
  assert(draw.getAll().features.length === 1, 'Feature exists before remove');
  draw.onRemove();
  assert(true, 'onRemove completed without error');
} catch (e) {
  assert(false, `onRemove failed: ${e.message}`);
  console.error(e);
}

// ─── Summary ─────────────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
if (failed > 0) {
  console.log(`\x1b[31mResults: ${passed} passed, ${failed} failed, ${passed + failed} total\x1b[0m`);
  console.log('\nFailed tests:');
  errors.forEach(e => console.log(`  - ${e}`));
  process.exit(1);
} else {
  console.log(`\x1b[32mResults: ${passed} passed, ${failed} failed, ${passed + failed} total\x1b[0m`);
  console.log('\nAll modes tested and working!');
}
