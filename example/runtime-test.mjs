/**
 * Runtime test for ns-mapbox-gl-draw
 * Tests that the built library can be imported and all exports are correct.
 * Run: node example/runtime-test.mjs
 */

import { createRequire } from 'module';

// Test ESM import
const esmModule = await import('../dist/mapbox-gl-draw.mjs');
const MapboxDraw = esmModule.default;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log('=== ns-mapbox-gl-draw Runtime Tests ===\n');

// ─── Test 1: Default export exists ───
console.log('1. Module Exports');
assert(typeof MapboxDraw === 'function', 'Default export is a function (constructor)');
assert(typeof MapboxDraw.modes === 'object', 'MapboxDraw.modes exists');
assert(typeof MapboxDraw.constants === 'object', 'MapboxDraw.constants exists');
assert(typeof MapboxDraw.lib === 'object', 'MapboxDraw.lib exists');

// ─── Test 2: Constants ───
console.log('\n2. Constants');
const C = MapboxDraw.constants;
assert(C.modes.SIMPLE_SELECT === 'simple_select', 'modes.SIMPLE_SELECT = simple_select');
assert(C.modes.DIRECT_SELECT === 'direct_select', 'modes.DIRECT_SELECT = direct_select');
assert(C.modes.DRAW_POINT === 'draw_point', 'modes.DRAW_POINT = draw_point');
assert(C.modes.DRAW_POLYGON === 'draw_polygon', 'modes.DRAW_POLYGON = draw_polygon');
assert(C.modes.DRAW_LINE_STRING === 'draw_line_string', 'modes.DRAW_LINE_STRING = draw_line_string');
assert(C.types.POLYGON === 'polygon', 'types.POLYGON = polygon');
assert(C.types.LINE === 'line_string', 'types.LINE = line_string');
assert(C.types.POINT === 'point', 'types.POINT = point');
assert(C.events.CREATE === 'draw.create', 'events.CREATE = draw.create');
assert(C.events.DELETE === 'draw.delete', 'events.DELETE = draw.delete');
assert(C.events.UPDATE === 'draw.update', 'events.UPDATE = draw.update');
assert(C.sources.HOT === 'mapbox-gl-draw-hot', 'sources.HOT');
assert(C.sources.COLD === 'mapbox-gl-draw-cold', 'sources.COLD');
assert(C.geojsonTypes.FEATURE === 'Feature', 'geojsonTypes.FEATURE');
assert(C.geojsonTypes.POLYGON === 'Polygon', 'geojsonTypes.POLYGON');
assert(C.geojsonTypes.LINE_STRING === 'LineString', 'geojsonTypes.LINE_STRING');
assert(C.geojsonTypes.POINT === 'Point', 'geojsonTypes.POINT');
assert(C.geojsonTypes.FEATURE_COLLECTION === 'FeatureCollection', 'geojsonTypes.FEATURE_COLLECTION');

// Fork-specific modes are addressable through the public constants, and every
// name there must resolve to a registered mode.
['DRAW_RECTANGLE', 'DRAW_CIRCLE', 'DRAW_TEXT', 'DRAW_LINE_ARROW', 'DRAW_ROTATE', 'DRAW_MARKER']
  .forEach(name => assert(typeof C.modes[name] === 'string', `modes.${name} is defined`));
Object.values(C.modes).forEach(mode =>
  assert(MapboxDraw.modes[mode] !== undefined, `constants.modes "${mode}" has a registered mode`));

// ─── Test 3: All 11 modes registered ───
console.log('\n3. Modes Registry');
const modes = MapboxDraw.modes;
const expectedModes = [
  'simple_select', 'direct_select', 'draw_point', 'draw_polygon',
  'draw_line_string', 'draw_rectangle', 'draw_circle', 'draw_text',
  'draw_line_arrow', 'draw_rotate', 'draw_marker'
];
expectedModes.forEach(mode => {
  assert(modes[mode] !== undefined, `Mode "${mode}" is registered`);
});
assert(Object.keys(modes).length === expectedModes.length, `Exactly ${expectedModes.length} modes registered`);

