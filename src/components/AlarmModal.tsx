import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

export function AlarmModal({ visible, onClose, onDismiss }: AlarmModalProps) {
  const { theme } = useTheme();
  const [sound, setSound] = useState<any>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (visible) {
      const startSound = async () => {
        const s = await playAlarmSound();
        setSound(s);
      };
      startSound();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      if (sound) {
        stopAlarmSound(sound);
        setSound(null);
      }

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      pulseAnim.stopAnimation();
    }

    return () => {
      if (sound) {
        stopAlarmSound(sound);
      }
      pulseAnim.stopAnimation();
    };
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.glow,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>⏰ Alarm!</Text>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
            Wake up, it's time!
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>Dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

import { playAlarmSound, stopAlarmSound } from '../hooks/useAudio';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  glow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.45,
    height: SCREEN_WIDTH * 0.45,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: SCREEN_WIDTH * 0.35,
    maxWidth: 300,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
