import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ClockProps {
  fontSize?: number;
}

export function Clock({ fontSize = 64 }: ClockProps) {
  const { theme } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.clockText, { color: theme.text, fontSize }]}>
        {formatTime(time)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'], // Prevents jittering by using monospaced numbers
  },
});
