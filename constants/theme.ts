/**
 * Vehiclo Design System
 * Dark-first automotive theme with vibrant accent colors.
 */

import { Platform } from 'react-native';

// ── Brand Palette ──────────────────────────────────────────────
export const Brand = {
  primary: '#00D4AA',       // Mint/teal — the hero color
  primaryDark: '#00B894',
  primaryLight: '#55EFC4',
  accent: '#6C5CE7',        // Purple accent
  accentLight: '#A29BFE',
  warning: '#FDCB6E',
  warningDark: '#E17055',
  danger: '#FF6B6B',
  dangerLight: '#FF8A8A',
  success: '#00D4AA',
  successDark: '#00B894',
  info: '#74B9FF',
  infoDark: '#0984E3',
  ev: '#00CEFF',             // EV-specific accent
  evDark: '#0097E6',
  gig: '#FF9FF3',            // Solo Driver accent
  gigDark: '#F368E0',
};

// ── Color Tokens ───────────────────────────────────────────────
export const Colors = {
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    tint: Brand.primary,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: Brand.primary,
    overlay: 'rgba(0,0,0,0.5)',
    inputBg: '#F3F4F6',
    shadow: 'rgba(0,0,0,0.08)',
    divider: '#E5E7EB',
    healthGreen: '#00D4AA',
    healthYellow: '#FDCB6E',
    healthRed: '#FF6B6B',
    gradientStart: '#00D4AA',
    gradientEnd: '#6C5CE7',
  },
  dark: {
    background: '#0A0E17',
    surface: '#131A2A',
    surfaceElevated: '#1A2332',
    card: '#151D2E',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#1E293B',
    borderLight: '#1E293B',
    tint: Brand.primary,
    icon: '#64748B',
    tabIconDefault: '#475569',
    tabIconSelected: Brand.primary,
    overlay: 'rgba(0,0,0,0.7)',
    inputBg: '#1A2332',
    shadow: 'rgba(0,0,0,0.3)',
    divider: '#1E293B',
    healthGreen: '#00D4AA',
    healthYellow: '#FDCB6E',
    healthRed: '#FF6B6B',
    gradientStart: '#00D4AA',
    gradientEnd: '#6C5CE7',
  },
};

// ── Typography ─────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// ── Spacing ────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// ── Border Radius ──────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// ── Vehicle Colors (avatars) ───────────────────────────────────
export const VehicleColors = [
  '#00D4AA', '#6C5CE7', '#FF6B6B', '#FDCB6E',
  '#74B9FF', '#FF9FF3', '#55E6C1', '#FD79A8',
  '#00CEFF', '#E17055', '#A29BFE', '#81ECEC',
];

// ── Expense Categories ─────────────────────────────────────────
export const ExpenseCategories = [
  { key: 'fuel', label: 'Fuel', icon: 'gas-station', color: '#00D4AA' },
  { key: 'maintenance', label: 'Maintenance', icon: 'wrench', color: '#6C5CE7' },
  { key: 'insurance', label: 'Insurance', icon: 'shield-check', color: '#74B9FF' },
  { key: 'tax', label: 'Tax & Fees', icon: 'file-document', color: '#FDCB6E' },
  { key: 'parking', label: 'Parking', icon: 'parking', color: '#FF9FF3' },
  { key: 'toll', label: 'Tolls', icon: 'road-variant', color: '#E17055' },
  { key: 'wash', label: 'Car Wash', icon: 'car-wash', color: '#55E6C1' },
  { key: 'charging', label: 'Charging', icon: 'ev-station', color: '#00CEFF' },
  { key: 'other', label: 'Other', icon: 'dots-horizontal', color: '#94A3B8' },
];

// ── Maintenance Types ──────────────────────────────────────────
export const MaintenanceTypes = [
  { key: 'oil', label: 'Oil Change', icon: 'oil', intervalKm: 10000 },
  { key: 'tires', label: 'Tire Service', icon: 'tire', intervalKm: 40000 },
  { key: 'brakes', label: 'Brake Service', icon: 'car-brake-alert', intervalKm: 30000 },
  { key: 'battery', label: 'Battery', icon: 'car-battery', intervalKm: 50000 },
  { key: 'filter', label: 'Air Filter', icon: 'air-filter', intervalKm: 20000 },
  { key: 'inspection', label: 'Inspection', icon: 'clipboard-check', intervalKm: 15000 },
  { key: 'insurance', label: 'Insurance Renewal', icon: 'shield-check', intervalKm: 0 },
  { key: 'other', label: 'Other', icon: 'wrench', intervalKm: 0 },
];
