/**
 * Wrapper for the Native Android Activity Recognition local module.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import * as ActivityRecognition from '../modules/activity-recognition';
import * as Location from 'expo-location';

const TRACKING_STATE_KEY = '@vehiclo_tracking_active';

// ── Permission helpers ───────────────────────────────────────
export async function requestLocationPermissions(): Promise<void> {
  if (Platform.OS === 'android' && Platform.Version >= 29) {
    const authAct = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
    );
    if (authAct !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('ACTIVITY_RECOGNITION permission denied.');
    }
  }

  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') {
    throw new Error('Foreground Location permission denied.');
  }

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') {
    throw new Error('Background Location ("Always Allow") permission denied.');
  }
}

// ── Start / Stop tracking ────────────────────────────────────
export async function startDrivingDetection(): Promise<boolean> {
  await requestLocationPermissions();

  const success = await ActivityRecognition.startObserving();
  if (success) {
    await AsyncStorage.setItem(TRACKING_STATE_KEY, 'true');
    return true;
  } else {
    throw new Error('ActivityRecognition.startObserving() returned false from Native Code.');
  }
}

export async function stopDrivingDetection(): Promise<void> {
  await ActivityRecognition.stopObserving();
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
    const distanceKm = await ActivityRecognition.getPendingDistanceKm();
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
  await ActivityRecognition.clearPendingDistance();
}
