import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { Screen } from 'react-native-screens';

type MenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void; 
  navigation: any; 
};

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onLogout, navigation }) => {
  if (!isOpen) return null;

  const { theme, isDark } = useTheme();

  const menuItems = [
    { title: 'Profile', screen: 'UserProfileScreen' },
    { title: 'Health Metrics', screen: 'HealthMetricsScreen'},
    { title: 'Find Dietitian', screen: 'FindDietitianScreen' },
    { title: 'Appointment', screen: 'AppointmentScreen'},
    { title: 'Review', screen: 'ReviewScreen'},
    { title: 'Diet Plan', screen: 'DietPlanScreen' },
    { title: 'Progress', screen: 'ProgressScreen' },
    { title: 'Settings', screen: 'SettingsScreen' },
  ];

  const handleNavigation = (screen: string) => {
    onClose();
    navigation.navigate(screen); 
  };

  return (
    <Animated.View 
      style={[styles.menuContainer, { backgroundColor: theme.card, transform: [{ translateX: isOpen ? 0 : -300 }] }]}>
      <View style={[styles.menuContent, { backgroundColor: theme.card }]}>
        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { borderBottomColor: isDark ? '#333' : '#ddd' }]}
              onPress={() => handleNavigation(item.screen)}>
              <Ionicons name="chevron-forward" size={20} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.primary }]} onPress={onLogout}> 
          <Text style={[styles.logoutText, { color: theme.background }]}>Logout</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close-circle-outline" size={30} color={theme.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#fff', 
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'flex-start', 
    height: '100%',
    width: '80%',
    paddingTop: 50,
  },
  menuContent: {
    backgroundColor: '#fff',
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    height: '100%',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 18,
    color: '#333',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 30,
    right: '1%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  logoutText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1001,
  },
});

export default Menu;