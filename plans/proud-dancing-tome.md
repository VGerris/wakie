---
name: fix-deprecation-warnings-plan
description: Plan to fix expo-av and DateTimePicker deprecation warnings
type: project
---

# Plan for fixing deprecation warnings

## Context
The project is receiving deprecation warnings during development:
1. `expo-av` is being deprecated in favor of `expo-audio` and `expo-video`.
2. `DateTimePicker`'s `onChange` prop is deprecated in favor of `onValueChange`, `onDismiss`, and `onNeutralButtonPress`.

The goal is to migrate these usages to the new APIs to ensure long-term compatibility with future Expo SDKs.

## Implementation Strategy

### 1. Migrate `expo-av` to `expo-audio`
- **Identify usage**: `src/hooks/useAudio.ts` uses `Audio.Sound` from `expo-av`.
- **Plan**:
    - Install `expo-audio` (if not already present).
    - Refactor `src/hooks/useAudio.ts` to use the new `expo-audio` API.
    - Note: The `expo-audio` API might differ slightly in how sounds are created and managed. I will need to investigate the new API after installation/exploration.

### 2. Update `DateTimePicker` usage
- **Identify usage**: `src/components/AddAlarmButton.tsx` uses `onChange`.
- **Plan**:
    - Refactor `src/components/AddAlarmButton.tsx` to use `onValueChange` instead of `onChange`.
    - Adjust the handler to match the new signature (removing the `event` argument if it's no longer provided or required).
    - Ensure Android and iOS behaviors remain consistent.

## Files to be modified
- `package.json` (to add `expo-audio`)
- `src/hooks/useAudio.ts`
- `src/components/AddAlarmButton.tsx`

## Verification Plan
- **Build**: Ensure the project builds successfully with `yarn start` or `yarn android`/`yarn ios`.
- **Functional Test**:
    - Verify that alarm sounds still play and stop correctly.
    - Verify that the time picker still allows selecting a time and setting the alarm.
- **Log Check**: Confirm that the deprecation warnings are no longer present in the logs.
