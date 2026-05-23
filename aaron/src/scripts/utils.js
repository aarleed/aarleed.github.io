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
