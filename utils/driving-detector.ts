/**
 * Background driving detection using expo-location + expo-task-manager.
 *
 * Tracks GPS in the background while driving, calculates total distance,
 * and stores pending trips for the user to import on next app open.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASK_NAME = 'VEHICLO_BACKGROUND_LOCATION';
const PENDING_TRIP_KEY = '@vehiclo_pending_trip';
const TRACKING_STATE_KEY = '@vehiclo_tracking_active';

// ── Types ────────────────────────────────────────────────────
export interface PendingTrip {
  startTime: string;
  endTime: string;
  distanceKm: number;
  points: { lat: number; lng: number; timestamp: number }[];
}

// ── Haversine distance (meters) ──────────────────────────────
function haversine(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Define the background task ───────────────────────────────
// This MUST be called at the top level (outside components).
TaskManager.defineTask(TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('[DrivingDetector] Background task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (!locations || locations.length === 0) return;

    try {
      const raw = await AsyncStorage.getItem(PENDING_TRIP_KEY);
      const existing: PendingTrip | null = raw ? JSON.parse(raw) : null;

      const newPoints = locations.map((loc) => ({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        timestamp: loc.timestamp,
      }));

      if (existing) {
        // Append to existing trip
        const allPoints = [...existing.points, ...newPoints];

        // Recalculate total distance
        let totalDistance = 0;
        for (let i = 1; i < allPoints.length; i++) {
          const d = haversine(
            allPoints[i - 1].lat, allPoints[i - 1].lng,
            allPoints[i].lat, allPoints[i].lng,
          );
          // Filter out GPS noise: ignore jumps < 5m or > 5km in one tick
          if (d >= 5 && d < 5000) {
            totalDistance += d;
          }
        }

        const updated: PendingTrip = {
          startTime: existing.startTime,
          endTime: new Date(newPoints[newPoints.length - 1].timestamp).toISOString(),
          distanceKm: totalDistance / 1000,
          points: allPoints,
        };
        await AsyncStorage.setItem(PENDING_TRIP_KEY, JSON.stringify(updated));
      } else {
        // Start a new pending trip
        const trip: PendingTrip = {
          startTime: new Date(newPoints[0].timestamp).toISOString(),
          endTime: new Date(newPoints[newPoints.length - 1].timestamp).toISOString(),
          distanceKm: 0,
          points: newPoints,
        };
        await AsyncStorage.setItem(PENDING_TRIP_KEY, JSON.stringify(trip));
      }
    } catch (e) {
      console.error('[DrivingDetector] Error saving trip data:', e);
    }
  }
});

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

  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (isRunning) return true; // already tracking

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 50,        // update every 50 meters
    timeInterval: 10000,          // or every 10 seconds
    deferredUpdatesInterval: 15000,
    deferredUpdatesDistance: 100,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Vehiclo — Tracking Drive',
      notificationBody: 'Recording your trip in the background',
      notificationColor: '#00D4AA',
    },
    activityType: Location.ActivityType.AutomotiveNavigation,
    pausesUpdatesAutomatically: true,
  });

  await AsyncStorage.setItem(TRACKING_STATE_KEY, 'true');
  return true;
}

export async function stopDrivingDetection(): Promise<void> {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
  await AsyncStorage.setItem(TRACKING_STATE_KEY, 'false');
}

export async function isTrackingActive(): Promise<boolean> {
  const val = await AsyncStorage.getItem(TRACKING_STATE_KEY);
  if (val !== 'true') return false;
  return Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
}

// ── Pending trip management ──────────────────────────────────
export async function getPendingTrip(): Promise<PendingTrip | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_TRIP_KEY);
    if (!raw) return null;
    const trip: PendingTrip = JSON.parse(raw);
    // Only show trips > 0.5 km (filter out walking/noise)
    if (trip.distanceKm < 0.5) return null;
    return trip;
  } catch {
    return null;
  }
}

export async function clearPendingTrip(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_TRIP_KEY);
}
