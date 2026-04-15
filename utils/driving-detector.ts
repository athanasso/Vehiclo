/**
 * Wrapper for the Native Android Activity Recognition local module.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ActivityRecognition from '../modules/activity-recognition';
import * as Location from 'expo-location';

const TRACKING_STATE_KEY = '@vehiclo_tracking_active';

// ── Permission helpers ───────────────────────────────────────
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return false;

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    return bg === 'granted';
  } catch {
    return false;
  }
}

// ── Start / Stop tracking ────────────────────────────────────
export async function startDrivingDetection(): Promise<boolean> {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) return false;

  const success = ActivityRecognition.startObserving();
  if (success) {
    await AsyncStorage.setItem(TRACKING_STATE_KEY, 'true');
  }
  return success;
}

export async function stopDrivingDetection(): Promise<void> {
  ActivityRecognition.stopObserving();
  await AsyncStorage.setItem(TRACKING_STATE_KEY, 'false');
}

export async function isTrackingActive(): Promise<boolean> {
  const val = await AsyncStorage.getItem(TRACKING_STATE_KEY);
  return val === 'true';
}

// ── Pending trip management ──────────────────────────────────
export interface PendingTrip {
  startTime: string;
  endTime: string;
  distanceKm: number;
  points: any[]; // Kept for compatibility, native module does not return all points
}

export async function getPendingTrip(): Promise<PendingTrip | null> {
  try {
    // Read the distance directly from Native Android SharedPreferences
    const distanceKm = ActivityRecognition.getPendingDistanceKm();
    if (distanceKm < 0.5) return null;

    return {
      startTime: new Date(Date.now() - 3600000).toISOString(), // Mock time
      endTime: new Date().toISOString(),
      distanceKm,
      points: [],
    };
  } catch {
    return null;
  }
}

export async function clearPendingTrip(): Promise<void> {
  ActivityRecognition.clearPendingDistance();
}
