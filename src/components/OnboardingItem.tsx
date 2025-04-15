import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native';

const { width } = Dimensions.get('window');

type Props = {
  item: {
    title: string;
    description: string;
    image: ImageSourcePropType;
  };
};

const OnboardingItem = ({ item }: Props) => {
  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.imageWrapper}>
        <Image source={item.image} style={styles.image} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FAF3E0', 
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 250, 
    height: 250, 
    backgroundColor: '#2E5E4E', 
    borderRadius: 125, 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50, 
    overflow: 'hidden', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  image: {
    width: 300,  
    height: 300, 
    resizeMode: 'cover', 
  },
  title: {
    fontSize: 26,
    color: '#2E5E4E', 
    fontWeight: '700', 
    marginBottom: 14, 
    textAlign: 'center', 
  },
  description: {
    fontSize: 16,
    color: '#3C3C3C', 
    textAlign: 'center',
    paddingHorizontal: 20, 
  },
});

export default OnboardingItem;