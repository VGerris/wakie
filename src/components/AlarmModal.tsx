import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { playAlarmSound, stopAlarmSound } from '../hooks/useAudio';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

export function AlarmModal({ visible, onClose, onDismiss }: AlarmModalProps) {
  const { theme } = useTheme();
  const [sound, setSound] = useState<any>(null);
  const soundRef = useRef<any>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (visible) {
      const startSound = async () => {
        const s = await playAlarmSound();
        setSound(s);
        soundRef.current = s;
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
      if (soundRef.current) {
        console.log('[AlarmModal] stopping sound');
        stopAlarmSound(soundRef.current);
        soundRef.current = null;
      }

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      pulseAnim.stopAnimation();
    }

    return () => {
      if (soundRef.current) {
        console.log('[AlarmModal] cleanup: stopping sound');
        stopAlarmSound(soundRef.current);
        soundRef.current = null;
      }
      pulseAnim.stopAnimation();
    };
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
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


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
