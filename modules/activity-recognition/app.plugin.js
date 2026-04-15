const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withActivityRecognitionSettings(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add BroadcastReceiver
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }
    const hasReceiver = mainApplication.receiver.some(
      (r) => r.$['android:name'] === 'expo.modules.activityrecognition.ActivityTransitionReceiver'
    );
    if (!hasReceiver) {
      mainApplication.receiver.push({
        $: {
          'android:name': 'expo.modules.activityrecognition.ActivityTransitionReceiver',
          'android:exported': 'true',
        },
      });
    }

    // Add Service
    if (!mainApplication.service) {
      mainApplication.service = [];
    }
    const hasService = mainApplication.service.some(
      (s) => s.$['android:name'] === 'expo.modules.activityrecognition.VehicloTrackerService'
    );
    if (!hasService) {
      mainApplication.service.push({
        $: {
          'android:name': 'expo.modules.activityrecognition.VehicloTrackerService',
          'android:foregroundServiceType': 'location',
          'android:exported': 'false',
        },
      });
    }

    return config;
  });
};
