import React, { useState } from 'react';
import { BASE_URL } from '../config/api';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<'1' | '2' | null>(null); 

  const [showOptions, setShowOptions] = useState(false); 

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register/`, {
        email,
        password,
        password2: passwordConfirm,
        first_name: firstName, 
        last_name: lastName, 
        user_type: userType,  
      });

      Alert.alert('Success', 'Registration successful! You can check your e-mail and log in.');
      navigation.navigate('Login');
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      Alert.alert('Error', 'There was an issue with registration.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="First Name"
        placeholderTextColor="#999"
        style={styles.input}
        onChangeText={setFirstName}
      />

      <TextInput
        placeholder="Last Name"
        placeholderTextColor="#999"
        style={styles.input}
        onChangeText={setLastName}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        style={styles.input}
        keyboardType="email-address"
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        onChangeText={setPasswordConfirm}
      />

      <TextInput
        placeholder="Phone Number"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        style={styles.input}
        value={phone_number}
        onChangeText={setPhoneNumber}
      />

      <TouchableOpacity 
        style={styles.dropdown} 
        onPress={() => setShowOptions(!showOptions)} 
      >
        <Text style={styles.dropdownText}>
          {userType ? (userType === '1' ? 'Dietitian' : 'Client') : 'Select User Type'}
        </Text>
      </TouchableOpacity>

      {showOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            onPress={() => {
              setUserType('1');
              setShowOptions(false);
            }}
            style={styles.optionButton}
          >
            <Text style={styles.optionText}>Dietitian</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setUserType('2');
              setShowOptions(false);
            }}
            style={styles.optionButton}
          >
            <Text style={styles.optionText}>Client</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>

    </View>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
  },
  input: {
    width: '100%',
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#C5D2C2',
    borderRadius: 10,
    backgroundColor: '#d3d3d3',
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  link: {
    marginTop: 15,
    color: '#000',
  },
  selectLabel: {
    fontSize: 16,
    color: '#333',
    marginVertical: 10,
  },
  dropdown: {
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C5D2C2',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  optionsContainer: {
    width: '100%',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C5D2C2',
  },
  optionButton: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C5D2C2',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default RegisterScreen;