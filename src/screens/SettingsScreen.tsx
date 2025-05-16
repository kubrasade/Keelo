import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, SafeAreaView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SettingsScreen'>;
};

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark, toggleTheme, theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_type');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.primary }]}>Settings</Text>
      
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('UserProfileScreen')}>
          <Ionicons name="person-outline" size={22} color={theme.primary} />
          <Text style={[styles.rowText, { color: theme.text }]}>Profile Information</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="lock-closed-outline" size={22} color={theme.primary} />
          <Text style={[styles.rowText, { color: theme.text }]}>Change Password</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Application</Text>
        <View style={[styles.row, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
          <Ionicons name="moon-outline" size={22} color={theme.primary} />
          <Text style={[styles.rowText, { color: theme.text }]}>Dark Theme</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? theme.primary : '#ccc'}
            trackColor={{ true: '#A5D6A7', false: '#eee' }}
          />
        </View>

        <View style={[styles.row, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
          <Ionicons name="notifications-outline" size={22} color={theme.primary} />
          <Text style={[styles.rowText, { color: theme.text }]}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            thumbColor={notificationsEnabled ? theme.primary : '#ccc'}
            trackColor={{ true: '#A5D6A7', false: '#eee' }}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: handleLogout }
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#E53935" />
          <Text style={[styles.rowText, { color: '#E53935' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 24, paddingHorizontal: 16, borderRadius: 12, paddingVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  rowText: { fontSize: 16, marginLeft: 14, flex: 1 },
  addBtn: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default SettingsScreen;