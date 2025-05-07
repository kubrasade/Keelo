import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://127.0.0.1:8000'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Handle logout or token refresh here
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login/', { email, password });
  await AsyncStorage.setItem('token', response.data.token);
  return response.data;
};

export const logout = async () => {
  await AsyncStorage.removeItem('token');
  await api.post('/auth/logout/');
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/user/');
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.patch('/auth/user/', data);
  return response.data;
};

export default api;