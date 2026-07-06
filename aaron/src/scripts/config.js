// Vibrant (win state)
export const ORANGE = '#EB6800';
export const GREEN = '#009952';
export const BLUE = '#0062CF';
export const YELLOW = '#F6BC26';
export const RED = '#D82233';
export const PURPLE = '#9A38A1';

// Pastel (loss state)
export const ORANGE_PASTEL = '#F2D8C5';
export const GREEN_PASTEL = '#D0E7DC';
export const BLUE_PASTEL = '#CFDEF0';
export const YELLOW_PASTEL = '#F4E9CC';
export const RED_PASTEL = '#F0D5D9';
export const PURPLE_PASTEL = '#E7D8E9';

// Pastel (loss state) — dark mode. Figma "Fill/*/secondary" tokens.
export const ORANGE_PASTEL_DARK = '#643D23';
export const GREEN_PASTEL_DARK = '#1D4C3C';
export const BLUE_PASTEL_DARK = '#1D3C61';
export const YELLOW_PASTEL_DARK = '#67572E';
export const RED_PASTEL_DARK = '#5E2832';
export const PURPLE_PASTEL_DARK = '#4C2F53';

// Text
export const TEXT_LIGHT = '#ffffff';
export const TEXT_DARK = '#1F2025';

// Ordered arrays for pair assignment.
// Order matches the Figma stats-sheet "Answers" pair numbering:
//   Pair 1=RED, 2=GREEN, 3=YELLOW, 4=BLUE, 5=PURPLE, 6=ORANGE.
// All six are unique so each pair gets its own distinct color.
export const VIBRANT = [RED, GREEN, YELLOW, BLUE, PURPLE, ORANGE];
export const PASTEL = [RED_PASTEL, GREEN_PASTEL, YELLOW_PASTEL, BLUE_PASTEL, PURPLE_PASTEL, ORANGE_PASTEL];
export const PASTEL_DARK = [RED_PASTEL_DARK, GREEN_PASTEL_DARK, YELLOW_PASTEL_DARK, BLUE_PASTEL_DARK, PURPLE_PASTEL_DARK, ORANGE_PASTEL_DARK];

// Index of yellow (uses dark text even in vibrant state because the bg is too light for white).
export const DARK_TEXT_VIBRANT_INDEX = 2;

// Game config
export const MAX_MISTAKES = 6;
