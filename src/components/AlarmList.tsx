import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAlarms } from '../context/AlarmContext';

interface AlarmListProps {}

export function AlarmList() {
  const { theme } = useTheme();
  const { alarms, toggleAlarm, removeAlarm, isLoading } = useAlarms();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.info}>
        <Text style={[styles.time, { color: theme.text }]}>
          {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.label && <Text style={[styles.label, { color: theme.text, opacity: 0.6 }]}>{item.label}</Text>}
      </View>

      <TouchableOpacity
        onPress={() => toggleAlarm(item.id)}
        style={[
          styles.toggle,
          { backgroundColor: item.isEnabled ? theme.primary : theme.border }
        ]}
      >
        <Text style={styles.toggleText}>{item.isEnabled ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => removeAlarm(item.id)} style={styles.deleteButton}>
        <Text style={{ color: theme.accent, fontWeight: 'bold' }}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  if (alarms.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>
        No alarms set
      </Text>
    );
  }

  return (
    <FlatList
      data={alarms}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  info: {
    flex: 1,
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
