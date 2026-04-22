export const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF2D55',
  card: '#F2F2F7',
  border: '#C6C6C8',
  isDark: false,
};

export const darkTheme = {
  background: '#000000',
  text: '#FFFFFF',
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  accent: '#FF375F',
  card: '#1C1C1E',
  border: '#38383A',
  isDark: true,
};

export type Theme = typeof lightTheme;
