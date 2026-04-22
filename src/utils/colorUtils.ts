import { interpolateColor } from 'react-native-reanimated';

/**
 * Converts a hex color string to an RGB object.
 * Useful for manual calculations if needed, though Reanimated's interpolateColor
 * can handle hex strings directly.
 */
export const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

/**
 * Ensures a color string is in a format Reanimated can work with.
 * For this project, we'll mostly use hex or rgb strings.
 */
export const ensureColorFormat = (color: string): string => {
  // In a more complex app, we might do more validation here.
  return color;
};
