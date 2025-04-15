import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DietitianRegister'>;

const DietitianRegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    first_name: '',
    last_name: '',
    title: '',
    licence_number: '',
    experience_years: '',
    gender: '',
    status: '1',
    location: '', 
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleRegister = async () => {
    try {
      if (!form.username || !form.email || !form.password || !form.password_confirmation || !form.gender || !form.location) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }

      const response = await axios.post(`${BASE_URL}/authub/dietitian/register/`, {
        ...form,
        experience_years: parseInt(form.experience_years),
        gender: parseInt(form.gender),
        status: parseInt(form.status),
        expertise_fields: [1],
      });

      Alert.alert('Success', 'Dietitian registration completed.');
      navigation.navigate('Login');
    } catch (err: any) {
      const errorMessages = err.response?.data || err.message;
      console.error('Error during registration:', errorMessages);

      if (err.response?.data) {
        setErrors(err.response.data); 
      } else {
        Alert.alert('Error', 'There was an issue with registration.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dietitian Registration</Text>

      {['username', 'email', 'first_name', 'last_name', 'title', 'licence_number', 'location'].map((field) => (
        <View key={field}>
          <TextInput
            placeholder={field.replace('_', ' ')}
            style={styles.input}
            onChangeText={(text) => handleChange(field, text)}
            value={form[field as keyof typeof form]}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            keyboardType="default"
            spellCheck={false}
          />
          {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
        </View>
      ))}

      <TextInput
        placeholder="Experience Years"
        keyboardType="numeric"
        style={styles.input}
        onChangeText={(text) => handleChange('experience_years', text)}
        value={form.experience_years}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {errors['experience_years'] && <Text style={styles.errorText}>{errors['experience_years']}</Text>}

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={(text) => handleChange('password', text)}
        value={form.password}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {errors['password'] && <Text style={styles.errorText}>{errors['password']}</Text>}

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        style={styles.input}
        onChangeText={(text) => handleChange('password_confirmation', text)}
        value={form.password_confirmation}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {errors['password_confirmation'] && <Text style={styles.errorText}>{errors['password_confirmation']}</Text>}

      <TextInput
        placeholder="Gender"
        style={styles.input}
        onChangeText={(itemValue) => handleChange('gender', itemValue)}
        value={form.gender}
      />
      {errors['gender'] && <Text style={styles.errorText}>{errors['gender']}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign up as Dietitian</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already registered? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#d3d3d3',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2E7D32',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  link: {
    color: '#2E5E4E',
    textAlign: 'center',
    marginTop: 18,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  label: {
    marginVertical: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DietitianRegisterScreen;