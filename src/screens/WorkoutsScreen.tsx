import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutsScreen = () => {
  const { theme, isDark } = useTheme();
  const [plans, setPlans] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/traning/workoutplan/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(res.data);
      setFiltered(res.data);
    } catch (e) {
      setPlans([]);
      setFiltered([]);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(plans);
      return;
    }
    setFiltered(plans.filter(p => p.name?.toLowerCase().includes(q)));
  };

  const openPlanDetail = async (id: number) => {
    setModalVisible(true);
    setLoadingDetail(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/traning/workoutplan/detail/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedPlan(res.data);
    } catch {
      setSelectedPlan(null);
    }
    setLoadingDetail(false);
  };

  const handleAddWorkout = async () => {
    if (!selectedWorkout || !selectedDay) {
      Alert.alert('Warning', 'Please select a workout and day');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.post(
        `${BASE_URL}/api/traning/workout/`,
        {
          workout: selectedWorkout.id,
          day: selectedDay,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedWorkout(null);
      setSelectedDay(null);
      fetchPlans();
      Alert.alert('Success', 'Workout added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add workout');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TextInput
          style={[styles.searchBox, { backgroundColor: theme.card, color: theme.text, flex: 1 }]}
          placeholder="Search workout plans..."
          placeholderTextColor={isDark ? '#bbb' : '#888'}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={{ marginLeft: 8, backgroundColor: theme.primary, borderRadius: 8, padding: 10 }}
        >
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
            <TouchableOpacity onPress={() => openPlanDetail(item.id)}>
              <View style={styles.workoutCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workoutTitle, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.workoutDesc, { color: theme.text }]} numberOfLines={2}>
                    {item.description || ''}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    {item.duration_weeks && (
                      <Text style={styles.workoutMeta}>🗓 {item.duration_weeks} weeks</Text>
                    )}
                    {item.difficulty && (
                      <Text style={styles.workoutMeta}>  •  Difficulty: {item.difficulty}</Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>
              No workout plans found.
            </Text>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%' }}>
            {loadingDetail ? (
              <ActivityIndicator />
            ) : selectedPlan ? (
              <>
                <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 8 }}>{selectedPlan.name}</Text>
                <Text style={{ marginBottom: 6 }}>ID: {selectedPlan.id}</Text>
                <Text style={{ marginBottom: 6 }}>Description: {selectedPlan.description || 'N/A'}</Text>
                <Text style={{ marginBottom: 6 }}>Difficulty: {selectedPlan.difficulty}</Text>
                <Text style={{ marginBottom: 6 }}>Duration: {selectedPlan.duration_weeks} weeks</Text>
                <Text style={{ marginBottom: 6 }}>
                  Personalized? {selectedPlan.is_personalized ? 'Yes' : 'No'}
                </Text>
                <Text style={{ marginBottom: 6 }}>Client ID: {selectedPlan.client ?? '-'}</Text>
                <Text style={{ marginBottom: 6, fontSize: 12, color: '#888' }}>
                  Created At: {selectedPlan.created_at ? new Date(selectedPlan.created_at).toLocaleString() : '-'}
                </Text>
                <Text style={{ marginBottom: 6, fontSize: 12, color: '#888' }}>
                  Updated At: {selectedPlan.updated_at ? new Date(selectedPlan.updated_at).toLocaleString() : '-'}
                </Text>

                {/* Muscle Groups */}
                <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Target Muscle Groups:</Text>
                {selectedPlan.target_muscle_groups && selectedPlan.target_muscle_groups.length > 0 ? (
                  selectedPlan.target_muscle_groups.map((mg: any) => (
                    <View key={mg.id} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 4 }}>
                      {mg.image && (
                        <Image
                          source={{ uri: mg.image }}
                          style={{ width: 40, height: 40, borderRadius: 8, marginRight: 8 }}
                        />
                      )}
                      <View>
                        <Text style={{ fontWeight: 'bold' }}>{mg.name}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>{mg.description}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ marginLeft: 10 }}>-</Text>
                )}

                {/* Equipment */}
                <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Required Equipment:</Text>
                {selectedPlan.equipment_needed && selectedPlan.equipment_needed.length > 0 ? (
                  selectedPlan.equipment_needed.map((eq: any) => (
                    <View key={eq.id} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 4 }}>
                      {eq.image && (
                        <Image
                          source={{ uri: eq.image }}
                          style={{ width: 40, height: 40, borderRadius: 8, marginRight: 8 }}
                        />
                      )}
                      <View>
                        <Text style={{ fontWeight: 'bold' }}>{eq.name}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>{eq.description}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ marginLeft: 10 }}>-</Text>
                )}

                {/* Plan Days */}
                <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Plan Days:</Text>
                {selectedPlan.plan_days && selectedPlan.plan_days.length > 0 ? (
                  selectedPlan.plan_days.map((day: any) => (
                    <Text key={day.id} style={{ marginLeft: 10 }}>
                      • Day {day.day_number}: {day.workout?.name || '-'}
                    </Text>
                  ))
                ) : (
                  <Text style={{ marginLeft: 10 }}>-</Text>
                )}
              </>
            ) : (
              <Text>Failed to load details.</Text>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 20, alignSelf: 'flex-end' }}>
              <Text style={{ color: 'red', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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