import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type DietitianProfile = {
  id: number;
  user: User;
  specializations: any[]; 
  experience_years: number;
  profile_picture?: string;
};

type Matching = {
  id: number;
  dietitian: DietitianProfile;
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  matching: Matching;
};

const ReviewScreen: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [selectedMatching, setSelectedMatching] = useState<Matching | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchReviews();
    fetchMatchings();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/match/reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('reviews:', res.data);
      setReviews(
        (res.data as Review[]).filter(
          (r) => r.matching && r.matching.dietitian && r.matching.dietitian.user
        )
      );
    } catch (error) {
      console.log('fetchReviews error:', error);
      Alert.alert('Error', 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchings = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/match/matchings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('matchings:', res.data);
      setMatchings(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch matchings');
    }
  };

  const submitReview = async () => {
    if (!selectedMatching) {
      Alert.alert('Warning', 'Please select a dietitian.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Warning', 'Please select a rating.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (editingReview) {
        await axios.patch(`${BASE_URL}/api/match/reviews/${editingReview.id}/`, {
          rating,
          comment,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditingReview(null);
      } else {
        await axios.post(`${BASE_URL}/api/match/reviews/`, {
          matching_id: selectedMatching.id,
          rating,
          comment,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setRating(0);
      setComment('');
      setSelectedMatching(null);
      fetchReviews();
      Alert.alert('Success', editingReview ? 'Review updated!' : 'Review submitted!');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.detail || 'Failed to submit review');
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setSelectedMatching(review.matching);
    setRating(review.rating);
    setComment(review.comment);
  };

  const handleDelete = async (reviewId: number) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('access_token');
            await axios.delete(`${BASE_URL}/api/match/reviews/${reviewId}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchReviews();
            Alert.alert('Success', 'Review deleted!');
          } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to delete review');
          }
        },
      },
    ]);
  };

  const renderStars = (selected: number, onSelect?: (n: number) => void) => (
    <View style={{ flexDirection: 'row', marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onSelect && onSelect(n)} disabled={!onSelect}>
          <Ionicons
            name={n <= selected ? 'star' : 'star-outline'}
            size={24}
            color="#FFD700"
            style={{ marginHorizontal: 1 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDietitianSelector = () => (
    <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.primary }]}>Select Dietitian</Text>
          <FlatList
            data={matchings.filter(m => !!m.dietitian?.user)}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dietitianItem}
                onPress={() => {
                  setSelectedMatching(item);
                  setModalVisible(false);
                }}
              >
                <Image
                  source={item.dietitian?.profile_picture
                    ? { uri: item.dietitian.profile_picture }
                    : require('../../assets/images/login.png')}
                  style={styles.avatar}
                />
                <Text style={styles.name}>
                  {item.dietitian?.user?.first_name || ''} {item.dietitian?.user?.last_name || ''}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20 }}>
                No dietitians found. Please match with a dietitian first!
              </Text>
            }
          />
          <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
            <Text style={{ color: theme.text, fontWeight: 'bold', textAlign: 'center' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      <View style={styles.addReviewCard}>
        <Text style={styles.addReviewTitle}>Add Review</Text>
        <TouchableOpacity style={styles.dietitianSelectBox} onPress={() => setModalVisible(true)}>
          <Ionicons name="person-circle-outline" size={22} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={styles.dietitianSelectText}>
            {selectedMatching
              ? `${selectedMatching.dietitian.user.first_name} ${selectedMatching.dietitian.user.last_name}`
              : 'Select Dietitian'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.primary} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <View style={styles.starsRow}>{renderStars(rating, setRating)}</View>
        <TextInput
          style={styles.reviewInput}
          placeholder="Write your comment..."
          value={comment}
          onChangeText={setComment}
          multiline
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.submitButtonModern} onPress={submitReview}>
          <Text style={styles.submitButtonText}>{editingReview ? 'Update' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>

      {editingReview && (
        <TouchableOpacity 
          style={styles.cancelEditButton}
          onPress={() => {
            setEditingReview(null);
            setRating(0);
            setComment('');
            setSelectedMatching(null);
          }}
        >
          <Text style={styles.cancelEditText}>Cancel Edit</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={reviews.filter(r => r.matching && r.matching.dietitian && r.matching.dietitian.user)}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const dietitianProfile = item.matching?.dietitian as DietitianProfile;
            return (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={dietitianProfile?.profile_picture 
                      ? { uri: dietitianProfile.profile_picture } 
                      : require('../../assets/images/login.png')}
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>
                      {dietitianProfile?.user?.first_name || ''} {dietitianProfile?.user?.last_name || ''}
                    </Text>
                    <View style={styles.stars}>{renderStars(item.rating)}</View>
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Ionicons name="create-outline" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.comment}>{item.comment}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No reviews yet. Add your first review above!</Text>
          }
        />
      )}
      {renderDietitianSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  reviewCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  stars: {
    flexDirection: 'row',
    marginTop: 2,
  },
  comment: {
    fontSize: 15,
    color: '#444',
    marginVertical: 8,
  },
  date: {
    fontSize: 12,
    color: '#aaa',
    alignSelf: 'flex-end',
  },
  addReviewCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  addReviewTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
    color: '#2E7D32',
    textAlign: 'center',
  },
  dietitianSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#f6fff7',
  },
  dietitianSelectText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    color: '#222',
  },
  submitButtonModern: {
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#43e97b',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center' },
  dietitianItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  modalCancel: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  cancelEditButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    padding: 8,
  },
  cancelEditText: {
    color: '#E53935',
    fontWeight: 'bold',
  },
});

export default ReviewScreen;