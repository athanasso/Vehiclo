// Reexport the native module. On web, it will be resolved to MyModule.web.ts
// and on native platforms to MyModule.ts
import { requireNativeModule, EventEmitter, Subscription } from 'expo-modules-core';

// Loads the native ML Kit module securely
const MLKit = requireNativeModule('MyModule');
const emitter = new EventEmitter(MLKit);

export async function recognizeText(imageUri: string): Promise<string> {
  return await MLKit.recognizeText(imageUri);
}

export function startListening(): boolean {
  return MLKit.startListening();
}

export function stopListening(): boolean {
  return MLKit.stopListening();
}

export function addSpeechResultsListener(listener: (event: { text: string, isFinal: boolean }) => void): Subscription {
  return emitter.addListener('onSpeechResults', listener);
}

export function addSpeechErrorListener(listener: (event: { error: string }) => void): Subscription {
  return emitter.addListener('onSpeechError', listener);
}
