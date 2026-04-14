/**
 * Notification utilities — local push notifications for maintenance reminders.
 * Uses expo-notifications for scheduling.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { MaintenanceRecord, Vehicle } from '../types';
import { daysUntil } from './formatters';

// Configure notification handler (show alerts even when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user.
 * Returns true if permissions were granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule a local notification for a maintenance item.
 * Schedules 3 days before due, day-of, and day-after if overdue.
 */
export async function scheduleMaintenanceReminder(
  record: MaintenanceRecord,
  vehicle: Vehicle,
): Promise<string[]> {
  const ids: string[] = [];

  if (!record.nextDueDate) return ids;

  const daysLeft = daysUntil(record.nextDueDate);

  // Don't schedule for items far in the future (>60 days)
  if (daysLeft > 60) return ids;

  // Cancel existing notifications for this record
  await cancelMaintenanceReminder(record.id);

  const title = `🔧 ${vehicle.name} — Service Due`;

  if (daysLeft > 3) {
    // Schedule 3 days before
    const trigger = new Date(record.nextDueDate);
    trigger.setDate(trigger.getDate() - 3);
    trigger.setHours(9, 0, 0, 0); // 9 AM

    if (trigger > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: `${record.description} is due in 3 days. Schedule your appointment!`,
          data: { type: 'maintenance', recordId: record.id, vehicleId: vehicle.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
        identifier: `maint_${record.id}_3d`,
      });
      ids.push(id);
    }
  }

  if (daysLeft > 0) {
    // Schedule on due date
    const trigger = new Date(record.nextDueDate);
    trigger.setHours(9, 0, 0, 0);

    if (trigger > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ ${vehicle.name} — Service Today!`,
          body: `${record.description} is due today. Don't forget!`,
          data: { type: 'maintenance', recordId: record.id, vehicleId: vehicle.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
        identifier: `maint_${record.id}_due`,
      });
      ids.push(id);
    }
  }

  if (daysLeft <= 0) {
    // Already overdue — send immediately
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ${vehicle.name} — Overdue Service!`,
        body: `${record.description} is ${Math.abs(daysLeft)} days overdue!`,
        data: { type: 'maintenance', recordId: record.id, vehicleId: vehicle.id },
      },
      trigger: null, // instant
      identifier: `maint_${record.id}_overdue`,
    });
    ids.push(id);
  }

  return ids;
}

/**
 * Cancel all notifications for a specific maintenance record.
 */
export async function cancelMaintenanceReminder(recordId: string): Promise<void> {
  const suffixes = ['3d', 'due', 'overdue'];
  for (const suffix of suffixes) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`maint_${recordId}_${suffix}`);
    } catch {
      // May not exist, that's fine
    }
  }
}

/**
 * Reschedule all maintenance reminders for a vehicle.
 * Call this when maintenance records change or on app start.
 */
export async function syncMaintenanceReminders(
  records: MaintenanceRecord[],
  vehicle: Vehicle,
): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Cancel all existing maintenance notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith('maint_')) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  // Schedule new ones for records with upcoming due dates
  for (const record of records) {
    if (record.nextDueDate) {
      await scheduleMaintenanceReminder(record, vehicle);
    }
  }
}

/**
 * Get count of currently scheduled notifications.
 */
export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(n => n.identifier.startsWith('maint_')).length;
}

/**
 * Send a test notification to verify permissions work.
 */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Vehiclo Notifications',
      body: 'Notifications are working! You\'ll be reminded about upcoming services.',
    },
    trigger: null,
  });
}

/**
 * Configure Android notification channel.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('maintenance', {
      name: 'Maintenance Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D4AA',
      sound: 'default',
    });
  }
}
