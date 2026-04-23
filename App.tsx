import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { Clock } from "./src/components/Clock";
import { AlarmProvider, useAlarms } from "./src/context/AlarmContext";
import { AlarmList } from "./src/components/AlarmList";
import { AddAlarmButton } from "./src/components/AddAlarmButton";
import { AlarmModal } from "./src/components/AlarmModal";
import { useNotifications } from "./src/hooks/useNotifications";
import { playAlarmSound, stopAlarmSound } from "./src/hooks/useAudio";
import * as Notifications from 'expo-notifications';

// eslint-disable-next-line no-worklet/no-worklet
function hexToRgb(hex: string) {
  'worklet';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 255, g: 204, b: 51 };
}

// eslint-disable-next-line no-worklet/no-worklet
function interpolateColor(hex1: string, hex2: string, t: number) {
  'worklet';
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function MainApp() {
  const { theme } = useTheme();
  const { alarms, isAlarmFiring, dismissAlarm } = useAlarms();
  const { requestPermissions } = useNotifications();
  const [isAlarmModalVisible, setIsAlarmModalVisible] = useState(false);

  const activeAlarm = alarms.find(a => a.isEnabled);
  const sunriseSettings = activeAlarm?.sunriseSettings;
  const sunriseColor = sunriseSettings?.color || '#FFCC33';

  const progress = useSharedValue(0);

  // 1. Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // 2. Listen for incoming notifications (iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      setIsAlarmModalVisible(true);
    });

    const responseReceivedSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      setIsAlarmModalVisible(true);
    });

    const checkInitialNotification = async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        setIsAlarmModalVisible(true);
      }
    };
    checkInitialNotification();

    return () => {
      notificationReceivedSubscription.remove();
      responseReceivedSubscription.remove();
    };
  }, []);

  // 3. Sync alarm firing state from context to modal visibility
  useEffect(() => {
    if (isAlarmFiring) {
      setIsAlarmModalVisible(true);
    } else {
      setIsAlarmModalVisible(false);
    }
  }, [isAlarmFiring]);

  // 4. Animate background color when alarm firing state changes
  useEffect(() => {
    if (isAlarmFiring && sunriseSettings) {
      const duration = Math.max(1000, (60 / sunriseSettings.brightness) * 1000);
      progress.value = withTiming(1, { duration });
    } else {
      progress.value = withTiming(0, { duration: 1500 });
    }
  }, [isAlarmFiring, sunriseSettings]);

  // 5. Animated style for background color
  const animatedBgStyle = useAnimatedStyle(() => {
    const t = sunriseSettings ? progress.value : 0;
    return { backgroundColor: interpolateColor(theme.background, sunriseColor, t) };
  });

  // 6. Handle dismissing the alarm
  // Do NOT close the modal here — let the native dismiss flow complete first.
  // The modal visibility is driven by isAlarmFiring from the context.
  const handleDismiss = async () => {
    await dismissAlarm();
  };

  return (
    <Animated.View style={[styles.root, animatedBgStyle]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <Clock fontSize={64} />
        </View>

        <View style={styles.content}>
          <AlarmList />
        </View>

        <View style={styles.footer}>
          <AddAlarmButton />
        </View>

        <AlarmModal
          visible={isAlarmModalVisible}
          onClose={handleDismiss}
          onDismiss={handleDismiss}
        />

        <StatusBar style={theme.isDark ? "light" : "dark"} />
      </SafeAreaView>
    </Animated.View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlarmProvider>
          <MainApp />
        </AlarmProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    marginTop: 40,
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
});
