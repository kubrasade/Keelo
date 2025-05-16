import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutsScreen = () => {
  const { theme, isDark } = useTheme();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/traning/workout/`, { headers: { Authorization: `Bearer ${token}` } });
      setWorkouts(res.data);
      setFiltered(res.data);
    } catch (e) {
      setWorkouts([]);
      setFiltered([]);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(workouts);
      return;
    }
    setFiltered(
      workouts.filter(w =>
        w.name?.toLowerCase().includes(q)
      )
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TextInput
          style={[styles.searchBox, { backgroundColor: theme.card, color: theme.text, flex: 1 }]}
          placeholder="Search by workout name..."
          placeholderTextColor={isDark ? '#bbb' : '#888'}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 8, backgroundColor: theme.primary, borderRadius: 8, padding: 10 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Search</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.workoutCard}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.workoutTitle, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.workoutDesc, { color: theme.text }]} numberOfLines={2}>{item.description || ''}</Text>
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  {item.duration && <Text style={styles.workoutMeta}>⏱ {item.duration} min</Text>}
                  {item.difficulty && <Text style={styles.workoutMeta}>  •  Difficulty: {item.difficulty}</Text>}
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>No workouts found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  workoutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  workoutDesc: {
    fontSize: 13,
    color: '#666',
  },
  workoutMeta: {
    fontSize: 13,
    color: '#888',
    marginRight: 10,
  },
});

export default WorkoutsScreen; 