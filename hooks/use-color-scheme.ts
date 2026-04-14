/**
 * useColorScheme hook — uses our ThemeContext instead of system default.
 * Falls back to system scheme if ThemeContext is not available (e.g. during auth splash).
 */
import { useColorScheme as useSystemColorScheme } from 'react-native';

let _useTheme: (() => { colorScheme: 'dark' | 'light' }) | null = null;

// This gets set by the ThemeProvider
export function setThemeHook(hook: typeof _useTheme) {
  _useTheme = hook;
}

export function useColorScheme(): 'dark' | 'light' {
  const system = useSystemColorScheme();
  try {
    // Try to use ThemeContext if available
    const { useTheme } = require('../contexts/ThemeContext');
    const { colorScheme } = useTheme();
    return colorScheme;
  } catch {
    return system ?? 'dark';
  }
}