// ─── Test 4: Lib utilities ───
console.log('\n4. Lib Utilities');
const lib = MapboxDraw.lib;
const expectedLibExports = [
  'CommonSelectors', 'constrainFeatureMovement', 'createMidPoint',
  'createSupplementaryPoints', 'createVertex', 'doubleClickZoom',
  'euclideanDistance', 'featuresAt', 'getFeatureAtAndSetCursors',
  'isClick', 'isEventAtCoordinates', 'isTap', 'mapEventToBoundingBox',
  'ModeHandler', 'moveFeatures', 'sortFeatures', 'stringSetsAreEqual',
  'StringSet', 'theme', 'toDenseArray',
  // Fork-specific helpers backing the custom modes.
  'createAdditionalVertex', 'createDistance'
];
expectedLibExports.forEach(name => {
  assert(lib[name] !== undefined, `lib.${name} is exported`);
});

// ─── Test 5: Lib function tests ───
console.log('\n5. Lib Function Tests');

// euclideanDistance
const dist = lib.euclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
assert(dist === 5, `euclideanDistance({0,0}, {3,4}) = ${dist} (expected 5)`);

// toDenseArray
const dense = lib.toDenseArray([1, undefined, 3]);
assert(dense.length === 2 && dense[0] === 1 && dense[1] === 3, 'toDenseArray filters undefined');

const denseSingle = lib.toDenseArray('hello');
assert(denseSingle.length === 1 && denseSingle[0] === 'hello', 'toDenseArray wraps single value');

// stringSetsAreEqual
assert(lib.stringSetsAreEqual(['a', 'b'], ['b', 'a']) === true, 'stringSetsAreEqual same sets');
assert(lib.stringSetsAreEqual(['a'], ['b']) === false, 'stringSetsAreEqual different sets');

// isClick
const clickResult = lib.isClick(
  { point: { x: 0, y: 0 }, time: 1000 },
  { point: { x: 1, y: 1 }, time: 1100 }
);
assert(clickResult === true, 'isClick detects small movement as click');

const dragResult = lib.isClick(
  { point: { x: 0, y: 0 }, time: 1000 },
  { point: { x: 100, y: 100 }, time: 5000 }
);
assert(dragResult === false, 'isClick detects large movement as drag');

// isTap
const tapResult = lib.isTap(
  { point: { x: 5, y: 5 }, time: 1000 },
  { point: { x: 6, y: 6 }, time: 1050 }
);
assert(tapResult === true, 'isTap detects small movement as tap');

// StringSet
const set = new lib.StringSet(['a', 'b', 'c']);
assert(set.has('a') === true, 'StringSet.has("a") = true');
assert(set.has('z') === false, 'StringSet.has("z") = false');
set.add('d');
assert(set.has('d') === true, 'StringSet.add("d") works');
set.delete('a');
assert(set.has('a') === false, 'StringSet.delete("a") works');
assert(set.values().length === 3, 'StringSet.values() returns correct count');
set.clear();
assert(set.values().length === 0, 'StringSet.clear() empties set');

// isEventAtCoordinates
assert(
  lib.isEventAtCoordinates({ lngLat: { lng: 10, lat: 20 } }, [10, 20]) === true,
  'isEventAtCoordinates matches'
);
assert(
  lib.isEventAtCoordinates({ lngLat: { lng: 10, lat: 20 } }, [30, 40]) === false,
  'isEventAtCoordinates rejects mismatch'
);

// mapEventToBoundingBox
const bbox = lib.mapEventToBoundingBox({ point: { x: 100, y: 200 } }, 5);
assert(
  bbox[0][0] === 95 && bbox[0][1] === 195 && bbox[1][0] === 105 && bbox[1][1] === 205,
  'mapEventToBoundingBox computes correct bbox'
);

