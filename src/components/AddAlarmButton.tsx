import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useAlarms } from '../context/AlarmContext';

export function AddAlarmButton() {
  const { theme } = useTheme();
  const { addAlarm } = useAlarms();

  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
      if (Platform.OS === 'android') {
        // For testing, adding a sunrise effect by default
        addAlarm(selectedDate, [0, 1, 2, 3, 4, 5, 6], "New Alarm", {
          color: '#FFCC33', // Warm sunrise color
          brightness: 0.8
        });
      }
    }
  };
  const handleConfirm = () => {
    // For testing, adding a sunrise effect by default
    addAlarm(date, [0, 1, 2, 3, 4, 5, 6], "New Alarm", {
      color: '#FFCC33', // Warm sunrise color
      brightness: 0.8
    });
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      {/* The actual button that triggers the flow */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.buttonText}>+ Add Alarm</Text>
      </TouchableOpacity>

      {/* Platform-specific Picker implementation */}
      {showPicker && (
        <View>
          {/* On iOS, we typically wrap the picker in a Modal for a better UX */}
          {Platform.OS === 'ios' ? (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showPicker}
            >
              <View style={styles.modalContainer}>
                <View style={[styles.pickerCard, { backgroundColor: theme.card }]}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleCancel}>
                      <Text style={{ color: theme.primary, fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleConfirm}>
                      <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>Set</Text>
                    </TouchableOpacity>
                  </View>

                  <DateTimePicker
                    value={date}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                    textColor={theme.text}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            /* On Android, the picker is a native dialog that appears over everything */
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={onChange}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // iOS Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
});
