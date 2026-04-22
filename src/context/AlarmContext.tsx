import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Alarm, SunriseSettings } from '../types/alarm';
import { ALARM_NOTIFICATION_TASK, ALARM_FIRING_STATE_KEY } from '../tasks/alarmTask';
import { setAudioModeAsync } from 'expo-audio';

type AlarmContextType = {
  alarms: Alarm[];
  addAlarm: (time: Date, daysOfWeek: number[], label?: string, sunriseSettings?: SunriseSettings) => void;
  toggleAlarm: (id: string) => void;
  removeAlarm: (id: string) => void;
  isLoading: boolean;
  isAlarmFiring: boolean;
  dismissAlarm: () => void;
};

const ALARMS_STORAGE_KEY = '@calarm_alarms';

const ALARM_CHANNEL_ID = 'alarms';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

const getNextTriggerDate = (date: Date) => {
  const now = new Date();
  const trigger = new Date(date);
  // Set trigger to today to compare times
  trigger.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  trigger.setSeconds(0, 0);
  trigger.setMilliseconds(0);

  // Add a 2-second buffer to prevent immediate firing due to execution delay
  const buffer = 2000;
  const comparisonTime = now.getTime() + buffer;

  if (trigger.getTime() <= comparisonTime) {
    // If the time has already passed today, schedule for tomorrow
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger;
};

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlarmFiring, setIsAlarmFiring] = useState(false);

  // Configure audio session for background playback and notification categories
  useEffect(() => {
    // Configure audio session for background playback
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    }).catch((error) => {
      console.error('Failed to configure audio session:', error);
    });

    Notifications.setNotificationCategoryAsync('alarm', [
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss Alarm',
        options: { isDestructive: true },
      },
    ]);
  }, []);

  const dismissAlarm = async () => {
    setIsAlarmFiring(false);
    await AsyncStorage.setItem(ALARM_FIRING_STATE_KEY, 'false');
  };

  // Load alarms from storage on mount
  useEffect(() => {
    const loadAlarms = async () => {
      // Initialize notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
          name: 'Alarms',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      try {
        const storedAlarms = await AsyncStorage.getItem(ALARMS_STORAGE_KEY);
        if (storedAlarms !== null) {
          const parsedAlarms = JSON.parse(storedAlarms).map((a: any) => ({
            ...a,
            time: new Date(a.time),
          }));
          setAlarms(parsedAlarms);

          // Re-schedule notifications for all existing alarms
          for (const alarm of parsedAlarms) {
            if (alarm.isEnabled) {
                const nextTrigger = getNextTriggerDate(alarm.time);
                await Notifications.scheduleNotificationAsync({
                    identifier: alarm.id,
                    content: {
                        title: "⏰ CALarM!",
                        body: alarm.label || "Wake up!",
                        sound: require('../../assets/sounds/alarm.mp3'),
                        priority: Notifications.AndroidNotificationPriority.MAX,
                        categoryIdentifier: 'alarm',
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: nextTrigger,
                        // @ts-ignore - channelId is supported on Android
                        channelId: ALARM_CHANNEL_ID, 
                    },
                });
            }
          }
        }

        // Check if there is a pending alarm firing state from a background task
        const firingState = await AsyncStorage.getItem(ALARM_FIRING_STATE_KEY);
        if (firingState === 'true') {
          setIsAlarmFiring(true);
        }
      } catch (e) {
        console.error('Failed to load alarms', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlarms();
  }, []);

  // Notification Listeners
  useEffect(() => {
    // Handle notification when app is in foreground
    const subscription = Notifications.addNotificationReceivedListener(_ => {
      setIsAlarmFiring(true);
    });

    // Handle when user taps on the notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(_ => {
      setIsAlarmFiring(true);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Save alarms to storage whenever they change
  useEffect(() => {
    const saveAlarms = async () => {
      if (isLoading) return;
      try {
        await AsyncStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
      } catch (e) {
        console.error('Failed to save alarms', e);
      }
    };

    saveAlarms();
  }, [alarms, isLoading]);

  const addAlarm = async (time: Date, daysOfWeek: number[] = [], label?: string, sunriseSettings?: SunriseSettings) => {
    const nextTrigger = getNextTriggerDate(time);
    const newAlarm: Alarm = {
      id: Math.random().toString(36).substring(7),
      time,
      label,
      isEnabled: true,
      daysOfWeek,
      sunriseSettings,
    };

    setAlarms((prev) => [...prev, newAlarm]);

    // Schedule the notification
    try {
        await Notifications.scheduleNotificationAsync({
            identifier: newAlarm.id,
            content: {
                title: "⏰ CALarM!",
                body: label || "Wake up!",
                sound: require('../../assets/sounds/alarm.mp3'),
                priority: Notifications.AndroidNotificationPriority.MAX,
                categoryIdentifier: 'alarm',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: nextTrigger,
                // @ts-ignore
                channelId: ALARM_CHANNEL_ID,
            },
        });
    } catch (e) {
        console.error('Failed to schedule notification', e);
    }
  };

  const toggleAlarm = async (id: string) => {
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === id ? { ...alarm, isEnabled: !alarm.isEnabled } : alarm
      )
    );
  };

  const removeAlarm = async (id: string) => {
    setAlarms((prev) => prev.filter((alarm) => alarm.id !== id));
  };

  const value = useMemo(() => ({
    alarms,
    addAlarm,
    toggleAlarm,
    removeAlarm,
    isLoading,
    isAlarmFiring,
    dismissAlarm,
  }), [alarms, isLoading, isAlarmFiring]);

  return (
    <AlarmContext.Provider value={value}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarms() {
  const context = useContext(AlarmContext);
  if (context === undefined) {
    throw new Error('useAlarms must be used within an AlarmProvider');
  }
  return context;
}