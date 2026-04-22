import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
  interpolate
} from 'react-native-reanimated';
import { useAlarms } from '../context/AlarmContext';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

const SunriseOverlay = () => {
  const { alarms, isAlarmFiring } = useAlarms();
  const theme = useTheme();

  const activeAlarm = alarms.find(a => a.isEnabled);

  const animationProgress = useSharedValue(0);

  useEffect(() => {
    if (isAlarmFiring && activeAlarm?.sunriseSettings) {
      // Start animation
      animationProgress.value = 0;
      animationProgress.value = withTiming(1, {
        duration: 10000,
        easing: Easing.linear,
      });
    } else {
      // Fade out towards the original background
      animationProgress.value = withTiming(0, {
        duration: 1000,
        easing: Easing.ease,
      });
    }
  }, [isAlarmFiring, activeAlarm?.sunriseSettings]);

  const animatedStyle = useAnimatedStyle(() => {
    const targetColor = activeAlarm?.sunriseSettings?.color || theme.background;
    const startColor = theme.isDark ? '#000000' : '#FFFFFF';

    const color1 = (typeof startColor === 'string' && startColor.length > 0) ? startColor : '#000000';
    const color2 = (typeof targetColor === 'string' && targetColor.length > 0) ? targetColor : '#FFFFFF';

    return {
      backgroundColor: interpolateColor(animationProgress.value, [0, 1], [color1, color2]),
      opacity: interpolate(animationProgress.value, [0, 1], [0, 1]),
    };
  });

  return (
    <Animated.View
      style={[styles.overlay, animatedStyle]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});

export default SunriseOverlay;
