import { requireNativeModule } from 'expo-modules-core';

// It loads the native module object from the JNI or Objective-C container
const ActivityRecognition = requireNativeModule('ActivityRecognition');

export async function startObserving(): Promise<boolean> {
  return await ActivityRecognition.startObserving();
}

export async function stopObserving(): Promise<boolean> {
  return await ActivityRecognition.stopObserving();
}

export async function getPendingDistanceKm(): Promise<number> {
  return await ActivityRecognition.getPendingDistanceKm();
}

export async function getPendingRoute(): Promise<string> {
  return await ActivityRecognition.getPendingRoute();
}

export async function clearPendingDistance(): Promise<void> {
  await ActivityRecognition.clearPendingDistance();
}
