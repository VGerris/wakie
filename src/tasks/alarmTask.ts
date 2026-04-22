import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playAlarmSound } from '../hooks/useAudio';

export const ALARM_NOTIFICATION_TASK = 'ALARM_NOTIFICATION_TASK';
export const ALARM_FIRING_STATE_KEY = '@calarm_is_alarm_firing';

// This task will be called when a notification is received in the background
TaskManager.defineTask(ALARM_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background Task Error:', error);
    return;
  }

  console.log('Alarm notification received in background:', data);

  try {
    // 1. Persist the firing state so the UI can pick it up when it resumes
    await AsyncStorage.setItem(ALARM_FIRING_STATE_KEY, 'true');

    // 2. Attempt to play the sound
    await playAlarmSound();
  } catch (e) {
    console.error('Failed to play alarm sound in background task:', e);
  }
});
