import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, Modal, FlatList, Alert } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

type Specialization = { id: number; name: string };
type Dietitian = {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  specializations: ({ name: string } | string)[];
  city: string;
  rating: number;
  experience_years: number;
  bio?: string;
  education?: string;
  certificate_info?: string;
  consultation_fee?: number;
  website?: string;
  user?: {
    first_name: string;
    last_name: string;
  };
};

const FindDietitianScreen: React.FC = () => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<Specialization | null>(null);
  const [dietitians, setDietitians] = useState<Dietitian[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDietitian, setSelectedDietitian] = useState<Dietitian | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [existingMatch, setExistingMatch] = useState(false);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    fetchSpecializations();
    fetchAndStoreClientId();
  }, []);

  const fetchSpecializations = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/specializations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpecializations(response.data);
    } catch {
      setError('Failed to load specializations.');
    }
  };

  const fetchDietitians = async (specId: number, searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('access_token');
      let url = `${BASE_URL}/api/match/dietitians/by-specialization/${specId}/`;
      if (searchTerm) url += `?search=${searchTerm}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDietitians(response.data);
    } catch {
      setError('Failed to load dietitians.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (selectedSpec) fetchDietitians(selectedSpec.id, search.trim());
  };

  const handleSelectSpecialization = (spec: Specialization) => {
    setSelectedSpec(spec);
    setExistingMatch(false);
    setModalVisible(false);
    fetchDietitians(spec.id, search.trim());
  };

  const handleDietitianPress = async (dietitian: Dietitian) => {
    setExistingMatch(false);
    setDetailLoading(true);
    setDetailModalVisible(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(
        `${BASE_URL}/api/dietitians/${dietitian.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedDietitian(response.data);
      if (selectedSpec) {
        await checkExistingMatch(dietitian.id, selectedSpec.id);
      } else {
        setExistingMatch(false);
      }
    } catch {
      setSelectedDietitian(null);
      Alert.alert('Error', 'Could not load dietitian details.');
      setDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchAndStoreClientId = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userEmail = await AsyncStorage.getItem('user_email');
      const response = await axios.get(`${BASE_URL}/api/clients/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const client = response.data.find((c: any) => c.user.email === userEmail);
      if (client) {
        await AsyncStorage.setItem('client_id', client.id.toString());
        console.log('client_id set:', client.id);
      } else {
        console.log('No client found for userEmail:', userEmail);
      }
    } catch (e) {
      console.log('fetchAndStoreClientId error:', e);
    }
  };

  const handleMatchRequest = async () => {
    if (!selectedDietitian) {
      Alert.alert('Error', 'Please select a dietitian first.');
      return;
    }

    setMatchingLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const clientIdStr = await AsyncStorage.getItem('client_id');
      console.log('clientIdStr:', clientIdStr);
      const client_id = clientIdStr ? Number(clientIdStr) : undefined;
      const dietitian_id = Number(selectedDietitian.id);
      const specialization_id = selectedSpec?.id ? Number(selectedSpec.id) : undefined;

      if (!client_id || !dietitian_id || !specialization_id) {
        Alert.alert('Error', 'Required information is missing. Please try logging out and logging in again.');
        setMatchingLoading(false);
        return;
      }

      const requestData = {
        client_id,
        dietitian_id,
        specialization_id,
      };

      console.log('client_id:', client_id);
      console.log('dietitian_id:', dietitian_id);
      console.log('specialization_id:', specialization_id);
      console.log('Sending match request:', requestData);

      const response = await axios.post(
        `${BASE_URL}/api/match/matchings/`,
        requestData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          validateStatus: function (status: number) {
            return status < 500;
          }
        }
      );

      if (response.status === 201) {
        setExistingMatch(true);
        Alert.alert('Success', 'Your match request has been sent!');
        setDetailModalVisible(false);
      } else {
        const errorMessage = response.data.detail || response.data.message || 'Unknown error occurred';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const backendMsg = err?.response?.data?.detail || err?.response?.data?.message || '';
      Alert.alert('Error', backendMsg || 'Unable to send match request. Please try again later or contact support.');
    } finally {
      setMatchingLoading(false);
    }
  };

  const checkExistingMatch = async (dietitianId: number, specializationId: number) => {
    const token = await AsyncStorage.getItem('access_token');
    const clientIdStr = await AsyncStorage.getItem('client_id');
    const client_id = clientIdStr ? parseInt(clientIdStr, 10) : undefined;
    if (!client_id) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/api/match/matchings/?client_id=${client_id}&dietitian_id=${dietitianId}&specialization_id=${specializationId}&include_deleted=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('MATCH RESPONSE:', response.data, Array.isArray(response.data), response.data.length);
      if (Array.isArray(response.data)) {
        setExistingMatch(response.data.length > 0);
      } else {
        setExistingMatch(false);
      }
    } catch (error) {
      console.error('Error checking existing match:', error);
      setExistingMatch(false);
    }
  };

  const formatSpecializations = (specializations: any) => {
    if (Array.isArray(specializations)) {
      if (specializations.length && typeof specializations[0] === 'object') {
        return specializations.map((s: any) => s.name);
      }
      return specializations;
    }
    return [];
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.searchRow, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: theme.card, borderColor: isDark ? '#333' : '#E0E0E0' }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: selectedSpec ? theme.primary : theme.text, fontWeight: 'bold' }}>
            {selectedSpec ? selectedSpec.name : 'Select Specialization'}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: isDark ? '#333' : '#E0E0E0' }]}
          placeholder="Search by name or city..."
          placeholderTextColor={isDark ? '#bbb' : '#888'}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={handleSearch}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Search</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.primary }]}>Select Specialization</Text>
            <FlatList
              data={specializations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectSpecialization(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: theme.text, fontWeight: 'bold', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setDetailModalVisible(false);
          setExistingMatch(false);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.detailModalContent, { backgroundColor: theme.card }]}>
            {detailLoading ? (
              <ActivityIndicator size="large" />
            ) : selectedDietitian ? (
              <>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={
                      selectedDietitian.profile_picture
                        ? { uri: selectedDietitian.profile_picture }
                        : require('../../assets/images/diyetisyen1.png')
                    }
                    style={styles.detailAvatar}
                  />
                </View>
                <Text style={styles.detailName}>
                  {selectedDietitian.user?.first_name || selectedDietitian.first_name} {selectedDietitian.user?.last_name || selectedDietitian.last_name}
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailCityIcon}>📍</Text>
                  <Text style={styles.detailCity}>{selectedDietitian.city || 'No city information'}</Text>
                  <View style={styles.detailExpBox}>
                    <Text style={styles.detailExpText}>{selectedDietitian.experience_years} years experience</Text>
                  </View>
                </View>
                <View style={styles.ratingRow}>
                  {[...Array(5)].map((_, i) => (
                    <Text key={i} style={styles.ratingStar}>
                      {i < Math.round(Number(selectedDietitian.rating)) ? '★' : '☆'}
                    </Text>
                  ))}
                  <Text style={styles.ratingValue}>{Number(selectedDietitian.rating)?.toFixed(1) || '0.0'}</Text>
                </View>
                <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
                  <View style={styles.specsRow}>
                    {(selectedDietitian.specializations || []).map((spec: any, i: number) => (
                      <View key={i} style={styles.chip}>
                        <Text style={styles.chipText}>{typeof spec === 'string' ? spec : spec.name}</Text>
                      </View>
                    ))}
                  </View>
                  {selectedDietitian.bio && (
                    <Text style={styles.detailBio}>{selectedDietitian.bio}</Text>
                  )}
                  <View style={styles.infoSection}>
                    {selectedDietitian.education && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>🎓</Text>
                        <Text style={styles.infoText}>{selectedDietitian.education}</Text>
                      </View>
                    )}
                    {selectedDietitian.certificate_info && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📄</Text>
                        <Text style={styles.infoText}>{selectedDietitian.certificate_info}</Text>
                      </View>
                    )}
                    {selectedDietitian.consultation_fee && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>💸</Text>
                        <Text style={styles.infoText}>{selectedDietitian.consultation_fee}₺ / session</Text>
                      </View>
                    )}
                    {selectedDietitian.website && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>🌐</Text>
                        <Text style={styles.infoText}>{selectedDietitian.website}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={[styles.matchButton, { backgroundColor: existingMatch ? '#ccc' : theme.primary }]}
                  onPress={handleMatchRequest}
                  disabled={matchingLoading || existingMatch}
                >
                  <Text style={[styles.matchButtonText, { color: theme.background }]}>
                    {existingMatch
                      ? 'You already have a matching request!'
                      : (matchingLoading ? 'Sending...' : 'Send Match Request')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    setDetailModalVisible(false);
                    setExistingMatch(false);
                  }}
                >
                  <Text style={{ color: theme.text, fontWeight: 'bold', textAlign: 'center' }}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ color: 'red', margin: 20 }}>Details could not be loaded.</Text>
            )}
          </View>
        </View>
      </Modal>

      {loading ? (
        <ActivityIndicator style={{ flex: 1, marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !dietitians.length ? (
        <Text style={styles.emptyText}>No dietitians found.</Text>
      ) : (
        <ScrollView style={{ marginTop: 10 }}>
          {dietitians.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.card, { backgroundColor: theme.card, borderColor: isDark ? '#333' : '#F5F5F5' }]}
              onPress={() => handleDietitianPress(d)}
            >
              <View style={[styles.cardAvatarWrapper, { backgroundColor: theme.background, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                <Image
                  source={d.profile_picture ? { uri: d.profile_picture } : require('../../assets/images/diyetisyen1.png')}
                  style={styles.avatar}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]}>{d.first_name} {d.last_name}</Text>
                <View style={styles.row}>
                  <Text style={[styles.city, { color: theme.text }]}>{d.city}</Text>
                  <View style={[styles.expBox, { backgroundColor: isDark ? '#23262F' : '#E3F2FD' }]}>
                    <Text style={[styles.expText, { color: theme.primary }]}>{d.experience_years} years</Text>
                  </View>
                </View>
                <View style={styles.specsRow}>
                  {formatSpecializations(d.specializations).map((spec: string, i: number) => (
                    <View key={i} style={[styles.chip, { backgroundColor: isDark ? '#23262F' : '#F5F5F5' }]}>
                      <Text style={[styles.chipText, { color: theme.text }]}>{spec}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.ratingRow}>
                  {[...Array(5)].map((_, i) => (
                    <Text key={i} style={styles.ratingStar}>
                      {i < Math.round(Number(d.rating)) ? '★' : '☆'}
                    </Text>
                  ))}
                  <Text style={styles.ratingValue}>{Number(d.rating)?.toFixed(1) || '0.0'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    padding: 16 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    marginBottom: 24, 
    color: '#1A1A1A',
    textAlign: 'center'
  },
  searchRow: { 
    flexDirection: 'row', 
    marginBottom: 24, 
    alignItems: 'center',
    gap: 8
  },
  selectButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  selectButtonText: {
    color: '#3498DB',
    fontWeight: 'bold',
    fontSize: 16
  },

  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  
  searchButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5'
  },
  cardAvatarWrapper: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 32,
    marginRight: 14,
    backgroundColor: '#fff',
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden'
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    resizeMode: 'cover'
  },
  name: { 
    fontWeight: 'bold', 
    fontSize: 20, 
    color: '#222', 
    marginBottom: 4 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  city: { 
    color: '#666666', 
    fontSize: 14, 
    marginRight: 10 
  },
  expBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start'
  },
  expText: { 
    color: '#1976D2', 
    fontSize: 12, 
    fontWeight: '500' 
  },
  specsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 8, 
    gap: 4
  },
  chip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  chipText: { 
    color: '#666666', 
    fontSize: 12
  },
  ratingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8 
  },
  ratingStar: { 
    fontSize: 16, 
    color: '#FFC107', 
    marginRight: 2 
  },
  ratingValue: { 
    color: '#FFC107', 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 4 
  },
  errorText: { 
    color: 'red', 
    textAlign: 'center', 
    marginTop: 40, 
    fontSize: 16 
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 40, 
    color: '#888', 
    fontSize: 16 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '70%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalItemText: {
    fontSize: 16,
    color: '#333'
  },
  modalCancel: {
    marginTop: 16,
    padding: 12
  },
  detailModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  },
  avatarWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 50,
    padding: 6,
    marginBottom: 8
  },
  detailAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#2E7D32'
  },
  detailName: { 
    fontSize: 24, 
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    justifyContent: 'center'
  },
  detailCityIcon: { 
    fontSize: 18, 
    marginRight: 4 
  },
  detailCity: { 
    color: '#666666', 
    fontSize: 16, 
    marginRight: 12 
  },
  detailExpBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  detailExpText: { 
    color: '#2E7D32', 
    fontSize: 14,
    fontWeight: '500'
  },
  detailBio: { 
    color: '#444444', 
    fontSize: 15, 
    marginVertical: 12, 
    fontStyle: 'italic', 
    textAlign: 'center',
    lineHeight: 22
  },
  infoSection: { 
    width: '100%', 
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    paddingHorizontal: 8
  },
  infoIcon: { 
    fontSize: 20, 
    marginRight: 12,
    color: '#2E7D32'
  },
  infoText: { 
    color: '#333333', 
    fontSize: 15,
    flex: 1
  },
  matchButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 24,
    marginBottom: 16,
    alignSelf: 'center',
  },
  matchButtonText: { 
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  closeButton: {
    padding: 12,
    alignSelf: 'center'
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500'
  }
});

export default FindDietitianScreen;