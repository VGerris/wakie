#!/usr/bin/env bash
# Auto-generate android/local.properties if missing and restore custom native files
# This ensures the Android SDK path is available and custom modules survive prebuild --clean

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_PROPS="$PROJECT_DIR/android/local.properties"
MAIN_APP="$PROJECT_DIR/android/app/src/main/java/com/tempusqualis/calarm/MainApplication.kt"
RINGER_MODULE="$PROJECT_DIR/android/app/src/main/java/com/tempusqualis/calarm/RingerModule.kt"
RINGER_PACKAGE="$PROJECT_DIR/android/app/src/main/java/com/tempusqualis/calarm/RingerPackage.kt"
SETTINGS_GRADLE="$PROJECT_DIR/android/settings.gradle"
APP_BUILD_GRADLE="$PROJECT_DIR/android/app/build.gradle"

# --- Restore custom native files (survive prebuild --clean) ---
NEED_RESTORE_MAIN=false
NEED_RESTORE_MODULE=false
NEED_RESTORE_PACKAGE=false

if [ ! -f "$RINGER_MODULE" ]; then
  NEED_RESTORE_MODULE=true
fi
if [ ! -f "$RINGER_PACKAGE" ]; then
  NEED_RESTORE_PACKAGE=true
fi
if [ ! -f "$MAIN_APP" ] || ! grep -q "RingerPackage" "$MAIN_APP" 2>/dev/null; then
  NEED_RESTORE_MAIN=true
fi

if $NEED_RESTORE_MODULE || $NEED_RESTORE_PACKAGE; then
  echo "Restoring custom native files (RingerModule for silent mode override)..."
fi

if $NEED_RESTORE_MODULE; then
  cat > "$RINGER_MODULE" << 'KOTLIN'
package com.tempusqualis.calarm

import android.content.Context
import android.media.AudioManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RingerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "RingerModule"

  @ReactMethod
  fun overrideSilentMode() {
    try {
      val audioManager = reactApplicationContext
        .getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val currentMode = audioManager.ringerMode
      audioManager.ringerMode = AudioManager.RINGER_MODE_NORMAL
      _originalRingerMode = currentMode
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  @ReactMethod
  fun restoreRingerMode() {
    try {
      val audioManager = reactApplicationContext
        .getSystemService(Context.AUDIO_SERVICE) as AudioManager
      if (_originalRingerMode != -1) {
        audioManager.ringerMode = _originalRingerMode
        _originalRingerMode = -1
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  companion object {
    @Volatile
    private var _originalRingerMode: Int = -1
  }
}
KOTLIN
fi

if $NEED_RESTORE_PACKAGE; then
  cat > "$RINGER_PACKAGE" << 'KOTLIN'
package com.tempusqualis.calarm

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class RingerPackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): List<NativeModule> {
    return listOf(RingerModule(reactContext))
  }

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> {
    return emptyList()
  }
}
KOTLIN
fi

if $NEED_RESTORE_MAIN; then
  cat > "$MAIN_APP" << 'KOTLIN'
package com.tempusqualis.calarm

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Custom package for ringer mode override (silent mode bypass)
          add(RingerPackage())
        }
    )
  }

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
KOTLIN
fi

# --- Ensure react-native-sound is linked in gradle files ---
if grep -q "react-native-sound" "$SETTINGS_GRADLE" 2>/dev/null && grep -q "react-native-sound" "$APP_BUILD_GRADLE" 2>/dev/null; then
  : # already linked
  exit 0
fi

echo "Linking react-native-sound in gradle files..."

# Link react-native-sound in settings.gradle
if ! grep -q "react-native-sound" "$SETTINGS_GRADLE" 2>/dev/null; then
  python3 -c "
import sys
with open('$SETTINGS_GRADLE', 'r') as f:
    content = f.read()
if \"include ':app'\" not in content:
    content = content.replace(\"include ':app'\", \"include ':app'\ninclude ':react-native-sound'\nproject(':react-native-sound').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-sound/android')\")
else:
    content = content.replace(\"include ':app'\", \"include ':app'\ninclude ':react-native-sound'\nproject(':react-native-sound').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-sound/android')\")
with open('$SETTINGS_GRADLE', 'w') as f:
    f.write(content)
"
fi

# Link react-native-sound in app/build.gradle
if ! grep -q "react-native-sound" "$APP_BUILD_GRADLE" 2>/dev/null; then
  python3 -c "
import sys
with open('$APP_BUILD_GRADLE', 'r') as f:
    content = f.read()
content = content.replace(
    'implementation(\"com.facebook.react:react-android\")',
    'implementation(\"com.facebook.react:react-android\")\n    // react-native-sound for alarm audio playback\n    implementation project(\":react-native-sound\")'
)
with open('$APP_BUILD_GRADLE', 'w') as f:
    f.write(content)
"
fi

# --- Generate local.properties if missing ---
if [ -f "$LOCAL_PROPS" ]; then
  exit 0
fi

# Determine ANDROID_HOME
if [ -n "$ANDROID_HOME" ]; then
  SDK_DIR="$ANDROID_HOME"
elif [ -n "$ANDROID_SDK_ROOT" ]; then
  SDK_DIR="$ANDROID_SDK_ROOT"
else
  # Default macOS location
  SDK_DIR="$HOME/Library/Android/sdk"
fi

# Verify SDK exists
if [ ! -d "$SDK_DIR" ]; then
  echo "Warning: Android SDK not found at $SDK_DIR"
  echo "Please set ANDROID_HOME or create $LOCAL_PROPS manually."
  exit 0
fi

# Create local.properties
echo "sdk.dir=$SDK_DIR" > "$LOCAL_PROPS"
echo "Created $LOCAL_PROPS"
