---
name: fix-alarm-behavior-plan
description: Use VGerris/expo-alarm fork with native AlarmService + AlarmActivity for locked-screen alarm sound and UI.
type: project
---

# Context
Alarm works when screen is on but not when locked. `expo-notifications` doesn't support full-screen intents. The `@vall370/expo-alarm` native module (fork at `VGerris/expo-alarm`) uses `AlarmManager.RTC_WAKEUP` which wakes the device, but its `AlarmReceiver` only shows a notification — it doesn't play sound or launch the alarm UI.

# Implementation Plan

## Step 1: Update package.json
- Replace `"@vall370/expo-alarm": "^0.1.5"` with `"@vall370/expo-alarm": "git+https://github.com/VGerris/expo-alarm.git"`

## Step 2: Enhance AlarmReceiver (native Android)
File: `android/src/main/java/com/expo/modules/alarm/receivers/AlarmReceiver.kt`
- Start `AlarmService` when alarm fires (to play sound via MediaPlayer)
- Launch `AlarmActivity` with flags: `FLAG_ACTIVITY_NEW_TASK`, `FLAG_SHOW_WHEN_LOCKED`, `FLAG_TURN_SCREEN_ON`, `FLAG_DISMISS_KEYGUARD`
- Pass sound URI and identifier to the service/activity via intent extras

## Step 3: Enhance AlarmService (native Android)
File: `android/src/main/java/com/expo/modules/alarm/AlarmService.kt`
- Use `MediaPlayer` to play the alarm sound (supports background playback)
- Request `WAKE_LOCK` and `SCREEN_BRIGHT_WAKE_LOCK`
- Stop playback when `stopSelf()` is called (triggered by dismiss action)

## Step 4: Create AlarmActivity (native Android)
File: `android/src/main/java/com/expo/modules/alarm/AlarmActivity.kt`
- Show the alarm UI (alarm title, dismiss button)
- Set flags: `FLAG_SHOW_WHEN_LOCKED`, `FLAG_TURN_SCREEN_ON`, `FLAG_DISMISS_KEYGUARD`
- On dismiss: stop the `AlarmService`, cancel the alarm, send event to React Native

## Step 5: Update AndroidManifest
File: `android/src/main/AndroidManifest.xml`
- Register `AlarmActivity` with `android:showWhenLocked="true"`, `android:turnScreenOn="true"`
- Ensure `AlarmService` is registered with `foregroundServiceType="mediaPlayback"`

## Step 6: Wire up React side
Files: `src/context/AlarmContext.tsx`, `src/hooks/useNotifications.ts`
- Import `expo-alarm` module
- Use `scheduleAlarmAsync` instead of `scheduleNotificationAsync` for Android
- Listen for `alarmTriggered` event to show `AlarmModal`
- Use `cancelAlarmAsync` to cancel alarms
- Remove `expo-notifications` scheduling for Android (keep for iOS)

## Step 7: Clean up
- Remove `@react-native-async-storage` alarm firing state logic (no longer needed — native module handles it)
- Remove `expo-task-manager` background task for alarms
- Keep `expo-audio` for foreground alarm sound (AlarmModal)

# Verification Plan
1. Set alarm, lock screen → verify screen wakes and alarm UI shows
2. Verify alarm sound plays from background
3. Press dismiss → verify alarm stops and app returns to normal
4. Test with device on silent mode
