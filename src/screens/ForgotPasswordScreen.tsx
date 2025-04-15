// ✅ ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { BASE_URL } from '../config/api';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');

  const handleReset = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/authub/forgot-password/`, {

        username,
      });
      Alert.alert('Success', 'Password reset link has been sent!');
    } catch (error) {
      Alert.alert('Error', 'Kullanıcı bulunamadı veya sunucu hatası.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your username to reset your password</Text>

      <TextInput
        placeholder="Username"
        placeholderTextColor="#999"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    marginBottom: 24,
  },
  input: {
    width: width * 0.85,
    height: 48,
    borderWidth: 1,
    borderColor: '#C5D2C2',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  button: {
    width: width * 0.85,
    height: 48,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    color: '#2E5E4E',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;