import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface AlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

export function AlarmModal({ visible, onClose, onDismiss }: AlarmModalProps) {
  const { theme } = useTheme();
  const [sound, setSound] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      // When the modal becomes visible, it means an alarm is firing
      const startSound = async () => {
        const s = await playAlarmSound();
        setSound(s);
      };
      startSound();
    } else {
      // When the modal is closed, stop the sound
      if (sound) {
        stopAlarmSound(sound);
        setSound(null);
      }
    }

    return () => {
      if (sound) {
        stopAlarmSound(sound);
      }
    };
  }, [visible]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>⏰ Alarm!</Text>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
            Wake up, it's time!
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={onDismiss}
            >
              <Text style={styles.buttonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Helper functions to avoid circular imports in this example
// In a real app, these would be imported from the hook
import { playAlarmSound, stopAlarmSound } from '../hooks/useAudio';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    // Add a subtle shadow/elevation instead of a heavy background to keep it minimalistic
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
