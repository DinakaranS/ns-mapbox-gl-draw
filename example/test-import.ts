/**
 * TypeScript Import Test
 *
 * This file verifies that the ns-mapbox-gl-draw package exports
 * correct types and can be consumed by a parent TypeScript project.
 *
 * Run: npx tsc --noEmit example/test-import.ts
 */
import MapboxDraw, { modes, constants, lib } from '../index';
import type {
  DrawOptions,
  DrawAPI,
  DrawContext,
  DrawEvent,
  DrawFeatureInstance,
  ModeObject,
  ModeOpts,
  MeasurementResult,
  Delta,
  ActionState,
  SilentOptions,
  SelectedCoordinate,
  DrawControls,
} from '../index';

// ─── Type Verification ───────────────────────────────────────────
// Verify DrawOptions accepts partial config
const options: Partial<DrawOptions> = {
  displayControlsDefault: false,
  controls: {
    point: true,
    line_string: true,
    polygon: true,
    trash: true,
  },
  userProperties: true,
  touchEnabled: true,
};

// Verify modes are accessible
console.log('Available modes:', Object.keys(modes));

// Verify constants are accessible
console.log('Constants modes:', constants.modes);
console.log('Constants types:', constants.types);
console.log('Constants events:', constants.events);
console.log('Constants geojsonTypes:', constants.geojsonTypes);

// Verify lib utilities are accessible
console.log('Lib exports:', Object.keys(lib));

// Verify type interfaces compile
type TestDrawControls = DrawControls;
type TestActionState = ActionState;
type TestSilentOptions = SilentOptions;
type TestSelectedCoordinate = SelectedCoordinate;
type TestDelta = Delta;
type TestMeasurementResult = MeasurementResult;

const testControls: TestDrawControls = { point: true, line_string: false };
const testAction: TestActionState = { trash: true, combineFeatures: false, uncombineFeatures: false };
const testSilent: TestSilentOptions = { silent: true };
const testCoord: TestSelectedCoordinate = { feature_id: 'abc', coord_path: '0.0' };
const testDelta: TestDelta = { lng: 1.0, lat: 2.0 };
const testMeasurement: TestMeasurementResult = { metric: '100 m', standard: '328 feet' };

// Verify ModeObject interface
const customMode: ModeObject = {
  onSetup(opts: ModeOpts) {
    return { count: 0 };
  },
  onClick(state: any, e: DrawEvent) {
    state.count++;
  },
  toDisplayFeatures(state: any, geojson: any, display: (geojson: any) => void) {
    display(geojson);
  },
};

// Verify MapboxDraw constructor accepts options
const draw = new (MapboxDraw as any)(options);

console.log('All type checks passed!');
console.log('Test variables:', {
  testControls,
  testAction,
  testSilent,
  testCoord,
  testDelta,
  testMeasurement,
  customMode,
  draw,
});
