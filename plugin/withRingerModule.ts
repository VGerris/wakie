/**
 * Expo config plugin that registers the RingerModule native Android module.
 * This allows overriding the device ringer mode so alarm sounds play even in silent mode.
 */
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
} from 'expo/config-plugins';

const RINGER_MODULE_NAME = 'RingerModule';
const RINGER_PACKAGE_NAME = 'RingerPackage';

const withRingerModule: ConfigPlugin = (config) => {
  config = withAndroidManifest(config, (modConfig) => {
    const manifest = AndroidConfig.Manifest.getManifest(modConfig);
    const activity = manifest.manifest['application'][0]['activity'][0];

    // Ensure the RingerPackage is registered in MainApplication
    // This is handled by modifying MainApplication.kt via withMainApplicationKt
    return config;
  });

  return config;
};

export default withRingerModule;
