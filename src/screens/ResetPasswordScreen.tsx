import React, { useEffect, useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View, Text, StyleSheet, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPasswordConfirm'>;

const ResetPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute();
  const [uidb64, setUidb64] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Handle deep linking
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      if (url.startsWith('keelo://reset-password/')) {
        const parts = url.split('/');
        if (parts.length >= 5) {
          setUidb64(parts[3]);
          setToken(parts[4]);
        }
      }
    };

    // Add event listener for deep linking
    Linking.addEventListener('url', handleDeepLink);

    // Check if we have route params
    if (route.params) {
      const { uidb64: routeUidb64, token: routeToken } = route.params as { uidb64: string, token: string };
      setUidb64(routeUidb64);
      setToken(routeToken);
    }

    // Check initial URL if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith('keelo://reset-password/')) {
        const parts = url.split('/');
        if (parts.length >= 5) {
          setUidb64(parts[3]);
          setToken(parts[4]);
        }
      }
    });

    return () => {
      Linking.removeAllListeners('url');
    };
  }, [route.params]);

  useEffect(() => {
    if (!uidb64 || !token) {
      Alert.alert('Error', 'Invalid link. Please check your email and try again.');
      navigation.goBack();
    }
  }, [uidb64, token]);

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
  
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/password-reset/${uidb64}/${token}/`, {
        new_password: newPassword,
        new_password2: confirmPassword,
      });
      Alert.alert('Success', 'Your password has been reset successfully!');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'Password reset failed. Invalid link or token.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        placeholder="New Password"
        style={styles.input}
        secureTextEntry
        onChangeText={setNewPassword}
        value={newPassword}
      />
      <TextInput
        placeholder="Confirm New Password"
        style={styles.input}
        secureTextEntry
        onChangeText={setConfirmPassword}
        value={confirmPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d3d3d3',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  input: {
    width: '80%',
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
    width: '80%',
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
});

export default ResetPasswordScreen;