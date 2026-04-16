/**
 * Settings context — Units, currency, and notification preferences.
 * Persists to AsyncStorage.
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import { getData, setData, KEYS } from '../utils/storage';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'EUR',
  distanceUnit: 'km',
  fuelUnit: 'liters',
  dateFormat: 'DD/MM/YYYY',
  notifications: true,
  darkMode: 'dark',
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  /** Formatted currency symbol */
  currencySymbol: string;
  /** Formatted distance label */
  distanceLabel: string;
  /** Formatted volume label */
  volumeLabel: string;
  /** Convert km to user's unit */
  formatDistanceValue: (km: number) => number;
  /** Convert liters to user's unit */
  formatVolumeValue: (liters: number) => number;
  /** Format a currency amount with user's symbol */
  formatMoney: (amount: number) => string;
  /** Format fuel efficiency in user's units */
  formatEfficiency: (litersPer100km: number) => string;
  /** Format date according to user preference */
  formatDateUser: (dateStr: string) => string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  SEK: 'kr',
  NOK: 'kr',
  CHF: 'CHF',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  INR: '₹',
  BRL: 'R$',
  TRY: '₺',
  PLN: 'zł',
  CZK: 'Kč',
  RON: 'lei',
};

const KM_TO_MI = 0.621371;
const L_TO_GAL = 0.264172;

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getData<AppSettings>(KEYS.SETTINGS);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved });
      setLoaded(true);
    })();
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      setData(KEYS.SETTINGS, next);
      return next;
    });
  }, []);

  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || settings.currency;
  const distanceLabel = settings.distanceUnit === 'km' ? 'km' : 'mi';
  const volumeLabel = settings.fuelUnit === 'liters' ? 'L' : 'gal';

  const formatDistanceValue = useCallback(
    (km: number) => (settings.distanceUnit === 'mi' ? km * KM_TO_MI : km),
    [settings.distanceUnit],
  );

  const formatVolumeValue = useCallback(
    (liters: number) => (settings.fuelUnit === 'gallons' ? liters * L_TO_GAL : liters),
    [settings.fuelUnit],
  );

  const formatMoney = useCallback(
    (amount: number) => `${currencySymbol}${amount.toFixed(2)}`,
    [currencySymbol],
  );

  const formatEfficiency = useCallback(
    (litersPer100km: number) => {
      if (settings.fuelUnit === 'gallons' && settings.distanceUnit === 'mi') {
        // Convert to MPG (US)
        const mpg = litersPer100km > 0 ? 235.215 / litersPer100km : 0;
        return `${mpg.toFixed(1)} MPG`;
      }
      if (settings.fuelUnit === 'gallons') {
        const galPer100km = litersPer100km * L_TO_GAL;
        return `${galPer100km.toFixed(1)} gal/100km`;
      }
      if (settings.distanceUnit === 'mi') {
        // L/100mi
        const lPer100mi = litersPer100km / KM_TO_MI;
        return `${lPer100mi.toFixed(1)} L/100mi`;
      }
      return `${litersPer100km.toFixed(1)} L/100km`;
    },
    [settings.fuelUnit, settings.distanceUnit],
  );

  const formatDateUser = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();

      switch (settings.dateFormat) {
        case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
        case 'DD/MM/YYYY':
        default:
          return `${day}/${month}/${year}`;
      }
    },
    [settings.dateFormat]
  );

  if (!loaded) return null;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        currencySymbol,
        distanceLabel,
        volumeLabel,
        formatDistanceValue,
        formatVolumeValue,
        formatMoney,
        formatEfficiency,
        formatDateUser,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export { CURRENCY_SYMBOLS };
