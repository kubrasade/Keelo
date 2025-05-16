import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

interface Progress {
  id: number;
  workout: {
    id: number;
    name: string;
    difficulty: number;
    duration: number;
    average_rating: string;
  };
  date: string;
  completed: boolean;
  notes: string;
  duration: number | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface ProgressStats {
  totalWorkouts: number;
  completedWorkouts: number;
  averageRating: number;
  totalDuration: number;
  streak: number;
}

interface UpdateProgressData {
  completed: boolean;
  rating?: number;
  notes?: string;
  duration?: number;
}

const ProgressScreen: React.FC = () => {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    totalWorkouts: 0,
    completedWorkouts: 0,
    averageRating: 0,
    totalDuration: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [selectedProgress, setSelectedProgress] = useState<Progress | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const { theme, isDark } = useTheme();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<number | null>(null);
  const [progressDate, setProgressDate] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userRes = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = (userRes.data as any).id;
      setUserId(userId);
      const response = await axios.get(`${BASE_URL}/api/traning/progress/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user: userId },
      });
      setProgress(response.data as Progress[]);
      calculateStats(response.data as Progress[]);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Progress[]) => {
    const completed = data.filter(p => p.completed);
    const totalDuration = data.reduce((sum, p) => sum + (p.duration || p.workout.duration), 0);
    const totalRating = completed.reduce((sum, p) => sum + (p.rating || 0), 0);
    let currentStreak = 0;
    const sortedDates = data
      .filter(p => p.completed)
      .map(p => new Date(p.date))
      .sort((a, b) => b.getTime() - a.getTime());
    if (sortedDates.length > 0) {
      let currentDate = new Date();
      for (let i = 0; i < sortedDates.length; i++) {
        const diffDays = Math.floor((currentDate.getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0 || diffDays === 1) {
          currentStreak++;
          currentDate = sortedDates[i];
        } else {
          break;
        }
      }
    }
    setStats({
      totalWorkouts: data.length,
      completedWorkouts: completed.length,
      averageRating: completed.length ? totalRating / completed.length : 0,
      totalDuration,
      streak: currentStreak
    });
  };

  const getFilteredProgress = () => {
    switch (selectedFilter) {
      case 'completed':
        return progress.filter(p => p.completed);
      case 'pending':
        return progress.filter(p => !p.completed);
      default:
        return progress;
    }
  };

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  };

  const handleProgressPress = (entry: Progress) => {
    if (!entry.completed) {
      setSelectedProgress(entry);
      setModalVisible(true);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedProgress) return;
    if (!duration) {
      Alert.alert('Uyarı', 'Lütfen süreyi (duration) giriniz.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('access_token');
      const updateData: UpdateProgressData = {
        completed: true,
        rating: rating ? parseInt(rating) : undefined,
        notes: notes || undefined,
        duration: duration ? parseInt(duration) : undefined
      };
      await axios.patch(
        `${BASE_URL}/api/traning/progress/${selectedProgress.id}/`,
        updateData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      Alert.alert('Success', 'Workout completed successfully');
      await fetchProgress();
      setModalVisible(false);
      setSelectedProgress(null);
      setRating('');
      setNotes('');
      setDuration('');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.non_field_errors?.[0] ||
        error?.response?.data?.detail ||
        error?.response?.data ||
        'Failed to update progress. Please try again.'
      );
    }
  };

  const fetchWorkouts = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/traning/workout/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkouts(response.data as any[]);
    } catch {
      Alert.alert('Error', 'Failed to fetch workouts');
    }
  };

  const handleAddProgress = async () => {
    if (!selectedWorkout || !progressDate) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.post(
        `${BASE_URL}/api/traning/progress/`,
        {
          user_id: userId,
          workout_id: selectedWorkout,
          date: progressDate
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      Alert.alert('Başarılı', 'Progress başarıyla eklendi.');
      setAddModalVisible(false);
      setSelectedWorkout(null);
      setProgressDate('');
      fetchProgress();
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.detail || 'Progress eklenemedi.');
    }
  };

  const handleDeleteProgress = async (progressId: number) => {
    Alert.alert(
      'Delete Progress',
      'Are you sure you want to delete this progress?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              await axios.delete(
                `${BASE_URL}/api/traning/progress/${progressId}/`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              Alert.alert('Success', 'Progress deleted.');
              fetchProgress();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.response?.data?.detail ||
                error?.response?.data ||
                'Failed to delete progress.'
              );
            }
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <Text style={[styles.title, { color: theme.primary }]}>Progress</Text>
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}> 
          <Icon name="fitness-outline" size={24} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.completedWorkouts}/{stats.totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Workouts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}> 
          <Icon name="star-outline" size={24} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.averageRating.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Avg Rating</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}> 
          <Icon name="flame-outline" size={24} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.streak}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Day Streak</Text>
        </View>
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: theme.card }, selectedFilter === 'all' && { backgroundColor: theme.primary }]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterButtonText, { color: theme.text }, selectedFilter === 'all' && { color: theme.background }]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: theme.card }, selectedFilter === 'completed' && { backgroundColor: theme.primary }]}
          onPress={() => setSelectedFilter('completed')}
        >
          <Text style={[styles.filterButtonText, { color: theme.text }, selectedFilter === 'completed' && { color: theme.background }]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: theme.card }, selectedFilter === 'pending' && { backgroundColor: theme.primary }]}
          onPress={() => setSelectedFilter('pending')}
        >
          <Text style={[styles.filterButtonText, { color: theme.text }, selectedFilter === 'pending' && { color: theme.background }]}>Pending</Text>
        </TouchableOpacity>
      </View>
      {!progress.length ? (
        <Text style={{ textAlign: 'center', marginTop: 40, color: theme.text }}>No progress data found.</Text>
      ) : (
        getFilteredProgress().map((entry) => (
          <TouchableOpacity 
            key={entry.id} 
            style={[styles.entryCard, { backgroundColor: theme.card }]}
            onPress={() => handleProgressPress(entry)}
            disabled={entry.completed}
          >
            <View style={styles.entryHeader}>
              <Text style={[styles.date, { color: theme.primary }]}>{new Date(entry.date).toLocaleDateString()}</Text>
              <View style={[styles.statusBadge, entry.completed ? styles.completedBadge : styles.pendingBadge, entry.completed ? { backgroundColor: isDark ? '#388e3c' : '#e8f5e9' } : { backgroundColor: isDark ? '#b26a00' : '#fff3e0' }]}> 
                <Text style={[styles.statusText, { color: theme.text }]}>{entry.completed ? 'Completed' : 'Pending'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.workoutName, { color: theme.text }]}>{entry.workout.name}</Text>
              <TouchableOpacity onPress={() => handleDeleteProgress(entry.id)}>
                <Icon name="trash-outline" size={20} color="#ff5252" />
              </TouchableOpacity>
            </View>
            <View style={styles.workoutDetails}>
              <View style={styles.detailItem}>
                <Icon name="time-outline" size={16} color={isDark ? '#bbb' : '#666'} />
                <Text style={[styles.detailText, { color: isDark ? '#bbb' : '#666' }]}>{entry.duration || entry.workout.duration} min</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="barbell-outline" size={16} color={isDark ? '#bbb' : '#666'} />
                <Text style={[styles.detailText, { color: isDark ? '#bbb' : '#666' }]}>{getDifficultyText(entry.workout.difficulty)}</Text>
              </View>
              {entry.rating && (
                <View style={styles.detailItem}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={[styles.detailText, { color: isDark ? '#bbb' : '#666' }]}>{entry.rating}/5</Text>
                </View>
              )}
            </View>
            {entry.notes && (
              <View style={[styles.notesContainer, { backgroundColor: theme.background }]}> 
                <Icon name="document-text-outline" size={16} color={isDark ? '#bbb' : '#666'} />
                <Text style={[styles.notesText, { color: isDark ? '#bbb' : '#666' }]}>{entry.notes}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity
        style={{ alignSelf: 'flex-end', margin: 10, backgroundColor: theme.primary, padding: 10, borderRadius: 8 }}
        onPress={() => {
          console.log('Button pressed');
          fetchWorkouts();
          setAddModalVisible(true);
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Progress</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}> 
            <Text style={[styles.modalTitle, { color: theme.primary }]}>Complete Workout</Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Duration (minutes)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="Enter duration"
                placeholderTextColor={isDark ? '#bbb' : '#999'}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Rating (1-5)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
                value={rating}
                onChangeText={setRating}
                keyboardType="numeric"
                placeholder="Enter rating"
                maxLength={1}
                placeholderTextColor={isDark ? '#bbb' : '#999'}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter notes"
                multiline
                numberOfLines={3}
                placeholderTextColor={isDark ? '#bbb' : '#999'}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.background }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.completeButton, { backgroundColor: theme.primary }]}
                onPress={handleUpdateProgress}
              >
                <Text style={[styles.modalButtonText, styles.completeButtonText]}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}> 
            <Text style={[styles.modalTitle, { color: theme.primary }]}>Add Progress</Text>
            <Text style={{ marginBottom: 8, color: theme.text }}>Workout</Text>
            <ScrollView style={{ maxHeight: 120 }}>
              {workouts.map(w => (
                <TouchableOpacity
                  key={w.id}
                  style={{
                    padding: 10,
                    backgroundColor: selectedWorkout === w.id ? theme.primary : theme.background,
                    borderRadius: 8,
                    marginBottom: 5
                  }}
                  onPress={() => setSelectedWorkout(w.id)}
                >
                  <Text style={{ color: selectedWorkout === w.id ? '#fff' : theme.text }}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ marginTop: 10, color: theme.text }}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
              value={progressDate}
              onChangeText={setProgressDate}
              placeholder="2025-05-03"
              placeholderTextColor={isDark ? '#bbb' : '#999'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.background }]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.completeButton, { backgroundColor: theme.primary }]}
                onPress={handleAddProgress}
              >
                <Text style={[styles.modalButtonText, styles.completeButtonText]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 15, marginHorizontal: 5, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  filterContainer: { flexDirection: 'row', marginBottom: 20 },
  filterButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginHorizontal: 5, alignItems: 'center' },
  filterButtonActive: { backgroundColor: '#007AFF' },
  filterButtonText: { color: '#666' },
  filterButtonTextActive: { color: '#fff' },
  entryCard: { borderRadius: 12, padding: 15, marginBottom: 15 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontWeight: '600', color: '#007AFF' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completedBadge: { backgroundColor: '#e8f5e9' },
  pendingBadge: { backgroundColor: '#fff3e0' },
  statusText: { fontSize: 12, fontWeight: '500' },
  workoutName: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  workoutDetails: { flexDirection: 'row', marginBottom: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  detailText: { marginLeft: 4, color: '#666', fontSize: 14 },
  notesContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, marginTop: 8 },
  notesText: { marginLeft: 8, color: '#666', fontSize: 14, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16 },
  notesInput: { height: 100, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalButton: { flex: 1, padding: 15, borderRadius: 8, marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#f0f0f0' },
  completeButton: { backgroundColor: '#007AFF' },
  modalButtonText: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#333' },
  completeButtonText: { color: 'white' }
});

export default ProgressScreen;