import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { Alarm } from '../types/alarm';
import { ALARM_NOTIFICATION_TASK } from '../tasks/alarmTask';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const requestPermissions = async () => {
    if (!Device.isDevice) {
      alert('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get permission for notifications!');
      return false;
    }
    return true;
  };

  const scheduleAlarmNotification = async (alarm: Alarm) => {
    const date = new Date(alarm.time);
    const now = new Date();

    // Simple check: if date is past today, add a day
    if (date <= now) {
        date.setDate(date.getDate() + 1);
    }

    // Register the background task for this specific notification/type if possible
    try {
        await Notifications.registerTaskAsync(ALARM_NOTIFICATION_TASK);
    } catch (e) {
        console.error('Failed to register background task for notification:', e);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ CALarM!",
        body: alarm.label || "Wake up!",
        sound: require('../../assets/sounds/alarm.mp3'),
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { alarmId: alarm.id },
      },
      trigger: {
        date: date,
        channelId: 'alarms',
      },
    });
  };

  return {
    requestPermissions,
    scheduleAlarmNotification,
  };
}
