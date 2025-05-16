import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type User = {
  id: number;
  first_name: string;
  last_name: string;
};

type Client = {
  id: number;
  user: User;
  profile_picture?: string;
};

type Room = {
  id: number;
  client: Client;
  last_message?: { content: string };
};

type DietitianProfile = {
  id: number;
  user: User;
};

const DietitianChatListScreen: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoomId, setCreatingRoomId] = useState<number | null>(null);
  const [dietitianId, setDietitianId] = useState<number | null>(null);
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      const resUser = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = resUser.data.id;
      const resDietitians = await axios.get(`${BASE_URL}/api/dietitians/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const myDietitianProfile = resDietitians.data.find((d: DietitianProfile) => d.user.id === userId);
      if (!myDietitianProfile) {
        Alert.alert('Error', 'Dietitian profile not found!');
        setLoading(false);
        return;
      }
      setDietitianId(myDietitianProfile.id);

      const resRooms = await axios.get(`${BASE_URL}/api/chat/rooms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(resRooms.data);

      const resClients = await axios.get(`${BASE_URL}/api/match/matchings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allClients = resClients.data.map((m: any) => m.client);
      const uniqueClients = allClients.filter(
        (client: any, index: number, self: any[]) =>
          index === self.findIndex((c) => c.id === client.id)
      );
      setClients(uniqueClients);
      setLoading(false);
    })();
  }, []);

  const openChat = async (clientId: number) => {
    if (!dietitianId) {
      Alert.alert('Error', 'Failed to get dietitian ID!');
      return;
    }
    setCreatingRoomId(clientId);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const existingRoom = rooms.find((r) => r.client.id === clientId);
      
      if (existingRoom) {
        navigation.navigate('DietitianChatScreen', { roomId: existingRoom.id });
        return;
      }

      const resRooms = await axios.get(`${BASE_URL}/api/chat/rooms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedRooms = resRooms.data;
      const roomExists = updatedRooms.find((r: any) => r.client.id === clientId);
      
      if (roomExists) {
        navigation.navigate('DietitianChatScreen', { roomId: roomExists.id });
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/api/chat/rooms/`,
        { client_id: Number(clientId), dietitian_id: dietitianId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.navigate('DietitianChatScreen', { roomId: res.data.id });
    } catch (error: any) {
      Alert.alert('Error', 'Room creation failed: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    } finally {
      setCreatingRoomId(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>My Chats</Text>
      <FlatList
        data={clients}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => {
          const room = rooms.find(r => r.client.id === item.id);
          const isLoading = creatingRoomId === item.id;
          return (
            <TouchableOpacity style={styles.card} onPress={() => openChat(item.id)} disabled={isLoading}>
              <Image
                source={item.profile_picture ? { uri: item.profile_picture } : require('../../assets/images/login.png')}
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.user.first_name} {item.user.last_name}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {room?.last_message?.content || 'No messages yet.'}
                </Text>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No clients found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  name: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  lastMessage: { color: '#888', fontSize: 13, marginTop: 2 },
});

export default DietitianChatListScreen;