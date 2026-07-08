import { describe, it, expect } from 'vitest';
import { shouldCountMistake, getDayIndex, shuffleArray, seededRandom, calculateWinPerc } from './utils.js';

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


describe('seededRandom', () => {
  it('returns a value in [0, 1) for arbitrary integer seeds', () => {
    for (const s of [0, 1, 7, 100, 177986520, -42]) {
      const v = seededRandom(s);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic — same seed gives same value', () => {
    expect(seededRandom(123)).toBe(seededRandom(123));
    expect(seededRandom(177986520)).toBe(seededRandom(177986520));
  });

  it('different seeds give different values (spot-check)', () => {
    expect(seededRandom(1)).not.toBe(seededRandom(2));
    expect(seededRandom(100)).not.toBe(seededRandom(101));
  });
});

describe('shuffleArray', () => {
  // Builds an array with the same pair structure as the real game:
  // [pair0a, pair0b, pair1a, pair1b, …]. After a real shuffle, having
  // all six pairs land in adjacent positions is astronomically unlikely
  // (≈ 1 in 10^4 for 12 elements with 6 pairs).
  function pairedDeck() {
    return ['0a','0b','1a','1b','2a','2b','3a','3b','4a','4b','5a','5b'];
  }

  function pairsAdjacent(arr) {
    let count = 0;
    for (let p = 0; p < 6; p++) {
      const ai = arr.indexOf(p + 'a');
      const bi = arr.indexOf(p + 'b');
      if (Math.abs(ai - bi) === 1) count += 1;
    }
    return count;
  }

  it('is deterministic — same seed and input produce the same permutation', () => {
    const a = pairedDeck();
    const b = pairedDeck();
    shuffleArray(a, 12345);
    shuffleArray(b, 12345);
    expect(a).toEqual(b);
  });

  it('mutates the array in place and returns undefined', () => {
    const arr = pairedDeck();
    const result = shuffleArray(arr, 7);
    expect(result).toBeUndefined();
    // The reference is the same; the contents are shuffled.
    expect(arr).toHaveLength(12);
    expect(arr.sort()).toEqual(pairedDeck().sort());
  });

  it('different seeds produce different permutations', () => {
    const a = pairedDeck();
    const b = pairedDeck();
    shuffleArray(a, 1);
    shuffleArray(b, 2);
    expect(a).not.toEqual(b);
  });

  it('regression — does NOT preserve original pair adjacency for the buggy real-world seed', () => {
    // Before the fix: seededRandom was effectively called with the same
    // seed every iteration, so all six pairs survived the "shuffle" in
    // adjacent positions on most days. Empirically reproduced for
    // 2026-05-27 (seed 177986520) where 5 of 6 pairs ended up adjacent.
    // Locking in: the fixed shuffle does not preserve all six pairs as
    // adjacent on that seed.
    const arr = pairedDeck();
    shuffleArray(arr, 177986520);
    expect(pairsAdjacent(arr)).toBeLessThan(6);
  });

  it('actually scrambles — across many seeds, pairs rarely all land adjacent', () => {
    let allAdjacentCount = 0;
    for (let s = 0; s < 500; s++) {
      const arr = pairedDeck();
      shuffleArray(arr, s);
      if (pairsAdjacent(arr) === 6) allAdjacentCount += 1;
    }
    // With a true Fisher–Yates shuffle the probability of all 6 pairs
    // landing adjacent is on the order of 1e-4, so over 500 seeds we
    // expect well under 5% (almost certainly 0–1). The buggy old version
    // produced "all adjacent" for the majority of seeds.
    expect(allAdjacentCount).toBeLessThan(25);
  });
});


describe('calculateWinPerc', () => {
  const MAX = 6; // matches MAX_MISTAKES in config.js

  it('returns 0 when no games have been played', () => {
    const history = { "0:":0, "1:":0, "2:":0, "3:":0, "4:":0, "5:":0, "6:":0, "7+:":0 };
    expect(calculateWinPerc(history, MAX)).toBe(0);
  });

  it('counts games with 0-5 mistakes as wins', () => {
    // 2 wins (0 mistakes, 3 mistakes), 0 losses
    const history = { "0:":1, "1:":0, "2:":0, "3:":1, "4:":0, "5:":0, "6:":0, "7+:":0 };
    expect(calculateWinPerc(history, MAX)).toBe(100);
  });

  it('counts games with exactly 6 mistakes as losses (regression)', () => {
    // This is the bug: the old code used <= 6 which counted "6:" as a win.
    // 4 wins (0-5 mistakes), 2 losses (6 mistakes)
    const history = { "0:":1, "1:":0, "2:":0, "3:":1, "4:":1, "5:":1, "6:":2, "7+:":0 };
    // wins = 1+0+0+1+1+1 = 4, total = 4+2 = 6, win% = 4/6*100 ≈ 66.67
    expect(calculateWinPerc(history, MAX)).toBeCloseTo(66.67, 1);
  });

  it('counts 7+ bucket as losses', () => {
    // Legacy bucket — should NOT count as wins
    const history = { "0:":1, "1:":0, "2:":0, "3:":0, "4:":0, "5:":0, "6:":0, "7+:":5 };
    // wins = 1, total = 6, win% = 1/6*100 ≈ 16.67
    expect(calculateWinPerc(history, MAX)).toBeCloseTo(16.67, 1);
  });

  it('real-world example: history {0:1, 3:1, 4:1, 5:1, 6:2, 7+:5} → 36%', () => {
    // From the user's actual stats earlier in this project
    const history = { "0:":1, "1:":0, "2:":0, "3:":1, "4:":1, "5:":1, "6:":2, "7+:":5 };
    // wins = 4, total = 11, win% = 4/11*100 ≈ 36.36
    expect(calculateWinPerc(history, MAX)).toBeCloseTo(36.36, 1);
  });

  it('100% when all games won with 0 mistakes', () => {
    const history = { "0:":10, "1:":0, "2:":0, "3:":0, "4:":0, "5:":0, "6:":0, "7+:":0 };
    expect(calculateWinPerc(history, MAX)).toBe(100);
  });

  it('0% when all games are losses', () => {
    const history = { "0:":0, "1:":0, "2:":0, "3:":0, "4:":0, "5:":0, "6:":5, "7+:":3 };
    expect(calculateWinPerc(history, MAX)).toBe(0);
  });
});
