/**
 * Pure helper functions extracted from script.js so they can be unit-tested
 * without standing up a DOM. Anything in this module must remain a pure
 * function (no DOM access, no module-level mutable state, no localStorage).
 */

/**
 * Returns true if a pair attempt should count as a mistake.
 *
 * Game rule: a mismatched pair counts as a mistake if at least one of the
 * two cards was already explored before this turn. Only "both fresh"
 * mismatches — where the player is genuinely seeing the board for the
 * first time and learning, not guessing against known information — get a
 * free pass.
 *
 * Matched pairs never count as mistakes regardless of explored state.
 *
 * @param {boolean} matched       - whether the two cards form a matching pair
 * @param {boolean} wasExplored1  - card 1 was explored before this turn
 * @param {boolean} wasExplored2  - card 2 was explored before this turn
 * @returns {boolean}
 */
export function shouldCountMistake(matched, wasExplored1, wasExplored2) {
  if (matched) return false;
  return wasExplored1 || wasExplored2;
}

/**
 * Computes the day-rotation index for the daily puzzle.
 *
 * Returns a value in [0, totalDays) representing how many full days have
 * elapsed since the epoch, wrapped into the available puzzle slots. The
 * `(x % n + n) % n` pattern handles dates BEFORE the epoch (negative
 * differences) and dates after a full cycle.
 *
 * @param {number} nowMs     - current time as milliseconds since unix epoch
 * @param {number} epochMs   - puzzle epoch as milliseconds since unix epoch
 * @param {number} totalDays - number of available puzzles to cycle through
 * @returns {number} integer in [0, totalDays)
 */
export function getDayIndex(nowMs, epochMs, totalDays) {
  const msPerDay = 86400000;
  const rawDays = Math.floor((nowMs - epochMs) / msPerDay);
  return ((rawDays % totalDays) + totalDays) % totalDays;
}


/**
 * Sin-based pseudo-random for an integer seed. Returns a number in [0, 1).
 * Cheap, deterministic, and good enough for shuffling a 12-card array
 * (cryptographic quality is not needed). Distinct seeds produce distinct
 * outputs; consecutive integer seeds give well-spread values in practice.
 *
 * @param {number} seed
 * @returns {number} in [0, 1)
 */
export function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * In-place Fisher–Yates shuffle driven by a deterministic, seedable PRNG.
 * Same seed + same input ⇒ same output, so the daily puzzle layout is
 * stable across reloads on the same date.
 *
 * IMPORTANT: the seed is advanced INSIDE this function's scope on every
 * iteration. Earlier versions advanced it inside the random helper, where
 * it was a local-parameter mutation that never persisted across calls —
 * meaning every iteration drew the same number, the shuffle degenerated,
 * and the original adjacency `[pair0a, pair0b, pair1a, pair1b, …]` was
 * preserved on the board. That made the game trivially solvable.
 *
 * @param {Array} array  - mutated in place
 * @param {number} seed  - integer seed; same seed gives same permutation
 */
export function shuffleArray(array, seed) {
  for (let i = array.length - 1; i > 0; i--) {
    seed += 1;
    const j = Math.floor(seededRandom(seed) * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
