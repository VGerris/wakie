import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

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

  return {
    requestPermissions,
  };
}
