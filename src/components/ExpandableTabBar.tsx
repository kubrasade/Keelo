import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  expanded: boolean;
  setExpanded: (val: boolean) => void;
  userType: 'user' | 'dietitian';
}

const ExpandableTabBar: React.FC<Props> = ({ expanded, setExpanded, userType }) => {
  // Animasyon için
  const animatedHeight = React.useRef(new Animated.Value(60)).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: expanded ? 160 : 60,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const commonTabs = [
    { icon: 'home', label: 'Home' },
    { icon: 'heart-outline', label: 'Favorites' },
    { icon: 'person-outline', label: 'Profile' },
  ];
  const userTabs = [
    { icon: 'fast-food-outline', label: 'Add Meal' },
    { icon: 'barbell-outline', label: 'Workout' },
    { icon: 'notifications-outline', label: 'Notifications' },
  ];
  const dietitianTabs = [
    { icon: 'people-outline', label: 'Clients' },
    { icon: 'stats-chart-outline', label: 'Stats' },
    { icon: 'chatbubble-ellipses-outline', label: 'Messages' },
  ];

  return (
    <Animated.View style={[styles.tabBar, { height: animatedHeight }]}>  
      <View style={styles.row}>
        {commonTabs.map(tab => (
          <TouchableOpacity key={tab.icon} style={styles.tabBarItem}>
            <Ionicons name={tab.icon as any} size={26} color="#222" />
            {expanded && <Text style={styles.tabLabel}>{tab.label}</Text>}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setExpanded(!expanded)}>
          <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={26} color="#2E5E4E" />
          {expanded && <Text style={styles.tabLabel}>Menu</Text>}
        </TouchableOpacity>
      </View>
      {expanded && (
        <View style={styles.expandedRow}>
          {(userType === 'user' ? userTabs : dietitianTabs).map(tab => (
            <TouchableOpacity key={tab.icon} style={styles.expandedTabItem}>
              <Ionicons name={tab.icon as any} size={22} color="#2E5E4E" />
              <Text style={styles.expandedTabLabel}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 8,
    zIndex: 10,
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#222',
    marginTop: 2,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  expandedTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  expandedTabLabel: {
    fontSize: 13,
    color: '#2E5E4E',
    marginTop: 2,
    fontWeight: '600',
  },
});

export default ExpandableTabBar; 