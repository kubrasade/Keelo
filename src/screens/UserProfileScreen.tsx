import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
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

type ClientProfile = {
  id?: number;
  user?: number;
  dietitian?: number | null;
  birth_place?: string;
  profile_picture?: string | Asset | null;
  gender?: number;
  birth_date?: string;
  height?: number;
  weight?: string;
  target_weight?: string;
  health_conditions?: string;
  allergies?: string;
  medications?: string;
  lifestyle?: string;
  fitness_level?: number;
  dietary_preferences?: string;
};

type Props = {
  navigation: any;
};

const genderOptions = [
  { key: 1, label: 'Male' },
  { key: 2, label: 'Female' },
  { key: 3, label: 'Other' },
];

const fitnessOptions = [
  { key: 1, label: 'Beginner' },
  { key: 2, label: 'Intermediate' },
  { key: 3, label: 'Advanced' },
];

const UserProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [profile, setProfile] = useState<ClientProfile>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>({});
  const { theme, isDark } = useTheme();

  useEffect(() => {
    fetchProfile();
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
      const response = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const userId = response.data.id;  
  
      const profileResponse = await axios.get(`${BASE_URL}/api/clients/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const userProfile = profileResponse.data.find((profile: ClientProfile) => profile.user === userId);
  
      if (userProfile) {
        setProfile(userProfile);
      } else {
        Alert.alert('Error', 'Profile not found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile');
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

      if (profile.profile_picture && typeof profile.profile_picture !== 'string') {
        dataToSend = new FormData();
        Object.entries(profile).forEach(([key, value]) => {
          if (key === 'profile_picture' && value && typeof value !== 'string') {
            const asset = value as Asset;
            if (asset.uri) {
              dataToSend.append('profile_picture', {
                uri: asset.uri,
                type: asset.type || 'image/jpeg',
                name: asset.fileName || 'profile.jpg',
              } as any);
            }
          } else if (value !== undefined && value !== null) {
            dataToSend.append(key, String(value));
          }
        });
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        dataToSend = { ...profile };
        headers['Content-Type'] = 'application/json';
      }

      await axios.patch(`${BASE_URL}/api/clients/${profile.id}/`, dataToSend, { headers });

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
          <Text style={[styles.label, { color: theme.text } ]}>Birth Place</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.birth_place || ''}
            onChangeText={(text) => setProfile({ ...profile, birth_place: text })}
            editable={isEditing}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Gender</Text>
          <ModalSelector
            data={genderOptions}
            initValue={genderOptions.find(opt => opt.key === profile.gender)?.label || ''}
            onChange={(option: { key: number; label: string }) => setProfile({ ...profile, gender: option.key })}
            disabled={!isEditing}
          >
            <Text style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}>{genderOptions.find(opt => opt.key === profile.gender)?.label || ''}</Text>
          </ModalSelector>
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Birth Date</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.birth_date || ''}
            onChangeText={(text) => setProfile({ ...profile, birth_date: text })}
            editable={isEditing}
          />
        </View>
        <TouchableOpacity onPress={handleImagePick} style={[styles.button, { backgroundColor: theme.primary }]}>
          <Text style={[styles.buttonText, { color: theme.background }]}>Pick Profile Picture</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Health Information</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Height (cm)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.height !== undefined ? String(profile.height) : ''}
            onChangeText={(text) => setProfile({ ...profile, height: parseInt(text) || 0 })}
            editable={isEditing}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.weight || ''}
            onChangeText={(text) => setProfile({ ...profile, weight: text })}
            editable={isEditing}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Target Weight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.target_weight || ''}
            onChangeText={(text) => setProfile({ ...profile, target_weight: text })}
            editable={isEditing}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Health Conditions</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.health_conditions || ''}
            onChangeText={(text) => setProfile({ ...profile, health_conditions: text })}
            editable={isEditing}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Additional Information</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Allergies</Text>
          <TextInput
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.allergies || ''}
            onChangeText={(text) => setProfile({ ...profile, allergies: text })}
            editable={isEditing}
            multiline
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Medications</Text>
          <TextInput
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.medications || ''}
            onChangeText={(text) => setProfile({ ...profile, medications: text })}
            editable={isEditing}
            multiline
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Lifestyle</Text>
          <TextInput
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.lifestyle || ''}
            onChangeText={(text) => setProfile({ ...profile, lifestyle: text })}
            editable={isEditing}
            multiline
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Fitness Level</Text>
          <ModalSelector
            data={fitnessOptions}
            initValue={fitnessOptions.find(opt => opt.key === profile.fitness_level)?.label || ''}
            onChange={(option: { key: number; label: string }) => setProfile({ ...profile, fitness_level: option.key })}
            disabled={!isEditing}
          >
            <Text style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}>{fitnessOptions.find(opt => opt.key === profile.fitness_level)?.label || ''}</Text>
          </ModalSelector>
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text } ]}>Dietary Preferences</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
            value={profile.dietary_preferences || ''}
            onChangeText={(text) => setProfile({ ...profile, dietary_preferences: text })}
            editable={isEditing}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={loading}>
              <Text style={[styles.buttonText, { color: theme.background }]}>{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton, { backgroundColor: isDark ? '#444' : '#666' }]} onPress={() => setIsEditing(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => setIsEditing(true)}>
            <Text style={[styles.buttonText, { color: theme.background }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,  
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    borderRadius: 10,  
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
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
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,  
  },
  label: {
    fontSize: 16,
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
  multilineInput: {
    height: 100,
    textAlignVertical: 'top', 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 10,  
  },
  button: {
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

export default UserProfileScreen;