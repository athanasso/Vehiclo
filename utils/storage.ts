/**
 * AsyncStorage wrapper for persistent data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  VEHICLES: '@vehiclo_vehicles',
  FUEL_LOGS: '@vehiclo_fuel_logs',
  TRIP_LOGS: '@vehiclo_trip_logs',
  MAINTENANCE: '@vehiclo_maintenance',
  EXPENSES: '@vehiclo_expenses',
  DOCUMENTS: '@vehiclo_documents',
  SETTINGS: '@vehiclo_settings',
  ACTIVE_VEHICLE: '@vehiclo_active_vehicle',
  SOLO_SESSIONS: '@vehiclo_solo_sessions',
};

export async function getData<T>(key: string): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export async function setData<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Storage remove error:', e);
  }
}

export { KEYS };
