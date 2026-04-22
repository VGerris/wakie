# Context
The user wants to implement a "sunrise" effect when an alarm goes off. This involves a gradual transition of the screen's color and brightness over a specified period (10 seconds for testing purposes). This feature should allow for a selected color and brightness level.

# Implementation Plan

## 1. Extend Alarm Type and Context
*   Update `src/types/alarm.ts` to include an optional `sunriseSettings` object.
    *   `sunriseSettings: { color: string; brightness: number } | undefined;`
*   Update `src/context/AlarmContext.tsx`:
    *   Update `addAlarm` signature to accept `sunriseSettings`.
    *   Ensure `sunriseSettings` are saved to and loaded from `AsyncStorage`.

## 2. Create a Sunrise Animation Component
*   Create a new component `src/components/SunriseOverlay.tsx`.
*   This component will use `react-native-reanimated` to handle the smooth transition.
*   It will listen to `isAlarmFiring` from `useAlarms`.
*   When `isAlarmFiring` is true:
    *   Animate a background color from the current theme's background color (or a dark default) to the `sunriseSettings.color`.
    *   Animate the opacity/brightness of the overlay.
*   For testing, the duration will be hardcoded to 10 seconds.

## 3. Implement Color Interpolation Utility
*   Create `src/utils/colorUtils.ts` to provide helper functions for:
    *   Converting hex to RGB (for Reanimated's `interpolateColor`).
    *   Possibly interpolating between two hex colors if needed.

## 4. Integrate Overlay in the Main App
*   Modify `App.tsx` to include the `SunriseOverlay`.
*   The overlay should be positioned absolutely to cover the entire screen, sitting above other UI elements.

## 5. Update Alarm Creation UI (Optional but recommended for completeness)
*   Update `src/components/AlarmModal.tsx` to allow users to pick a sunrise color and brightness.
*   *Note: Given the request's focus on the effect itself, I might keep this minimal or skip if it's too large, but I'll aim to at least allow setting a default or simple selection.*

# Critical Files
- `src/types/alarm.ts`
- `src/context/AlarmContext.tsx`
- `src/components/SunriseOverlay.tsx` (New)
- `src/utils/colorUtils.ts` (New)
- `App.tsx`
- `src/components/AlarmModal.tsx`

# Verification Plan
1.  **Manual Test**:
    *   Add an alarm with specific sunrise settings.
    *   Wait for the alarm to trigger (or use a tool to trigger it immediately if possible).
    *   Observe the screen transition from dark to the selected color and brightness over 10 seconds.
2.  **Check Persistence**:
    *   Verify that the sunrise settings are correctly saved to `AsyncStorage` and persist after app restart.
3.  **Edge Cases**:
    *   Verify behavior when `sunriseSettings` are not provided (should use a default or skip effect).
    *   Verify behavior when the alarm is dismissed before the animation completes.
