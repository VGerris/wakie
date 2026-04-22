---
name: android-alarm-reliability-plan
description: Detailed plan to ensure Android alarm functionality (exact timing, screen wake, and background audio).
type: project
---

# Context
The alarm app currently fails to play sound and wake the screen when the device is locked. This is due to missing permissions, improper notification configuration for full-screen intents, and potentially unreliable background audio playback in the TaskManager.

# Implementation Plan

## Phase 1: Android Permissions (`app.json`)
- Add `SCHEDULE_EXACT_ALARM` to `android.permissions` to ensure precise timing.
- Verify `WAKE_LOCK` and `USE_FULL_SCREEN_INTENT` are present.
- (Optional/If needed) Add `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` if background audio requires a foreground service.

## Phase 2: Notification Configuration (`src/context/AlarmContext.tsx`)
- Ensure the `alarms` notification channel is set to `Notifications.AndroidImportance.MAX`.
- Update `scheduleNotificationAsync` to include:
    - `priority: Notifications.AndroidNotificationPriority.MAX`
    - `channelId: ALARM_CHANNEL_ID`
    - Investigate and implement `fullScreenIntent` if supported by `expo-notifications`.

## Phase 3: Background Audio (`src/hooks/useAudio.ts` & `src/tasks/alarmTask.ts`)
- **Audio Category**: Update `src/hooks/useAudio.ts` to ensure the audio session is configured for background playback (e.g., setting the correct audio category).
- **Task Execution**: Verify that `playAlarmSound()` in `src/tasks/alarmTask.ts` can execute successfully in the `TaskManager` context without being killed by the OS.

## Phase 4: UI Visibility
- Ensure that the notification payload is configured to launch the alarm UI even when the device is locked, using the full-screen intent.

# Verification Plan
1. **Exact Timing**: Schedule an alarm and verify it triggers at the correct time on Android.
2. **Background Sound**: Lock the device and verify the alarm sound plays.
3. **Screen Wake**: Lock the device and verify the screen wakes up or shows the alarm UI prominently.
