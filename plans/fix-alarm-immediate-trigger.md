---
name: fix-alarm-immediate-trigger
description: Plan for fixing the issue where alarms trigger immediately upon being saved.
type: project
---

# Context
The user reported that when an alarm is saved, it triggers immediately instead of at the scheduled time. 

Initial analysis of `src/context/AlarmContext.tsx` suggests that `expo-notifications` is being called with a manual date component object (year, month, day, etc.). This can cause immediate firing if the resulting timestamp is perceived as being in the past.

# Goal
Modify `src/context/AlarmContext.tsx` to use a `Date` object directly for the notification trigger, which is more reliable.

# Implementation Plan

## 1. Refactor `src/context/AlarmContext.tsx`
- **Consolidate `getNextTriggerDate`**: Ensure the logic for calculating the next occurrence is robust.
- **Update `loadAlarms`**: In the `useEffect` that re-schedules existing alarms, replace the manual `trigger` object (year, month, day, hour, minute) with the `nextTrigger` `Date` object.
- **Update `addAlarm`**: Replace the manual `trigger` object in `Notifications.scheduleNotificationAsync` with the `nextTrigger` `Date` object.
- **Remove unnecessary logic**: Remove the `month: nextTrigger.getMonth() + 1` manual adjustment since it's no longer needed when using a `Date` object.

## 2. Clean up `src/hooks/useNotifications.ts` (Optional/Recommended)
- The agent identified that `scheduleAlarmNotification` in this file duplicates the logic found in `AlarmContext`. 
- If this hook is used elsewhere, I should refactor it to use the same `Date` object trigger pattern to prevent similar bugs in the future.

## Critical Files
- `src/context/AlarmContext.tsx`
- `src/hooks/useNotifications.ts`

## Verification Plan
1. **Manual Test**: Since I cannot run the mobile app directly, I will verify the code changes by checking:
    - That `trigger` now receives a `Date` object.
    - That the `month` adjustment code is removed.
    - That the `nextTrigger` calculation remains intact.
2. **Code Review**: Ensure no regressions were introduced in the `addAlarm` or `loadAlarms` flow.
