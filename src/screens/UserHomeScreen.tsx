import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Menu from '../components/UserMenu';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UserHomeScreen'>;
};

type ExploreCardProps = {
  image: any;
  title: string;
  desc: string;
  onPress: () => void;
};

const UserHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [userData, setUserData] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [initials, setInitials] = useState<string>('');
  const { theme, isDark } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); 
  };

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token not found');
      }

      const res = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.data || !res.data.id) {
        throw new Error('User information could not be retrieved');
      }

      setUserData(res.data);
      setInitials(((res.data.first_name?.[0] || '') + (res.data.last_name?.[0] || '')).toUpperCase());

      const clientProfileRes = await axios.get(`${BASE_URL}/api/clients/?user=${res.data.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (clientProfileRes.data && clientProfileRes.data.length > 0) {
        setClientProfile(clientProfileRes.data[0]);
      }
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const retryLoading = () => {
    fetchUserData();
  };

  const safeSearchText = searchText || '';

  const handleSearch = () => {
    const q = searchText.trim().toLowerCase();
    if (!q) return;
    if (q.includes('dietitian')) {
      navigation.navigate('FindDietitianScreen', { query: safeSearchText });
    } else if (q.includes('exercise') || q.includes('progress')) {
      navigation.navigate('ProgressScreen');
    } else if (q.includes('diet') || q.includes('plan')) {
      navigation.navigate('DietPlanScreen');
    } else if (q.includes('health') || q.includes('health')) {
      navigation.navigate('HealthMetricsScreen');
    } else {
      navigation.navigate('FindDietitianScreen', { query: safeSearchText });
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

  const ExploreCard: React.FC<ExploreCardProps> = ({ image, title, desc, onPress }) => (
  <View style={styles.productCard}>
    <Image source={image} style={styles.productImage} />
    <Text style={styles.productTitle}>{title}</Text>
    <Text style={styles.productDesc}>{desc}</Text>
    <TouchableOpacity style={styles.productButton} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.productButtonText}>View</Text>
    </TouchableOpacity>
  </View>
);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, padding: 20 }}>
        <Text style={{ color: theme.text, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }} onPress={retryLoading}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, padding: 20 }}>
        <Text style={{ color: theme.text, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>Failed to retrieve user data. Please try logging in again.</Text>
        <TouchableOpacity style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }} onPress={() => navigation.replace('Login')}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Keelo</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={{ marginRight: 10 }} onPress={() => navigation.navigate('ChatListScreen')}>
            <Ionicons name="mail-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={[styles.profileCircle, { backgroundColor: theme.card }]}>
            <Text style={[styles.profileInitials, { color: theme.text }]}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.searchBoxWrapper}>
          <Ionicons name="search" size={18} color={theme.text} style={{ marginLeft: 10 }} />
          <TextInput
            style={[styles.searchBox, { color: theme.text }]}
            placeholder="What are you looking for?"
            placeholderTextColor={isDark ? '#bbb' : '#888'}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
        </View>
        <ExploreCard
          image={require('../../assets/images/home.png')}
          title="Create a Diet Plan"
          desc="Create and follow your personal diet plan."
          onPress={() => navigation.navigate('DietPlanScreen')}
        />
        <ExploreCard
          image={require('../../assets/images/home2.png')}
          title="Create an Exercise Plan"
          desc="Easily create your weekly workout plan."
          onPress={() => navigation.navigate('ProgressScreen')}
        />
        <ExploreCard
          image={require('../../assets/images/dietitian.png')}
          title="Choose a Dietitian"
          desc="Contact expert dietitians."
          onPress={() => navigation.navigate('FindDietitianScreen', { query: '' })}        />
        <ExploreCard
          image={require('../../assets/images/recipes.png')}
          title="See Recipes"
          desc="Master the recipes in detail."
          onPress={() => navigation.navigate('RecipesScreen')}
        />
        <ExploreCard
          image={require('../../assets/images/exercise.png')}
          title="See Progress"
          desc="Master the exercise details."
          onPress={() => navigation.navigate('WorkoutsScreen')}
        />
      </ScrollView>
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: isDark ? '#222' : '#eee' }]}>
        <TouchableOpacity style={styles.tabBarItem}>
          <Ionicons name="home" size={24} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => navigation.navigate('ProgressScreen')}>
          <Ionicons name="barbell-outline" size={24} color={isDark ? '#bbb' : '#888'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => navigation.navigate('HealthMetricsScreen')}>
          <Ionicons name="heart-outline" size={24} color={isDark ? '#bbb' : '#888'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={toggleMenu}>
          <Ionicons name="menu-outline" size={24} color={isDark ? '#bbb' : '#888'} />
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#00',
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
  exploreHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
    marginLeft: 20,
    marginBottom: 8,
    color: '#222',
  },
  exploreCard: {
    width: '90%',
    aspectRatio: 1.1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 32,
    marginTop: 8,
    backgroundColor: '#222',
    justifyContent: 'flex-end',
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  exploreImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  exploreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  exploreTextWrapper: {
    position: 'absolute',
    left: 20,
    bottom: 32,
    right: 60,
  },
  exploreTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  exploreDesc: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.92,
    fontWeight: '500',
  },
  exploreArrow: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 2,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 50,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginVertical: 18,
    alignItems: 'center',
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  productImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 18,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  productDesc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 18,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  productButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 36,
    marginTop: 4,
  },
  productButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default UserHomeScreen;