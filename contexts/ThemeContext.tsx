/**
 * Theme context with persistent dark/light mode toggle.
 * Stored in AsyncStorage for persistence across app restarts.
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { getData, setData } from '../utils/storage';

const THEME_KEY = '@vehiclo_theme_preference';

export type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeContextType {
  /** The resolved scheme: always 'dark' or 'light' */
  colorScheme: 'dark' | 'light';
  /** The user's preference: 'system', 'dark', or 'light' */
  themeMode: ThemeMode;
  /** Whether we're in dark mode right now */
  isDark: boolean;
  /** Change the theme preference */
  setThemeMode: (mode: ThemeMode) => void;
  /** Cycle through: system → dark → light → system */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark'); // default dark
  const [loaded, setLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    (async () => {
      const saved = await getData<ThemeMode>(THEME_KEY);
      if (saved) setThemeModeState(saved);
      setLoaded(true);
    })();
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    setData(THEME_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(
      themeMode === 'system' ? 'dark' : themeMode === 'dark' ? 'light' : 'system',
    );
  }, [themeMode, setThemeMode]);

  // Resolve actual scheme
  const colorScheme: 'dark' | 'light' =
    themeMode === 'system' ? (systemScheme ?? 'dark') : themeMode;

  const isDark = colorScheme === 'dark';

  // Don't render children until preference is loaded to avoid flash
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ colorScheme, themeMode, isDark, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
