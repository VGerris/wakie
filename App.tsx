import React, { useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
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
  const { isLoading, dismissAlarm, isAlarmFiring } = useAlarms();
  const { requestPermissions } = useNotifications();
  const [isAlarmModalVisible, setIsAlarmModalVisible] = useState(false);
  const [currentSound, setCurrentSound] = useState<any>(null);

  // 1. Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // 2. Listen for incoming notifications (iOS only — Android uses native alarm module)
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

  // 4. Handle dismissing the alarm
  const handleDismiss = async () => {
    setIsAlarmModalVisible(false);
    if (currentSound) {
      await stopAlarmSound(currentSound);
      setCurrentSound(null);
    }
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

      <SunriseOverlay />

      {/* Alarm overlay rendered inside SafeAreaView — never unmounts */}
      <AlarmModal
        visible={isAlarmModalVisible}
        onClose={handleDismiss}
        onDismiss={handleDismiss}
      />

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
