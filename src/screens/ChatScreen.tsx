import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Image, Linking, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import type { StackScreenProps } from '@react-navigation/stack';
// @ts-ignore
import type { RootStackParamList } from '../navigation/types';
// @ts-ignore
import DocumentPicker from 'react-native-document-picker';
// @ts-ignore
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';

type User = {
  id: number;
  first_name: string;
  last_name: string;
};

type Message = {
  id: number;
  sender: User;
  content: string;
  created_at: string;
  image?: string;
  file?: string;
};

type Dietitian = {
  id: number;
  user: User;
};

type Room = {
  id: number;
  dietitian: Dietitian;
};

type Props = StackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dietitians, setDietitians] = useState<Dietitian[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserId((res.data as any).id);
      console.log('Logged in userId:', (res.data as any).id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/chat/rooms/${roomId}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data as Message[]);
    })();
  }, [roomId]);

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = `ws://${BASE_URL.replace('http://', '').replace('https://', '')}/ws/chat/${roomId}/`;
      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('WebSocket connection opened successfully');
      };
      
      ws.current.onerror = (e) => {
        console.log('WebSocket ERROR:', e);
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.current.onmessage = (e) => {
        console.log('WebSocket message received:', e.data);
        const data = JSON.parse(e.data);
        if (data.type === 'chat_message') {
          fetchMessages();
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...');
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !selectedFile && !selectedImage) return;
    try {
      const token = await AsyncStorage.getItem('access_token');
      const formData = new FormData();
      if (input.trim()) formData.append('content', input);
      formData.append('chat_room', String(roomId));
      if (selectedFile) {
        formData.append('file', {
          uri: selectedFile.uri,
          type: selectedFile.type || 'application/octet-stream',
          name: selectedFile.name || 'file',
        } as any);
      }
      if (selectedImage) {
        formData.append('image', {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || 'photo.jpg',
        } as any);
      }
      
      console.log('Sending message...');
      await axios.post(
        `${BASE_URL}/api/chat/rooms/${roomId}/messages/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );
      console.log('Message sent successfully');
      
      setInput('');
      setSelectedFile(null);
      setSelectedImage(null);
      
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMine = Number(item.sender.id) === Number(userId);
    return (
      <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.otherMessageRow]}>
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMine ? { color: '#fff' } : { color: '#222' }]}>{item.content}</Text>
          <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          {item.image && (
            <Image source={{ uri: item.image }} style={{ width: 150, height: 150, borderRadius: 10 }} />
          )}
          {item.file && (
            <TouchableOpacity onPress={() => item.file ? Linking.openURL(item.file) : null}>
              <Text style={{ color: 'blue' }}>Download file</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const fetchMessages = async () => {
    const token = await AsyncStorage.getItem('access_token');
    const res = await axios.get(`${BASE_URL}/api/chat/rooms/${roomId}/messages/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages(res.data as Message[]);
  };

  const createRoomAndOpen = async (dietitianId: number) => {
    const token = await AsyncStorage.getItem('access_token');
    const res = await axios.post(`${BASE_URL}/api/chat/rooms/`, { dietitian_id: dietitianId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    navigation.navigate('ChatScreen', { roomId: res.data.id });
  };

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      const resRooms = await axios.get(`${BASE_URL}/api/chat/rooms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms((resRooms.data as any));

      const resDietitians = await axios.get(`${BASE_URL}/api/match/matchings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDietitians((resDietitians.data as any).map((m: any) => m.dietitian));
    })();
  }, []);

  const openChat = async (dietitianId: number) => {
    const token = await AsyncStorage.getItem('access_token');
    const existingRoom = rooms.find((r) => r.dietitian.id === dietitianId);
    if (existingRoom) {
      navigation.navigate('ChatScreen', { roomId: existingRoom.id });
    } else {
      const res = await axios.post(`${BASE_URL}/api/chat/rooms/`, { dietitian_id: dietitianId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigation.navigate('ChatScreen', { roomId: res.data.id });
    }
  };

  const pickAndSendFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle();
      setSelectedFile(res);
      setSelectedImage(null);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) return;
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const pickAndSendImage = async () => {
    launchImageLibrary({ mediaType: 'photo' }, (response: ImagePickerResponse) => {
      if (response.didCancel || !response.assets) return;
      const asset = response.assets[0];
      setSelectedImage(asset);
      setSelectedFile(null);
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {userId !== null && (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={pickAndSendImage}>
          <Ionicons name="image" size={24} color="#2E7D32" />
        </TouchableOpacity>
        <TouchableOpacity onPress={pickAndSendFile}>
          <Ionicons name="attach" size={24} color="#2E7D32" />
        </TouchableOpacity>
        {selectedImage && (
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Image source={{ uri: selectedImage.uri }} style={{ width: 120, height: 120, borderRadius: 10 }} />
            <TouchableOpacity onPress={() => setSelectedImage(null)}><Text style={{ color: 'red' }}>Remove image</Text></TouchableOpacity>
          </View>
        )}
        {selectedFile && (
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text>{selectedFile.name || 'Selected file'}</Text>
            <TouchableOpacity onPress={() => setSelectedFile(null)}><Text style={{ color: 'red' }}>Remove file</Text></TouchableOpacity>
          </View>
        )}
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={!input.trim() && !selectedFile && !selectedImage}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  myMessageRow: { justifyContent: 'flex-end', alignItems: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  myBubble: {
    backgroundColor: '#2E7D32',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 5,
    marginBottom: 30
  },
  otherBubble: {
    backgroundColor: '#F1F1F1',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 5,
  },
  messageText: { color: '#222', fontSize: 16 },
  messageTime: { color: '#888', fontSize: 11, alignSelf: 'flex-end', marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingBottom: 10
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom:20
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 25,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom:20

  },
});

export default ChatScreen;