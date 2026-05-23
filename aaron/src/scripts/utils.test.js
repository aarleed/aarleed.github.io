import { describe, it, expect } from 'vitest';
import { shouldCountMistake, getDayIndex } from './utils.js';

describe('shouldCountMistake — full truth table', () => {
  // Matched pairs are never mistakes regardless of whether the cards
  // had been seen before this turn.
  describe('when the pair matches', () => {
    it.each([
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ])('returns false (matched=true, wasExplored1=%s, wasExplored2=%s)', (e1, e2) => {
      expect(shouldCountMistake(true, e1, e2)).toBe(false);
    });
  });

  // Mismatched pairs only count as mistakes if at least one card was
  // already explored before this turn.
  describe('when the pair does not match', () => {
    it('both cards fresh — no mistake (player is learning the board)', () => {
      expect(shouldCountMistake(false, false, false)).toBe(false);
    });

    it('first card previously explored, second fresh — mistake', () => {
      // This is the case that was silently broken before PR #25 — the
      // legacy rule "both must be explored" plus the click-1-mutates-
      // explored timing flaw made this combination skip the counter.
      expect(shouldCountMistake(false, true, false)).toBe(true);
    });

    it('first card fresh, second previously explored — mistake', () => {
      expect(shouldCountMistake(false, false, true)).toBe(true);
    });

    it('both cards previously explored — mistake', () => {
      expect(shouldCountMistake(false, true, true)).toBe(true);
    });
  });
});

describe('getDayIndex — daily puzzle rotation', () => {
  const ms = (y, m, d) => new Date(y, m, d).getTime();
  const epoch = ms(2025, 4, 1); // May 1, 2025 — matches WORD_PAIR_EPOCH in script.js
  const TOTAL = 7;

  it('returns 0 when today is the epoch', () => {
    expect(getDayIndex(epoch, epoch, TOTAL)).toBe(0);
  });

  it('returns 1 the day after the epoch', () => {
    expect(getDayIndex(ms(2025, 4, 2), epoch, TOTAL)).toBe(1);
  });

  it('returns N-1 the day before a full cycle completes', () => {
    expect(getDayIndex(ms(2025, 4, 1 + (TOTAL - 1)), epoch, TOTAL)).toBe(TOTAL - 1);
  });

  it('wraps back to 0 on the day a full cycle completes', () => {
    expect(getDayIndex(ms(2025, 4, 1 + TOTAL), epoch, TOTAL)).toBe(0);
  });

  it('wraps correctly several cycles into the future', () => {
    // 3 full cycles + 4 days = same slot as epoch + 4
    expect(getDayIndex(ms(2025, 4, 1 + (3 * TOTAL + 4)), epoch, TOTAL)).toBe(4);
  });

  it('returns a valid in-range index for dates BEFORE the epoch', () => {
    // The double-modulo pattern is here specifically to handle players
    // whose system clock is set before the epoch. Naive `% n` would yield
    // a negative index and crash WORDS[dayIndex].
    const beforeEpoch = ms(2025, 3, 28); // April 28, 2025 — 3 days before epoch
    const idx = getDayIndex(beforeEpoch, epoch, TOTAL);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(TOTAL);
    expect(idx).toBe(TOTAL - 3); // -3 mod 7 = 4
  });

  it('always returns an integer in [0, totalDays) across a wide range', () => {
    // Light fuzz: spot-check 200 day offsets in both directions.
    for (let offset = -100; offset <= 100; offset++) {
      const idx = getDayIndex(epoch + offset * 86400000, epoch, TOTAL);
      expect(Number.isInteger(idx)).toBe(true);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(TOTAL);
    }
  });
});