// createVertex
const vertex = lib.createVertex('parent1', [10, 20], '0.1', true);
assert(vertex.type === 'Feature', 'createVertex returns Feature');
assert(vertex.properties.meta === 'vertex', 'createVertex meta = vertex');
assert(vertex.properties.parent === 'parent1', 'createVertex parent correct');
assert(vertex.properties.active === 'true', 'createVertex active when selected');
assert(vertex.geometry.coordinates[0] === 10, 'createVertex coordinates correct');

// createMidPoint
const v1 = lib.createVertex('p', [0, 0], '0', false);
const v2 = lib.createVertex('p', [10, 10], '1', false);
const mid = lib.createMidPoint('p', v1, v2);
assert(mid !== null, 'createMidPoint returns result');
assert(mid.properties.meta === 'midpoint', 'createMidPoint meta = midpoint');
assert(mid.geometry.coordinates[0] === 5, 'createMidPoint lng midpoint');
// Midpoint is computed in Web Mercator (upstream 1.5.1) so it lands on the line
// as actually rendered, not on the naive lat/lng average (which would be 5).
assert(mid.geometry.coordinates[1] === 5.0191481, 'createMidPoint lat midpoint (Web Mercator)');

// CommonSelectors
assert(typeof lib.CommonSelectors.isOfMetaType === 'function', 'CommonSelectors.isOfMetaType is function');
assert(typeof lib.CommonSelectors.isFeature === 'function', 'CommonSelectors.isFeature is function');
assert(typeof lib.CommonSelectors.noTarget === 'function', 'CommonSelectors.noTarget is function');
assert(typeof lib.CommonSelectors.isEscapeKey === 'function', 'CommonSelectors.isEscapeKey is function');
assert(typeof lib.CommonSelectors.isEnterKey === 'function', 'CommonSelectors.isEnterKey is function');
assert(lib.CommonSelectors.noTarget({ featureTarget: undefined }) === true, 'noTarget works');
assert(lib.CommonSelectors.isEscapeKey({ keyCode: 27 }) === true, 'isEscapeKey works');
assert(lib.CommonSelectors.isEnterKey({ keyCode: 13 }) === true, 'isEnterKey works');

// KeyboardEvent.key selectors (upstream 1.5.1) — legacy keyCode still honoured.
assert(lib.CommonSelectors.isEscapeKey({ key: 'Escape' }) === true, 'isEscapeKey via event.key');
assert(lib.CommonSelectors.isEnterKey({ key: 'Enter' }) === true, 'isEnterKey via event.key');
assert(lib.CommonSelectors.isBackspaceKey({ key: 'Backspace' }) === true, 'isBackspaceKey via event.key');
assert(lib.CommonSelectors.isBackspaceKey({ keyCode: 8 }) === true, 'isBackspaceKey via keyCode');
assert(lib.CommonSelectors.isDeleteKey({ key: 'Delete' }) === true, 'isDeleteKey via event.key');
assert(lib.CommonSelectors.isDeleteKey({ keyCode: 46 }) === true, 'isDeleteKey via keyCode');
assert(lib.CommonSelectors.isDigit1Key({ key: '1' }) === true, 'isDigit1Key via event.key');
assert(lib.CommonSelectors.isDigit2Key({ key: '2' }) === true, 'isDigit2Key via event.key');
assert(lib.CommonSelectors.isDigit3Key({ key: '3' }) === true, 'isDigit3Key via event.key');
assert(lib.CommonSelectors.isDigitKey({ key: '7' }) === true, 'isDigitKey matches a digit');
assert(lib.CommonSelectors.isDigitKey({ key: 'a' }) === false, 'isDigitKey rejects a letter');
assert(lib.CommonSelectors.isDigitKey({}) === false, 'isDigitKey rejects an empty event');

// createDistance — imperial area must report acres AND square feet, e.g.
// "4.93 ac (214,789.98 ft²)". Metric stays m²/km².
const rectFeature = {
  type: 'Feature',
  properties: { name: 'Rectangle' },
  geometry: {
    type: 'Polygon',
    coordinates: [[[0, 0], [0.0017966, 0], [0.0017966, 0.0008983], [0, 0.0008983], [0, 0]]],
  },
};
const rectMeasure = lib.createDistance(rectFeature);
assert(rectMeasure.standard.includes('ft²'), 'createDistance standard area includes ft²');
assert(rectMeasure.standard.includes('ac'), 'createDistance standard area includes acres');
assert(/[\d,]+\.\d\d ft²/.test(rectMeasure.standard), 'ft² value is comma-grouped to 2dp');
assert(rectMeasure.metric.includes('m²'), 'createDistance metric area uses m²');
assert(!rectMeasure.metric.includes('ft'), 'createDistance metric area has no imperial units');

