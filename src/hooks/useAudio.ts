import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RNSound = require('react-native-sound') as any;
const Sound = RNSound?.default || RNSound;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NativeModules = require('react-native').NativeModules;
const RingerModule = NativeModules.RingerModule;

// Configure audio session for background playback once on app startup
async function configureAudioSession() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    });
  } catch (error) {
    console.error('Error configuring audio session:', error);
  }
}

// When the app resumes from a locked state (notification click), the React Native
// bridge may not be fully initialized yet. Native module calls fail with
// "The current activity is no longer available." We delay the first call to give
// the bridge time to stabilize.
let bridgeReadyTimeout: ReturnType<typeof setTimeout> | null = null;
let bridgeReady = false;

function ensureBridgeReady(): Promise<void> {
  return new Promise(resolve => {
    if (bridgeReady) {
      resolve();
      return;
    }
    // Clear any previous timeout
    if (bridgeReadyTimeout) {
      clearTimeout(bridgeReadyTimeout);
    }
    // Give the bridge ~100ms to stabilize after app resume
    bridgeReadyTimeout = setTimeout(() => {
      bridgeReady = true;
      resolve();
    }, 100);
  });
}

export async function playAlarmSound() {
  try {
    await ensureBridgeReady();

    // Ensure audio session is configured for background playback
    await configureAudioSession();

    // On Android: override silent mode via native module (ringer mode to NORMAL)
    if (Platform.OS === 'android') {
      RingerModule?.overrideSilentMode?.();
    }

    // On iOS: set audio session category to playback to ensure sound plays
    // even when the silent switch is on
    if (Platform.OS === 'ios' && Sound?.setCategory) {
      Sound.setCategory('Playback');
    }

    const player = createAudioPlayer(require('../../assets/sounds/alarm.mp3'));
    player.loop = true;
    console.log('[useAudio] starting play, loop:', player.loop);
    const started = await player.play();
    console.log('[useAudio] play returned:', started);
    return player;
  } catch (error) {
    console.error('Error playing alarm sound:', error);
    return null;
  }
}

export async function stopAlarmSound(player: AudioPlayer | null) {
  if (player) {
    try {
      await player.seekTo(0);
      player.pause();
      player.remove();
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  }
  // Restore ringer mode on Android (silent/vibrate)
  if (Platform.OS === 'android') {
    RingerModule?.restoreRingerMode?.();
  }
}
