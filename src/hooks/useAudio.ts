import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';

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

export async function playAlarmSound() {
  try {
    // Ensure audio session is configured for background playback
    await configureAudioSession();

    const player = createAudioPlayer(require('../../assets/sounds/alarm.mp3'));
    player.loop = true;
    player.play();
    return player;
  } catch (error) {
    console.error('Error playing alarm sound:', error);
    return null;
  }
}

export async function stopAlarmSound(player: AudioPlayer | null) {
  if (player) {
    try {
      player.pause();
      // In expo-audio, stopping is typically achieved by pausing
      // and allowing the player instance to be garbage collected.
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  }
}
