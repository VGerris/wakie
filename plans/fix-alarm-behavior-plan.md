---
name: fix-alarm-behavior-plan
description: Plan to fix alarm sound and screen wake issues when device is locked.
type: project
---

# Context
The alarm triggers a notification when the screen is off, but fails to play sound or wake the screen. This is critical for an alarm app.

# Problem Analysis
1. **Sound in Background**: `expo-audio` wasn't configured for background playback. The audio session needed `playsInSilentMode`, `shouldPlayInBackground`, and lock screen controls enabled.
2. **Screen Wake (Android)**: `USE_FULL_SCREEN_INTENT` and `SCHEDULE_EXACT_ALARM` are in `app.json`. Notifications use `priority: MAX`.
3. **Notification Sound**: Changed from `sound: 'default'` to custom alarm sound file.

# Changes Made

## `src/hooks/useAudio.ts`
- Added `setAudioModeAsync` call to configure audio session with:
  - `playsInSilentMode: true` - plays even when device is on silent
  - `shouldPlayInBackground: true` - continues playing when app is in background
  - `interruptionMode: 'doNotMix'` - interrupts other audio (phone calls, music)
- Added `player.setActiveForLockScreen(true)` for sustained background playback on Android (prevents 3-minute cutoff)

## `src/context/AlarmContext.tsx`
- Added `setAudioModeAsync` import and call in startup effect to configure audio session once
- Changed notification `sound: 'default'` to `sound: require('../../assets/sounds/alarm.mp3')` in both `addAlarm` and re-schedule paths

## `src/hooks/useNotifications.ts`
- Changed `sound: true` to `sound: require('../../assets/sounds/alarm.mp3')`
- Added `priority: Notifications.AndroidNotificationPriority.MAX`

# Verification Plan
1. **Test Background Sound**: Set an alarm, lock the screen, verify the custom alarm sound plays.
2. **Test Screen Wake**: Set an alarm, lock the screen, verify the screen wakes up.
3. **Test Silent Mode**: Set device to silent, verify alarm still plays.
