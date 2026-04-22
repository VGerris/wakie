---
name: alarm_implementation_plan
description: Plan for implementing alarm viewing and triggering functionality.
type: project
---

# Alarm Implementation Plan

## Context
The user wants to implement the core functionality of the alarm clock app. Currently, there is an alarm picker, but no way to see the scheduled alarms, and no actual mechanism to trigger an alarm when it goes off.

## Goals
1.  **Alarm List View**: A way to display all scheduled alarms.
2.  **Alarm Persistence**: Ensuring alarms are saved and loaded correctly (already partially implemented in `AlarmContext.tsx`).
3.  **Alarm Triggering**: A mechanism to play sound and show a notification when an alarm is due.

## Current State Analysis
- `src/types/alarm.ts`: Defines the `Alarm` type.
- `src/context/AlarmContext.tsx`: Handles state management, persistence via `AsyncStorage`, and notification scheduling via `expo-notifications`.
- `src/components/AlarmList.tsx`: Exists but needs to be integrated/implemented.
- `src/components/AlarmModal.tsx`: Likely used for adding/editing alarms.
- `src/hooks/useAudio.ts`: Likely used for playing alarm sounds.
- `src/hooks/useNotifications.ts`: Likely used for notification management.

## Proposed Implementation Plan

### 1. UI: Implement/Update Alarm List View
- Utilize `src/components/AlarmList.tsx` to display the list of alarms from `useAlarms()`.
- Each list item should show the time, label, and a toggle for `isEnabled`.
- Include a way to remove an alarm.

### 2. Logic: Refine Alarm Triggering
- `AlarmContext.tsx` already uses `Notifications.scheduleNotificationAsync`.
- We need to ensure that when a notification arrives, it actually "goes off" (plays a loud, persistent sound).
- Investigate `src/hooks/useAudio.ts` to see if we should play a custom sound alongside the notification for a better user experience, especially if the app is in the foreground or background.
- Note: `expo-notifications` handles background notifications, but for a robust alarm, we might need to consider how it behaves when the device is locked or in different power modes.

### 3. Integration: Connect everything in the main screen
- Ensure the main screen (likely `App.tsx` or a main container component) renders the `AlarmList`.
- Ensure the `AlarmProvider` wraps the application.

## Critical Files to Modify
- `src/components/AlarmList.tsx`
- `src/context/AlarmContext.tsx`
- `App.tsx` (or the main entry component)

## Verification Plan
1.  **Add an Alarm**: Use the existing picker to add an alarm.
2.  **Verify Persistence**: Restart the app and check if the alarm appears in the list.
3.  **Test Trigger**: Set an alarm for 1 minute in the future and verify:
    - A notification appears.
    - The alarm sound plays.
4.  **Test Toggle/Delete**: Ensure toggling an alarm updates its status and removing it deletes it from the list and stops the notification.
