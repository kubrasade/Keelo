import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalSelector from 'react-native-modal-selector';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';

type UserData = {
  first_name?: string;
  last_name?: string;
};

type Specialization = {
  id: number;
  name: string;
};

type DietitianProfile = {
  id?: number;
  user?: number;
  license_number?: number;
  bio?: string;
  education?: string;
  experience_years?: number;
  certificate_info?: string;
  consultation_fee?: number;
  availability?: string;
  website?: string;
  social_links?: string;
  profile_picture?: string | Asset | null;
  gender?: number;
  birth_date?: string;
  specializations_ids?: number[];
  specializations?: Specialization[];
};

type Props = {
  navigation: any;
};

const genderOptions = [
  { key: 1, label: 'Male' },
  { key: 2, label: 'Female' },
  { key: 3, label: 'Other' },
];

const DietitianProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [profile, setProfile] = useState<DietitianProfile>({});
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData>({});
  const { theme, isDark } = useTheme();
  const [originalProfile, setOriginalProfile] = useState<DietitianProfile>({});
  

  useEffect(() => {
    fetchProfile();
    fetchSpecializations();
    fetchUserData();
  }, []);


  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to fetch user data');
    }
  };

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userResponse = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userId = userResponse.data.id;
      const profileResponse = await axios.get(`${BASE_URL}/api/dietitians/?dietitian_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let dietitianProfile = profileResponse.data[0];
      if (dietitianProfile) {
        if (dietitianProfile.availability && typeof dietitianProfile.availability === 'object') {
          const av = dietitianProfile.availability;
          if (av.start && av.end) {
            dietitianProfile.availability = `${av.start} - ${av.end}`;
          }
        } else if (typeof dietitianProfile.availability === 'string') {
          try {
            const avObj = JSON.parse(dietitianProfile.availability);
            if (avObj.start && avObj.end) {
              dietitianProfile.availability = `${avObj.start} - ${avObj.end}`;
            }
          } catch {}
        }
        if (Array.isArray(dietitianProfile.social_links)) {
          dietitianProfile.social_links = dietitianProfile.social_links.join(', ');
        } else if (typeof dietitianProfile.social_links === 'string') {
          try {
            const linksArr = JSON.parse(dietitianProfile.social_links);
            if (Array.isArray(linksArr)) {
              dietitianProfile.social_links = linksArr.join(', ');
            }
          } catch {}
        }
        if (Array.isArray(dietitianProfile.specializations_ids)) {
          dietitianProfile.specializations_ids = dietitianProfile.specializations_ids.map(Number);
        } else if (Array.isArray(dietitianProfile.specializations)) {
          dietitianProfile.specializations_ids = dietitianProfile.specializations.map((s: any) => Number(s.id));
        } else {
          dietitianProfile.specializations_ids = [];
        }
        setProfile(dietitianProfile);
        setOriginalProfile(dietitianProfile);
      } else {
        Alert.alert('Error', 'Dietitian profile not found!');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile');
    } finally {
      setLoading(false); 
    }
  };

  const fetchSpecializations = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/specializations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSpecializations(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch specializations');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('Token not found');
      if (!profile.id) {
        Alert.alert('Error', 'Profile ID not found!');
        setLoading(false);
        return;
      }
      let dataToSend: any;
      let headers: any = { Authorization: `Bearer ${token}` };
      const changedFields: any = {};
      Object.entries(profile).forEach(([key, value]) => {
        if (key === 'profile_picture' || key === 'availability' || key === 'social_links') {
          return;
        }
        if (originalProfile[key as keyof DietitianProfile] !== value) {
          changedFields[key] = value;
        }
      });
      if (profile.profile_picture !== originalProfile.profile_picture) {
        changedFields.profile_picture = profile.profile_picture;
      }
      if (profile.availability !== originalProfile.availability) {
        if (profile.availability && typeof profile.availability === 'string' && profile.availability.includes(' - ')) {
          const [start, end] = profile.availability.split(' - ');
          changedFields.availability = JSON.stringify({ start: start.trim(), end: end.trim() });
        } else if (profile.availability) {
          changedFields.availability = JSON.stringify({ start: profile.availability, end: profile.availability });
        }
      }
      if (profile.social_links !== originalProfile.social_links) {
        if (profile.social_links && typeof profile.social_links === 'string') {
          const links = profile.social_links.split(',').map(link => link.trim()).filter(link => link);
          changedFields.social_links = JSON.stringify(links);
        }
      }
      if (changedFields.specializations_ids) {
        changedFields.specializations_ids = (changedFields.specializations_ids as any[]).map(Number);
      }
      if (changedFields.profile_picture && typeof changedFields.profile_picture !== 'string') {
        dataToSend = new FormData();
        Object.entries(changedFields).forEach(([key, value]) => {
          if (key === 'profile_picture' && value && typeof value !== 'string') {
            const asset = value as Asset;
            if (asset.uri) {
              dataToSend.append('profile_picture', {
                uri: asset.uri,
                type: asset.type || 'image/jpeg',
                name: asset.fileName || 'profile.jpg',
              } as any);
            }
          } else {
            dataToSend.append(key, String(value));
          }
        });
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        dataToSend = changedFields;
        headers['Content-Type'] = 'application/json';
      }
      if (Object.keys(dataToSend).length === 0) {
        Alert.alert('No changes', 'No fields were changed.');
        setLoading(false);
        return;
      }
      if (profile.specializations_ids) {
        profile.specializations_ids = (profile.specializations_ids as any[]).map(Number);
      }
      await axios.patch(`${BASE_URL}/api/dietitians/${profile.id}/`, dataToSend, { headers });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating profile:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
        maxWidth: 500,
        maxHeight: 500,
        selectionLimit: 1,
      });

      if (result.didCancel) {
      } else if (result.errorMessage) {
        Alert.alert('Error', `ImagePicker Error: ${result.errorMessage}`);
      } else if (result.assets && result.assets.length > 0) {
        setProfile((prev) => ({
          ...prev,
          profile_picture: result.assets![0],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.profileHeader, { backgroundColor: theme.card }]}>
        {profile.profile_picture && typeof profile.profile_picture === 'string' && (
          <Image
            source={{ uri: profile.profile_picture }}
            style={{ width: 100, height: 100, borderRadius: 50, marginTop: 10 }}
          />
        )}
        {profile.profile_picture && typeof profile.profile_picture !== 'string' && (
          <Image
            source={{ uri: (profile.profile_picture as Asset).uri }}
            style={{ width: 100, height: 100, borderRadius: 50, marginTop: 10 }}
          />
        )}
        <Text style={[styles.name, { color: theme.text }]}>
          {userData.first_name && userData.last_name
            ? `${userData.first_name} ${userData.last_name}`
            : 'User'}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Personal Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Biography</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.bio || ''}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            editable={isEditing}
            multiline
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>License Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.license_number ? String(profile.license_number) : ''}
            onChangeText={(text) => {
              const numValue = text ? parseInt(text) : undefined;
              setProfile({ ...profile, license_number: numValue });
            }}
            editable={isEditing}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Education</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.education || ''}
            onChangeText={(text) => setProfile({ ...profile, education: text })}
            editable={isEditing}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Experience (Years)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.experience_years !== undefined ? String(profile.experience_years) : ''}
            onChangeText={(text) => setProfile({ ...profile, experience_years: parseInt(text) || 0 })}
            editable={isEditing}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <ModalSelector
            data={genderOptions}
            initValue={genderOptions.find(opt => opt.key === profile.gender)?.label || ''}
            onChange={(option) => setProfile({ ...profile, gender: option.key })}
            disabled={!isEditing}
          >
            <Text style={[styles.input, { color: theme.text }]}>
              {genderOptions.find(opt => opt.key === profile.gender)?.label || ''}
            </Text>
          </ModalSelector>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Birth Date</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.birth_date || ''}
            onChangeText={(text) => setProfile({ ...profile, birth_date: text })}
            editable={isEditing}
          />
        </View>
        <TouchableOpacity onPress={handleImagePick} style={styles.button}>
          <Text style={styles.buttonText}>Pick Profile Picture</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Specializations</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Specializations</Text>
          <ModalSelector
            data={specializations.map(s => ({ key: s.id, label: s.name }))}
            initValue="Select Specialization"
            onChange={(option) => {
              const id = Number(option.key);
              if (!profile.specializations_ids?.includes(id)) {
                setProfile({
                  ...profile,
                  specializations_ids: [...(profile.specializations_ids || []), id],
                });
              }
            }}
            disabled={!isEditing}
          >
            <Text style={[styles.input, { color: theme.text }]}>
              {(profile.specializations_ids || [])
                .map(id => specializations.find(s => s.id === id)?.name)
                .filter(Boolean)
                .join(', ') || 'Select Specialization'}
            </Text>
          </ModalSelector>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
            {(profile.specializations_ids || []).map(id => {
              const spec = specializations.find(s => s.id === id);
              if (!spec) return null;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    { backgroundColor: '#eee', borderRadius: 12, padding: 6, margin: 2 },
                    { backgroundColor: isDark ? '#333' : '#fff' }
                  ]}
                  onPress={() =>
                    setProfile({
                      ...profile,
                      specializations_ids: (profile.specializations_ids || []).filter(sid => sid !== id),
                    })
                  }
                  disabled={!isEditing}
                >
                  <Text style={[
                    { color: '#2E7D32' },
                    { color: isDark ? '#ccc' : '#2E7D32' }
                  ]}>{spec.name} ✕</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Other Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Certificate Information</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.certificate_info || ''}
            onChangeText={(text) => setProfile({ ...profile, certificate_info: text })}
            editable={isEditing}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Consultation Fee</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.consultation_fee !== undefined ? String(profile.consultation_fee) : ''}
            onChangeText={(text) => setProfile({ ...profile, consultation_fee: parseInt(text) || 0 })}
            editable={isEditing}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Availability</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.availability || ''}
            onChangeText={(text) => setProfile({ ...profile, availability: text })}
            editable={isEditing}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.website || ''}
            onChangeText={(text) => setProfile({ ...profile, website: text })}
            editable={isEditing}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Social Media Links</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#23262F' : '#fff', color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.social_links || ''}
            onChangeText={(text) => setProfile({ ...profile, social_links: text })}
            editable={isEditing}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: isDark ? '#666' : '#bbb' }]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      padding: 20,  
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 20,
      backgroundColor: '#fff',
      marginBottom: 20,
      borderRadius: 10, 
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000',
    },
    section: {
      backgroundColor: '#fff',
      padding: 20,
      marginBottom: 20,
      borderRadius: 10,
      shadowColor: '#000',  
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,  
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2E7D32',  
      marginBottom: 15,
    },
    inputGroup: {
      marginBottom: 20,  
    },
    label: {
      fontSize: 16,
      color: '#666',
      marginBottom: 5,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 15,
      fontSize: 16,
      color: '#333',
      backgroundColor: '#fff',
      height: 45, 
      marginBottom: 10,  
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingTop: 10,  
    },
    button: {
      backgroundColor: '#2E7D32',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
      marginHorizontal: 5,
      minWidth: 120,  
    },
    saveButton: {
      backgroundColor: '#2E7D32',
    },
    cancelButton: {
      backgroundColor: '#666',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    imageContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginTop: 10,
    },
  });

export default DietitianProfileScreen;