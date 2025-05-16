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
  status: number;
};

const statusToText = (status: number) => {
  if (status === 1) return 'Pending';
  if (status === 2) return 'Accepted';
  if (status === 3) return 'Rejected';
  return String(status);
};

const DietitianReviewScreen: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [dietitianUserId, setDietitianUserId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDietitianUserId(res.data.id);
    })();
  }, []);

  useEffect(() => {
    if (dietitianUserId) fetchReviews();
  }, [dietitianUserId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/match/reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(
        (res.data as Review[]).filter(
          (r) =>
            r.matching &&
            r.matching.dietitian &&
            r.matching.dietitian.user &&
            r.matching.dietitian.user.id === dietitianUserId
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: number, status: number) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.patch(
        `${BASE_URL}/api/match/review/status/${reviewId}/`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Review status updated!');
      fetchReviews();
    } catch (error) {
      Alert.alert('Error', 'Failed to update review status');
    }
  };

  const renderStars = (selected: number) => (
    <View style={{ flexDirection: 'row', marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= selected ? 'star' : 'star-outline'}
          size={24}
          color="#FFD700"
          style={{ marginHorizontal: 1 }}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 18, color: theme.primary, textAlign: 'center' }}>
        My Reviews
      </Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const dietitianProfile = item.matching?.dietitian as DietitianProfile;
            return (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={
                      dietitianProfile?.profile_picture
                        ? { uri: dietitianProfile.profile_picture }
                        : require('../../assets/images/login.png')
                    }
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>
                      {dietitianProfile?.user?.first_name || ''} {dietitianProfile?.user?.last_name || ''}
                    </Text>
                    <View style={styles.stars}>{renderStars(item.rating)}</View>
                  </View>
                </View>
                <Text style={styles.comment}>{item.comment}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <Text>Status: {statusToText(item.status)}</Text>
                {item.status === 1 && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity onPress={() => updateReviewStatus(item.id, 2)} style={{ marginRight: 12 }}>
                      <Text style={{ color: 'green', fontWeight: 'bold' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateReviewStatus(item.id, 3)}>
                      <Text style={{ color: 'red', fontWeight: 'bold' }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No reviews available.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
});

export default DietitianReviewScreen;