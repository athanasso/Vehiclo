import { requireNativeModule } from 'expo-modules-core';

// It loads the native module object from the JNI or Objective-C container
const ActivityRecognition = requireNativeModule('ActivityRecognition');

export function startObserving(): boolean {
  return ActivityRecognition.startObserving();
}

export function stopObserving(): boolean {
  return ActivityRecognition.stopObserving();
}

export function getPendingDistanceKm(): number {
  return ActivityRecognition.getPendingDistanceKm();
}

export function clearPendingDistance(): void {
  return ActivityRecognition.clearPendingDistance();
}
