import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Menu from '../components/DietitianMenu';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Calendar } from 'react-native-calendars';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DietitianHomeScreen'>;
};

const DietitianHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [dietitianProfile, setDietitianProfile] = useState<any>(null);
  const [initials, setInitials] = useState<string>('');
  const { theme, isDark } = useTheme();
  const [clients, setClients] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [appointmentsForDay, setAppointmentsForDay] = useState<any[]>([]);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    fetchUserData();
    fetchClients();
    fetchAppointments();
    fetchReviewAndMatchCounts();
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

  const fetchClients = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/match/matchings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const clientList = res.data.map((match: any) => match.client);
      const uniqueClients = clientList.filter(
        (client: any, index: number, self: any[]) =>
          index === self.findIndex((c) => c.id === client.id)
      );
      setClients(uniqueClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/appointment/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data);
      const marks: any = {};
      res.data.forEach((appt: any) => {
        const date = appt.date?.split('T')[0];
        if (date) {
          marks[date] = {
            marked: true,
            dotColor: '#43e97b',
            selected: false,
          };
        }
      });
      setMarkedDates(marks);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const getCount = (data: any) => {
    if (Array.isArray(data)) return data.length;
    if (data && Array.isArray(data.results)) return data.results.length;
    return 0;
  };

  const fetchReviewAndMatchCounts = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const matchRes = await axios.get(`${BASE_URL}/api/match/matchings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatchCount(getCount(matchRes.data));
      const reviewRes = await axios.get(`${BASE_URL}/api/match/reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviewCount(getCount(reviewRes.data));
    } catch (error) {
      setMatchCount(0);
      setReviewCount(0);
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

  const filteredClients = clients.filter(client => {
    const fullName = `${client.user.first_name} ${client.user.last_name}`.toLowerCase();
    return fullName.includes(searchText.toLowerCase());
  });

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    const appts = appointments.filter((appt: any) => appt.date?.startsWith(day.dateString));
    setAppointmentsForDay(appts);
  };

  const ExploreCard = ({ image, title, desc, buttonText, onPress }: { image: any, title: string, desc: string, buttonText: string, onPress: () => void }) => (
    <View style={styles.productCard}>
      <Image source={image} style={styles.productImage} />
      <Text style={styles.productTitle}>{title}</Text>
      <Text style={styles.productDesc}>{desc}</Text>
      <TouchableOpacity style={styles.productButton} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.productButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.headerRow, { backgroundColor: theme.card }]}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Keelo Dietitian</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={{ marginRight: 10 }} onPress={() => navigation.navigate('DietitianChatListScreen')}>
            <Ionicons name="mail-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={[styles.profileCircle, { backgroundColor: theme.card }]}>
            <Text style={[styles.profileInitials, { color: theme.text }]}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchBoxWrapper, { backgroundColor: isDark ? '#23262F' : '#f3f3f3' }]}>
        <Ionicons name="search" size={18} color={theme.text} style={{ marginLeft: 10 }} />
        <TextInput
          style={[styles.searchBox, { color: theme.text }]}
          placeholder="Search by client name..."
          placeholderTextColor={isDark ? '#bbb' : '#888'}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Clients</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {filteredClients.map((client, idx) => (
            <View key={client.id || idx} style={[styles.clientCard, { backgroundColor: theme.card }]}>
              <Image
                source={
                  client.profile_picture
                    ? { uri: client.profile_picture }
                    : require('../../assets/images/login.png')
                }
                style={styles.clientAvatar}
              />
              <Text style={[styles.clientName, { color: theme.text }]}>
                {client.user.first_name} {client.user.last_name}
              </Text>
            </View>
          ))}
        </ScrollView>

        <ExploreCard
          image={require('../../assets/images/appointment.png')}
          title="Create Appointment"
          desc="Quickly add a new appointment for your clients."
          buttonText="Create"
          onPress={() => navigation.navigate('CreateAppointmentScreen')}
        />
        <ExploreCard
          image={require('../../assets/images/image.png')}
          title="Reviews"
          desc="See all feedback and reviews from your clients."
          buttonText="View"
          onPress={() => navigation.navigate('DietitianReviewScreen')}
        />
        <ExploreCard
          image={require('../../assets/images/match.png')}
          title="Match Requests"
          desc="Manage and respond to new client match requests."
          buttonText="View"
          onPress={() => navigation.navigate('MatchScreen')}
        />
      </ScrollView>

      <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity style={styles.tabBarItem}>
          <Ionicons name="home" size={24} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setCalendarModalVisible(true)}>
          <Ionicons name="calendar-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setStatisticsModalVisible(true)}>
          <Ionicons name="stats-chart-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={toggleMenu}>
          <Ionicons name="menu-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onLogout={handleLogout} navigation={navigation} />

      {calendarModalVisible && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 18, width: '92%', maxHeight: '80%' }}>
            <TouchableOpacity onPress={() => setCalendarModalVisible(false)} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
              <Ionicons name="close" size={28} color={theme.primary} />
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.primary, marginBottom: 10, textAlign: 'center' }}>Appointments Calendar</Text>
            <Calendar
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: theme.card,
                calendarBackground: theme.card,
                textSectionTitleColor: theme.text,
                dayTextColor: theme.text,
                todayTextColor: theme.primary,
                selectedDayBackgroundColor: theme.primary,
                selectedDayTextColor: '#fff',
                dotColor: '#43e97b',
                arrowColor: theme.primary,
              }}
              style={{ borderRadius: 12, marginBottom: 12 }}
            />
            {selectedDate && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15, color: theme.primary, marginBottom: 6 }}>Appointments for {selectedDate}</Text>
                {appointmentsForDay.length === 0 ? (
                  <Text style={{ color: theme.text }}>No appointments for this day.</Text>
                ) : (
                  appointmentsForDay.map((appt, idx) => {
                    let clientName = '';
                    if (appt.client && appt.client.user) {
                      clientName = `${appt.client.user.first_name} ${appt.client.user.last_name}`;
                    } else if (appt.client_full_name) {
                      clientName = appt.client_full_name;
                    } else if (typeof appt.client === 'number') {
                      const found = clients.find(c => c.id === appt.client);
                      if (found) {
                        clientName = `${found.user.first_name} ${found.user.last_name}`;
                      } else {
                        clientName = `Client #${appt.client}`;
                      }
                    } else {
                      clientName = 'Unknown Client';
                    }
                    return (
                      <View key={appt.id || idx} style={{ marginBottom: 10, padding: 10, backgroundColor: '#f3f3f3', borderRadius: 10 }}>
                        <Text style={{ color: '#222', fontWeight: 'bold' }}>{appt.title || 'Appointment'}</Text>
                        <Text style={{ color: '#666' }}>{appt.date}</Text>
                        <Text style={{ color: '#666' }}>Client: {clientName}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {statisticsModalVisible && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 28, width: '85%', maxWidth: 400, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setStatisticsModalVisible(false)} style={{ alignSelf: 'flex-end', position: 'absolute', right: 12, top: 12 }}>
              <Ionicons name="close" size={28} color={theme.primary} />
            </TouchableOpacity>
            <Ionicons name="stats-chart-outline" size={40} color={theme.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 20, color: theme.primary, marginBottom: 18 }}>Statistics</Text>
            <Text style={{ fontSize: 16, color: theme.text, marginBottom: 10 }}>Total Match Requests: <Text style={{ fontWeight: 'bold', color: theme.primary }}>{matchCount}</Text></Text>
            <Text style={{ fontSize: 16, color: theme.text }}>Total Reviews: <Text style={{ fontWeight: 'bold', color: theme.primary }}>{reviewCount}</Text></Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 18,
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
    marginTop: 20,
    marginBottom: 20,
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
    backgroundColor: '#fff',
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
    textAlign: 'center', 
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

export default DietitianHomeScreen;