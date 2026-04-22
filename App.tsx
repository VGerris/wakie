import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { Clock } from "./src/components/Clock";
import { AlarmProvider, useAlarms } from "./src/context/AlarmContext";
import { AlarmList } from "./src/components/AlarmList";
import { AddAlarmButton } from "./src/components/AddAlarmButton";
import { AlarmModal } from "./src/components/AlarmModal";
import SunriseOverlay from "./src/components/SunriseOverlay";
import { useNotifications } from "./src/hooks/useNotifications";
import { playAlarmSound, stopAlarmSound } from "./src/hooks/useAudio";
import * as Notifications from 'expo-notifications';

function MainApp() {
  const { theme } = useTheme();
  const { isLoading, dismissAlarm } = useAlarms();
  const { requestPermissions } = useNotifications();
  const [isAlarmModalVisible, setIsAlarmModalVisible] = useState(false);
  const [currentSound, setCurrentSound] = useState<any>(null);

  // 1. Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // 2. Listen for incoming notifications (foreground)
  useEffect(() => {
    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      // When a notification arrives while the app is open, show the modal and play sound
      setIsAlarmModalVisible(true);
      // Sound is now handled by the AlarmModal to prevent duplication
    });

    const responseReceivedSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      // When a user taps on the notification, ensure the alarm modal is shown and sound plays
      setIsAlarmModalVisible(true);
    });

    // Check if the app was launched by an alarm notification while it was closed
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

  // 3. Handle dismissing the alarm
  const handleDismiss = async () => {
    setIsAlarmModalVisible(false);
    if (currentSound) {
      await stopAlarmSound(currentSound);
      setCurrentSound(null);
    }
    // Clear the alarm firing state so the screen brightness returns to normal
    await dismissAlarm();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
      <SunriseOverlay />

      <StatusBar style={theme.isDark ? "light" : "dark"} />
    </SafeAreaView>
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
  container: {
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
