import { describe, it, expect } from 'vitest';
import {
  VIBRANT,
  PASTEL,
  RED, GREEN, YELLOW, BLUE, PURPLE, ORANGE,
  DARK_TEXT_VIBRANT_INDEX,
  MAX_MISTAKES,
} from './config.js';

describe('config — vibrant/pastel pair colors', () => {
  it('VIBRANT has six colors (one per pair)', () => {
    expect(VIBRANT).toHaveLength(6);
  });

  it('PASTEL has six colors (one per pair)', () => {
    expect(PASTEL).toHaveLength(6);
  });

  it('every VIBRANT color is unique — each pair gets its own', () => {
    expect(new Set(VIBRANT).size).toBe(VIBRANT.length);
  });

  it('every PASTEL color is unique — regression for the GREEN_PASTEL/BLUE_PASTEL duplicate', () => {
    expect(new Set(PASTEL).size).toBe(PASTEL.length);
  });

  it('VIBRANT order matches the Figma stats-sheet pair numbering: RED, GREEN, YELLOW, BLUE, PURPLE, ORANGE', () => {
    expect(VIBRANT).toEqual([RED, GREEN, YELLOW, BLUE, PURPLE, ORANGE]);
  });

  it('DARK_TEXT_VIBRANT_INDEX points at YELLOW (the only vibrant color light enough to need dark text)', () => {
    expect(VIBRANT[DARK_TEXT_VIBRANT_INDEX]).toBe(YELLOW);
  });

  it('all hex values are 7-character #RRGGBB strings', () => {
    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    VIBRANT.forEach((c) => expect(c).toMatch(hexRe));
    PASTEL.forEach((c) => expect(c).toMatch(hexRe));
  });
});

describe('config — game tuning', () => {
  it('MAX_MISTAKES is 6', () => {
    // The HTML has 6 mistake dots and the instructions copy says
    // "without making 6 mistakes" — keep them aligned.
    expect(MAX_MISTAKES).toBe(6);
  });
});