// Acres and square feet must describe the same area (43,560 ft² per acre).
const [, acStr, sqftStr] = rectMeasure.standard.match(/([\d,.]+) ac \(([\d,.]+) ft²\)/);
const acVal = Number(acStr.replace(/,/g, ''));
const sqftVal = Number(sqftStr.replace(/,/g, ''));
assert(Math.abs(acVal - sqftVal / 43560) < 0.01, 'acres and ft² agree (43,560 ft² per acre)');

// A circle carries meta:radius and reports Radius/Perimeter/Area, also in ft².
const ring = [];
for (let i = 0; i < 64; i++) {
  const a = (i / 64) * 2 * Math.PI;
  ring.push([0.0009 * Math.cos(a), 0.0009 * Math.sin(a)]);
}
ring.push(ring[0]);
const circleMeasure = lib.createDistance({
  type: 'Feature',
  properties: { meta: 'radius' },
  geometry: { type: 'Polygon', coordinates: [ring] },
});
assert(circleMeasure.standard.startsWith('Radius:'), 'createDistance radius label for meta=radius');
assert(circleMeasure.standard.includes('ft²'), 'circle standard area includes ft²');

// theme — measurement labels must not wrap at Mapbox's 10em default, or the
// combined "33.83 ac (1,473,751.86 ft²)" area gets split across lines.
['gl-draw-radius-label-active', 'gl-draw-radius-label-inactive'].forEach(id => {
  const layer = lib.theme.find(l => l.id === id);
  assert(layer !== undefined, `theme has layer ${id}`);
  assert(layer.layout['text-max-width'] === 30, `${id} sets text-max-width to 30`);
});

// theme
assert(Array.isArray(lib.theme), 'theme is an array');
assert(lib.theme.length > 20, `theme has ${lib.theme.length} style layers (>20)`);

// ─── Test 6: CJS import ───
console.log('\n6. CJS Import');
const require = createRequire(import.meta.url);
const cjsModule = require('../dist/mapbox-gl-draw.cjs');
assert(typeof cjsModule === 'object', 'CJS module loads');
assert(typeof cjsModule.default === 'function', 'CJS has default export (constructor)');
assert(typeof cjsModule.default.modes === 'object', 'CJS MapboxDraw.modes exists');
assert(typeof cjsModule.default.constants === 'object', 'CJS MapboxDraw.constants exists');
assert(typeof cjsModule.modes === 'object', 'CJS named export: modes');
assert(typeof cjsModule.constants === 'object', 'CJS named export: constants');
assert(typeof cjsModule.lib === 'object', 'CJS named export: lib');

// ─── Test 7: Type declarations exist ───
console.log('\n7. Type Declarations');
import { readFileSync } from 'fs';
const dts = readFileSync(new URL('../dist/index.d.ts', import.meta.url), 'utf-8');
assert(dts.includes('DrawOptions'), 'index.d.ts exports DrawOptions');
assert(dts.includes('DrawAPI'), 'index.d.ts exports DrawAPI');
assert(dts.includes('DrawContext'), 'index.d.ts exports DrawContext');
assert(dts.includes('DrawEvent'), 'index.d.ts exports DrawEvent');
assert(dts.includes('ModeObject'), 'index.d.ts exports ModeObject');
assert(dts.includes('ActionState'), 'index.d.ts exports ActionState');
assert(dts.includes('MeasurementResult'), 'index.d.ts exports MeasurementResult');
assert(dts.includes('DrawFeatureInstance'), 'index.d.ts exports DrawFeatureInstance');

// ─── Summary ───
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(40));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
}
