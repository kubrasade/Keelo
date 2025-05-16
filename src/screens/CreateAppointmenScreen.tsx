import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

type Client = {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  profile_picture?: string;
};

type Matching = {
  id: number;
  client: Client;
};

const CreateAppointmentScreen: React.FC = () => {
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dietitianId, setDietitianId] = useState<number | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchMatchings();
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      const userRes = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = userRes.data.id;
      const dietitianRes = await axios.get(`${BASE_URL}/api/dietitians/?user=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDietitianId(dietitianRes.data[0]?.id);
    })();
  }, []);

  const fetchMatchings = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/match/matchings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatchings(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch clients');
    }
    setLoading(false);
  };

  const handleCreateAppointment = async () => {
    if (!selectedClient || !date) {
      Alert.alert('Missing Information', 'Please select a client and date.');
      return;
    }
    setCreating(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const payload = {
        client: selectedClient.id,
        dietitian: dietitianId,
        date: date.toISOString().slice(0, 10),
      };
      await axios.post(
        `${BASE_URL}/api/appointment/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Appointment created!');
      setSelectedClient(null);
      setDate(null);
    } catch (error: any) {
      let msg = 'An appointment could not be made.';
      if (error?.response?.data) {
        if (typeof error.response.data === 'string') {
          msg = error.response.data;
        } else if (error.response.data.detail) {
          msg = error.response.data.detail;
        } else {
          msg = JSON.stringify(error.response.data);
        }
      }
      Alert.alert('Error', msg);
    }
    setCreating(false);
  };

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={[
        styles.clientCard,
        selectedClient?.id === item.id && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.primary + '11' },
      ]}
      onPress={() => setSelectedClient(item)}
      activeOpacity={0.8}
    >
      <Image
        source={
          item.profile_picture
            ? { uri: item.profile_picture }
            : require('../../assets/images/login.png')
        }
        style={styles.avatar}
      />
      <Text style={[styles.clientName, { color: theme.text }]}> 
        {item.user.first_name} {item.user.last_name}
      </Text>
    </TouchableOpacity>
  );

  const handleConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDate(selectedDate);
  };

  const uniqueClients = Array.from(
    new Map(matchings.map(m => [m.client.id, m.client])).values()
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Text style={[styles.desc, { color: theme.text }]}>Please select the client and date you would like to make an appointment with.</Text>

      <Text style={[styles.label, { color: theme.text }]}>Select Client</Text>
      <FlatList
        data={uniqueClients}
        renderItem={renderClient}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
      />

      <Text style={[styles.label, { color: theme.text }]}>Select Date</Text>
      <TouchableOpacity
        style={[styles.dateInput, { borderColor: theme.primary }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: date ? theme.text : '#aaa' }}>
          {date ? date.toLocaleDateString() : 'Select Date'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: theme.text }}>
          Tarih Seç
        </Text>
      )}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={() => setShowDatePicker(false)}
        textColor={theme.text}
        pickerContainerStyleIOS={{ backgroundColor: theme.background }}
      />

      <TouchableOpacity
        style={[
          styles.createButton,
          (!selectedClient || !date || creating) && { backgroundColor: '#ccc' },
        ]}
        onPress={handleCreateAppointment}
        disabled={!selectedClient || !date || creating}
      >
        <Text style={styles.createButtonText}>
          {creating ? 'Creating...' : 'Create Appointment'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  desc: { fontSize: 15, marginBottom: 18 },
  label: { fontWeight: 'bold', fontSize: 15, marginBottom: 8 },
  clientCard: {
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    padding: 10,
    width: 90,
    height:120,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginBottom: 6 },
  clientName: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  dateInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default CreateAppointmentScreen;