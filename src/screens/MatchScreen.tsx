import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';

const STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'Accepted',
  3: 'Rejected',
  4: 'Ended',
};

const STATUS_COLORS: Record<number, string> = {
  1: '#FFD700', 
  2: '#43e97b', 
  3: '#E53935', 
  4: '#888',    
};

type Matching = {
  id: number;
  client: {
    id: number;
    user: { first_name: string; last_name: string; email: string };
    profile_picture?: string;
  };
  specialization: { name: string };
  status: number;
  created_at: string;
};

const MatchScreen: React.FC = () => {
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchMatchings();
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
      Alert.alert('Error', 'Failed to fetch matchings');
    }
    setLoading(false);
  };

  const updateStatus = async (id: number, status: number) => {
    setUpdatingId(id);
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.put(
        `${BASE_URL}/api/match/matchings/${id}/`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMatchings();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update status');
    }
    setUpdatingId(null);
  };

  const renderCard = ({ item }: { item: Matching }) => (
    <View style={[styles.card, { borderColor: STATUS_COLORS[item.status] }]}> 
      <View style={styles.row}>
        <Image
          source={item.client.profile_picture ? { uri: item.client.profile_picture } : require('../../assets/images/login.png')}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.client.user.first_name} {item.client.user.last_name}</Text>
          <Text style={styles.specialization}>{item.specialization?.name}</Text>
          <Text style={styles.date}>Requested: {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}> 
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>
      <View style={styles.buttonRow}>
        {item.status !== 2 && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#43e97b' }]}
            onPress={() => updateStatus(item.id, 2)}
            disabled={updatingId === item.id}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        )}
        {item.status !== 3 && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#E53935' }]}
            onPress={() => updateStatus(item.id, 3)}
            disabled={updatingId === item.id}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        )}
        {item.status !== 4 && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#888' }]}
            onPress={() => updateStatus(item.id, 4)}
            disabled={updatingId === item.id}
          >
            <Text style={styles.buttonText}>End</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
      <Text style={[styles.title, { color: theme.primary }]}>Incoming Match Requests</Text>
      <FlatList
        data={matchings}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No match requests found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18 },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 54, height: 54, borderRadius: 27, marginRight: 14, borderWidth: 1, borderColor: '#eee' },
  name: { fontWeight: 'bold', fontSize: 17, color: '#222' },
  specialization: { color: '#000', fontSize: 14, marginTop: 2 },
  date: { color: '#888', fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontWeight: 'bold', fontSize: 13 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginLeft: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default MatchScreen;
