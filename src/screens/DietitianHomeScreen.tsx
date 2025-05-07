import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Menu from '../components/DietitianMenu';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DietitianHomeScreen'>;
};

const DietitianHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [dietitianProfile, setDietitianProfile] = useState<any>(null);
  const [initials, setInitials] = useState<string>('');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const response = await axios.get(`${BASE_URL}/api/users/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(response.data);
        setInitials((response.data.first_name[0] || '') + (response.data.last_name[0] || ''));

        const profileResponse = await axios.get(`${BASE_URL}/api/dietitians/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDietitianProfile(profileResponse.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        await axios.post(
          `${BASE_URL}/api/auth/logout/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_type');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Keelo Dietitian</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={{ marginRight: 10 }}>
            <Ionicons name="mail-outline" size={22} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={styles.profileCircle}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchBoxWrapper}>
        <Ionicons name="search" size={18} color="#888" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchBox}
          placeholder="Danışan ara..."
          placeholderTextColor="#888"
        />
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Main Content */}
        <Text style={styles.sectionTitle}>Clients</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.clientCard}>
              <Image
                source={{ uri: 'https://randomuser.me/api/portraits/men/' + (30 + item) + '.jpg' }}
                style={styles.clientAvatar}
              />
              <Text style={styles.clientName}>Client {item}</Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.card}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.cardImage}
          />
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>Yeni Randevu Oluştur</Text>
            <Text style={styles.cardDesc}>Danışanların için hızlıca yeni randevu ekle.</Text>
            <Ionicons name="chevron-forward" size={22} color="#fff" style={styles.cardArrow} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardSmall}>
          <Ionicons name="stats-chart-outline" size={32} color="#1976d2" style={{ marginRight: 12 }} />
          <View style={styles.cardSmallTextWrapper}>
            <Text style={styles.cardSmallTitle}>İstatistikler</Text>
            <Text style={styles.cardSmallDesc}>Tüm danışan ve görüşme istatistiklerini görüntüle.</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBarItem}>
          <Ionicons name="home" size={24} color="#222" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem}>
          <Ionicons name="calendar-outline" size={24} color="#bbb" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem}>
          <Ionicons name="stats-chart-outline" size={24} color="#bbb" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={toggleMenu}>
          <Ionicons name="menu-outline" size={24} color="#bbb" />
        </TouchableOpacity>
      </View>
      {/* Menu */}
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onLogout={handleLogout} navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#222',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontWeight: 'bold',
    color: '#222',
  },
  searchBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    height: 40,
  },
  searchBox: {
    flex: 1,
    height: 40,
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 8,
    fontSize: 15,
    color: '#222',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 8,
  },
  clientCard: {
    alignItems: 'center',
    marginHorizontal: 10,
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    padding: 10,
    width: 90,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
  },
  card: {
    margin: 20,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#222',
    marginBottom: 16,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardTextWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 8,
  },
  cardArrow: {
    position: 'absolute',
    right: 18,
    bottom: 18,
  },
  cardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 10,
  },
  cardSmallTextWrapper: {
    flex: 1,
  },
  cardSmallTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  cardSmallDesc: {
    color: '#666',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DietitianHomeScreen;