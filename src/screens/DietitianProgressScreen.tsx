import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';


const DietitianProgressScreen = () => {
  const [matchings, setMatchings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMatchings();
    fetchWorkouts();
  }, []);

  const fetchMatchings = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/match/matchings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatchings((res.data as any[]).filter((m: any) => m.status === 2)); // Accepted
    } catch (err) {
      Alert.alert('Hata', 'Eşleşmeler alınamadı.');
    }
    setLoading(false);
  };

  const fetchWorkouts = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/traning/workout/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkouts(res.data as any[]);
    } catch (err) {
      Alert.alert('Hata', 'Antrenmanlar alınamadı.');
    }
  };

  const openModal = (client: any) => {
    setSelectedClient(client);
    setModalVisible(true);
    setWorkoutId('');
    setDate('');
  };

  const handleAddProgress = async () => {
    if (!workoutId || !date) {
      Alert.alert('Uyarı', 'Tüm alanları doldurun.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      type ProgressBody = {
        workout_id: number;
        date: string;
        user_id?: number;
      };
      const body: ProgressBody = {
        workout_id: Number(workoutId),
        date,
      };
      if (selectedClient && selectedClient.user && selectedClient.user.id) {
        body.user_id = selectedClient.user.id;
      }
      await axios.post(`${BASE_URL}/api/traning/progress/`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Başarılı', 'Progress eklendi.');
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Hata', 'Progress eklenemedi.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eşleştiğin Danışanlar</Text>
      <FlatList
        data={matchings}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openModal(item.client)}>
            <Text style={styles.name}>{item.client.user.first_name} {item.client.user.last_name}</Text>
            <Text style={styles.email}>{item.client.user.email}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>Hiç eşleşme yok.</Text>}
      />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Progress Ekle</Text>
            <Text>Antrenman:</Text>
            <FlatList
              data={Array.isArray(workouts) ? workouts : []}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.mealTypeBtn, workoutId == String(item.id) && styles.mealTypeBtnActive]}
                  onPress={() => setWorkoutId(String(item.id))}
                >
                  <Text style={workoutId == String(item.id) ? { color: '#fff', fontWeight: 'bold' } : {}}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => (item?.id ? item.id.toString() : Math.random().toString())}
              style={{ marginVertical: 8 }}
            />
            <Text>Tarih (YYYY-MM-DD):</Text>
            <TextInput value={date} onChangeText={setDate} placeholder="2025-05-03" style={styles.input} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Button title="İptal" onPress={() => setModalVisible(false)} color="#888" />
              <Button title={submitting ? 'Ekleniyor...' : 'Ekle'} onPress={handleAddProgress} disabled={submitting} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  name: { fontWeight: 'bold', fontSize: 17, color: '#222' },
  email: { color: '#888', fontSize: 14, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, marginVertical: 6 },
  mealTypeBtn: {
    borderWidth: 1,
    borderColor: '#43e97b',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  mealTypeBtnActive: {
    backgroundColor: '#43e97b',
    borderColor: '#43e97b',
  },
});

export default DietitianProgressScreen;
