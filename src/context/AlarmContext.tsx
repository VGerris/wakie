import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Alarm, SunriseSettings } from '../types/alarm';
import { setAudioModeAsync } from 'expo-audio';

// Native alarm module (Android only, uses AlarmManager)
const ExpoAlarm = require('@vgerris/expo-alarm').default as any;

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
  trigger.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  trigger.setSeconds(0, 0);
  trigger.setMilliseconds(0);

  const buffer = 2000;
  const comparisonTime = now.getTime() + buffer;

  if (trigger.getTime() <= comparisonTime) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger;
};

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlarmFiring, setIsAlarmFiring] = useState(false);
  const lastFiredAlarmIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Configure audio session for background playback
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    }).catch((error: any) => {
      console.error('Failed to configure audio session:', error);
    });

    // Notification categories (iOS only)
    if (Platform.OS === 'ios') {
      Notifications.setNotificationCategoryAsync('alarm', [
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss Alarm',
          options: { isDestructive: true },
        },
      ]);
    }

    // Listen for native alarm events (Android)
    if (Platform.OS === 'android') {
      const triggeredSub = ExpoAlarm.addListener('alarmTriggered', (event: any) => {
        console.log('Native alarm triggered:', event);
        // Ignore duplicate events from the same firing (AlarmReceiver + AlarmService both emit)
        if (event.identifier === lastFiredAlarmIdRef.current) return;
        lastFiredAlarmIdRef.current = event.identifier;
        setIsAlarmFiring(true);
      });

      const dismissedSub = ExpoAlarm.addListener('alarmDismissed', (event: any) => {
        console.log('Native alarm dismissed:', event);
        setIsAlarmFiring(false);
        lastFiredAlarmIdRef.current = null;
      });

      // AppState listener to detect when app comes to foreground
      // This catches alarms that fired while the app was in the background
      const appStateSub = AppState.addEventListener('change', async (nextAppState) => {
        if (nextAppState === 'active' && !isAlarmFiring) {
          // Check if an alarm was firing while in background
          const firingState = await AsyncStorage.getItem('@calarm_is_alarm_firing');
          if (firingState === 'true') {
            setIsAlarmFiring(true);
          }
        }
      });

      return () => {
        triggeredSub?.remove();
        dismissedSub?.remove();
        appStateSub?.remove();
      };
    }

    // Notification listeners (iOS)
    const notificationReceivedSub = Notifications.addNotificationReceivedListener(() => {
      setIsAlarmFiring(true);
    });

    const responseReceivedSub = Notifications.addNotificationResponseReceivedListener(() => {
      setIsAlarmFiring(true);
    });

    return () => {
      notificationReceivedSub.remove();
      responseReceivedSub.remove();
    };
  }, []);

  const dismissAlarm = async () => {
    const firingId = lastFiredAlarmIdRef.current;

    // On Android — cancel the native alarm (stops the service and cancels scheduled alarm)
    if (Platform.OS === 'android' && ExpoAlarm && firingId) {
      try {
        await ExpoAlarm.cancelAlarmAsync(firingId);
      } catch (e) {
        console.error('Failed to cancel alarm on dismiss:', e);
      }
    }

    // On iOS — the alarm fires via notification, stop the firing state
    if (Platform.OS === 'ios') {
      setIsAlarmFiring(false);
      lastFiredAlarmIdRef.current = null;

      // Cancel the scheduled notification so it doesn't fire again today
      // The alarm itself stays enabled for future days
      if (firingId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(firingId);
        } catch (e) {
          console.error('Failed to cancel notification on dismiss:', e);
        }
      }
    }
  };

  // Load alarms from storage on mount
  useEffect(() => {
    const loadAlarms = async () => {
      // Initialize notification channel for Android (fallback)
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
            name: 'Alarms',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
          });
        } catch (e) {
          console.error('Failed to create notification channel:', e);
        }
      }

      try {
        const storedAlarms = await AsyncStorage.getItem(ALARMS_STORAGE_KEY);
        if (storedAlarms !== null) {
          const parsedAlarms = JSON.parse(storedAlarms).map((a: any) => ({
            ...a,
            time: new Date(a.time),
          }));
          setAlarms(parsedAlarms);

          // Re-schedule alarms
          for (const alarm of parsedAlarms) {
            console.log('Re-scheduling alarm:', alarm.id, 'enabled:', alarm.isEnabled, 'time:', alarm.time.toISOString());
            if (alarm.isEnabled) {
              if (Platform.OS === 'ios') {
                // Ensure permissions before scheduling
                const { status } = await Notifications.getPermissionsAsync();
                console.log('iOS permissions:', status);
                if (status !== 'granted') {
                  const { status: newStatus } = await Notifications.requestPermissionsAsync();
                  console.log('iOS new permissions:', newStatus);
                }
              }
              if (Platform.OS === 'android') {
                await scheduleNativeAlarm(alarm);
              } else {
                // Cancel old pending notification before re-scheduling
                await Notifications.cancelScheduledNotificationAsync(alarm.id);
                await scheduleNotificationAlarm(alarm);
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to load alarms', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlarms();
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

  const scheduleNativeAlarm = async (alarm: Alarm) => {
    if (!ExpoAlarm) return;
    try {
      const triggerDate = getNextTriggerDate(alarm.time);
      await ExpoAlarm.scheduleAlarmAsync({
        identifier: alarm.id,
        title: alarm.label || 'Wake up!',
        body: '⏰ CALarM!',
        date: triggerDate.getTime(),
        repeating: alarm.daysOfWeek.length > 0,
      });
    } catch (e) {
      console.error('Failed to schedule native alarm:', e);
    }
  };

  const scheduleNotificationAlarm = async (alarm: Alarm) => {
    const nextTrigger = getNextTriggerDate(alarm.time);
    console.log('Scheduling notification alarm:', alarm.id, 'for', nextTrigger.toISOString(), '(now:', new Date().toISOString(), ')');
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: alarm.id,
        content: {
          title: "⏰ CALarM!",
          body: alarm.label || "Wake up!",
          sound: 'alarm.caf',
          categoryIdentifier: 'alarm',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nextTrigger,
        },
      });
      console.log('Notification scheduled successfully');
    } catch (e) {
      console.error('Failed to schedule notification alarm:', e);
    }
  };

  const addAlarm = async (time: Date, daysOfWeek: number[] = [], label?: string, sunriseSettings?: SunriseSettings) => {
    // Request notification permissions on iOS
    if (Platform.OS === 'ios') {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.error('Notification permissions not granted');
          return;
        }
      }
    }

    const newAlarm: Alarm = {
      id: Math.random().toString(36).substring(7),
      time,
      label,
      isEnabled: true,
      daysOfWeek,
      sunriseSettings,
    };

    setAlarms((prev) => [...prev, newAlarm]);

    // Schedule the alarm
    if (Platform.OS === 'android') {
      await scheduleNativeAlarm(newAlarm);
    } else {
      await scheduleNotificationAlarm(newAlarm);
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

    // Cancel the alarm on the native side
    if (Platform.OS === 'android' && ExpoAlarm) {
      try {
        await ExpoAlarm.cancelAlarmAsync(id);
      } catch (e) {
        console.error('Failed to cancel native alarm:', e);
      }
    }
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
