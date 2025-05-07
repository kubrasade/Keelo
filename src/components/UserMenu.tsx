import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type MenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void; 
  navigation: any; 
};

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onLogout, navigation }) => {
  if (!isOpen) return null;

  const menuItems = [
    { title: 'Profile', screen: 'UserProfileScreen' },
    { title: 'Diet Plan', screen: 'DietPlan' },
    { title: 'Progress', screen: 'Progress' },
    { title: 'Find Dietitian', screen: 'FindDietitian' },
    { title: 'Settings', screen: 'Settings' },
  ];

  const handleNavigation = (screen: string) => {
    onClose();
    navigation.navigate(screen); 
  };

  return (
    <Animated.View 
      style={[styles.menuContainer, { transform: [{ translateX: isOpen ? 0 : -300 }] }]}>
      <View style={styles.menuContent}>
        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.screen)}>
              <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}> 
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close-circle-outline" size={30} color="#fff" />
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