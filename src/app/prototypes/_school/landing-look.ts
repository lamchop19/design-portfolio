import { SCHOOL_LOOK, type SchoolLook } from './fish-gl'

/**
 * The look Marc picked in the School lab for the live landing (2026-11-09):
 * blank white, abstract eyeless fish that pass across now and then, ten to
 * start. Copy settings in the lab and paste over this to change it.
 */
export const LANDING_LOOK: SchoolLook = {
  ...SCHOOL_LOOK,
  ground: ['#ffffff', '#ffffff'],
  groundStyle: 'blank',
  light: 0.7,
  particles: 0.6,
  fish: ['#ff5a7a', '#ffb347', '#3f6bff'],
  blend: 'multiply',
  swim: 'pass',
  passGap: 3,
  start: 10,
  perClick: 1,
  most: 30,
  size: 0.028,
  speed: 0.36,
  activity: 0.35,
  spread: 0.5,
  soft: 0.3,
  abstract: 0.38,
  variety: 0.3,
  depth: 0.45,
  tail: 1,
  eyes: false,
  smear: 0.3,
  grain: 0,
  idleAfter: 1,
  idleStyle: 'ambient',
  clearing: '#ffffff',
  clearingStrength: 1,
}
