import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, Button } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';

type Appointment = {
  id: number;
  client: number | { id: number; [key: string]: any };
  dietitian: number | { id: number; [key: string]: any };
  date: string;
  duration_minutes: number;
  notes: string;
  status: number;
  client_full_name?: string;
  dietitian_full_name?: string;
};

const STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'Completed',
  4: 'Cancelled',
};

function getId(val: any): number {
  if (typeof val === 'object' && val !== null && 'id' in val) return val.id;
  return val;
}

const AppointmentScreen: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/appointment/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch appointments');
    }
    setLoading(false);
  };

  const changeStatus = async (selected: Appointment, newStatus: number) => {
    if (!selected) return;
    setStatusLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.patch(
        `${BASE_URL}/api/appointment/${selected.id}/`,
        {
          client: getId(selected.client),
          dietitian: getId(selected.dietitian),
          date: selected.date.length > 10 ? selected.date : selected.date + 'T00:00:00Z',
          duration_minutes: selected.duration_minutes,
          notes: selected.notes,
          status: newStatus
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Status updated');
      setSelected(null);
      fetchAppointments();
    } catch (error: any) {
      console.log('PATCH error:', error.response?.data || error);
      Alert.alert('Error', JSON.stringify(error.response?.data) || 'Failed to update status');
    }
    setStatusLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <Text style={styles.cardText}>
              {item.client_full_name || `Client #${item.client}`} - {item.dietitian_full_name || `Dietitian #${item.dietitian}`}
              {'  '}|  {new Date(item.date).toLocaleString()}
            </Text>
            <Text style={styles.status}>{STATUS_LABELS[item.status]}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No appointments found.</Text>}
      />

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selected && (
              <>
                <Text style={styles.modalTitle}>Appointment Details</Text>
                <Text>
                  <Text style={styles.bold}>Client: </Text>
                  {selected.client_full_name || `Client #${selected.client}`}
                </Text>
                <Text>
                  <Text style={styles.bold}>Dietitian: </Text>
                  {selected.dietitian_full_name || `Dietitian #${selected.dietitian}`}
                </Text>
                <Text>
                  <Text style={styles.bold}>Date: </Text>
                  {new Date(selected.date).toLocaleString()}
                </Text>
                <Text>
                  <Text style={styles.bold}>Duration: </Text>
                  {selected.duration_minutes} min
                </Text>
                <Text>
                  <Text style={styles.bold}>Notes: </Text>
                  {selected.notes || '-'}
                </Text>
                <Text>
                  <Text style={styles.bold}>Status: </Text>
                  {STATUS_LABELS[selected.status]}
                </Text>
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.bold}>Change Status:</Text>
                  {[2, 3, 4].map(statusVal => (
                    <Button
                      key={statusVal}
                      title={STATUS_LABELS[statusVal]}
                      onPress={() => changeStatus(selected, statusVal)}
                      disabled={statusLoading || selected.status === statusVal}
                    />
                  ))}
                </View>
                <Button title="Close" onPress={() => setSelected(null)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardText: { fontSize: 16, color: '#222' },
  status: { color: '#888', fontSize: 13, marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#fff',
    elevation: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  bold: { fontWeight: 'bold' },
});

export default AppointmentScreen;
