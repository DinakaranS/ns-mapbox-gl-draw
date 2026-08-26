import * as Constants from '../constants';
import type { DrawEvent } from '../types';

export function isOfMetaType(type: string): (e: DrawEvent) => boolean {
  return function (e: DrawEvent): boolean {
    const featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === type;
  };
}

export function isShiftMousedown(e: DrawEvent): boolean {
  if (!e.originalEvent) return false;
  if (!(e.originalEvent as MouseEvent).shiftKey) return false;
  return (e.originalEvent as MouseEvent).button === 0;
}

export function isActiveFeature(e: DrawEvent): boolean {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return (
    e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE
  );
}

export function isInactiveFeature(e: DrawEvent): boolean {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return (
    e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
    e.featureTarget.properties.meta === Constants.meta.FEATURE
  );
}

export function noTarget(e: DrawEvent): boolean {
  return e.featureTarget === undefined;
}

export function isFeature(e: DrawEvent): boolean {
  if (!e.featureTarget) return false;
  if (!e.featureTarget.properties) return false;
  return e.featureTarget.properties.meta === Constants.meta.FEATURE;
}

export function isVertex(e: DrawEvent): boolean {
  const featureTarget = e.featureTarget;
  if (!featureTarget) return false;
  if (!featureTarget.properties) return false;
  return featureTarget.properties.meta === Constants.meta.VERTEX;
}

export function isShiftDown(e: DrawEvent): boolean {
  if (!e.originalEvent) return false;
  return (e.originalEvent as unknown as { shiftKey: boolean }).shiftKey === true;
}

export function isEscapeKey(e: DrawEvent): boolean {
  return e.key === 'Escape' || e.keyCode === 27;
}

export function isEnterKey(e: DrawEvent): boolean {
  return e.key === 'Enter' || e.keyCode === 13;
}

export function isBackspaceKey(e: DrawEvent): boolean {
  return e.key === 'Backspace' || e.keyCode === 8;
}

export function isDeleteKey(e: DrawEvent): boolean {
  return e.key === 'Delete' || e.keyCode === 46;
}

export function isDigit1Key(e: DrawEvent): boolean {
  return e.key === '1' || e.keyCode === 49;
}

export function isDigit2Key(e: DrawEvent): boolean {
  return e.key === '2' || e.keyCode === 50;
}

export function isDigit3Key(e: DrawEvent): boolean {
  return e.key === '3' || e.keyCode === 51;
}

export function isDigitKey(e: DrawEvent): boolean {
  const key = e.key || (e.keyCode !== undefined ? String.fromCharCode(e.keyCode) : '');
  return key >= '0' && key <= '9';
}

export function isTrue(): boolean {
  return true;
}
