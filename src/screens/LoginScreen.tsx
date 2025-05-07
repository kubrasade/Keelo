import React, { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack'; 
import { RootStackParamList } from '../navigation/types'; 

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login/`, {
        email,
        password,
      });
      const { user_type, access } = response.data;
  
      if (user_type === 1) {  
        navigation.replace('DietitianHomeScreen');
      } else if (user_type === 2) { 
        navigation.replace('UserHomeScreen');
      } 
      await AsyncStorage.setItem('user_type', String(user_type));
      await AsyncStorage.setItem('access_token', access);
      
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password');
      console.error('Login failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.keeloText}>Keelo</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <View style={styles.forgotPasswordContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
          
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register here</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  keeloText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#000',
    marginBottom: 30,
  },
  input: {
    width: '90%',
    height: 50,
    backgroundColor: '#d3d3d3',
    marginBottom: 20,
    paddingLeft: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '70%',
    paddingVertical: 15,
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    color: '#000',
    fontSize: 14,
    marginVertical: 5,
    textDecorationLine: 'underline',
  },
  forgotPasswordContainer: {
    width: '90%',
    alignItems: 'flex-end', 
    marginBottom: 10,
    marginTop:2,
  },
});

export default LoginScreen;