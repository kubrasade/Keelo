import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const slides = [
  {
    id: '1',
    image: require('../../assets/images/diyetisyen1.png'),
    title: 'Find the Right Dietitian',
    description:
      'We match you with certified dietitians that align with your health goals.',
  },
  {
    id: '2',
    image: require('../../assets/images/onboarding2.png'),
    title: 'Discover Your Plan',
    description: 'Receive personalized meal and fitness plans tailored just for you.',
  },
  {
    id: '3',
    image: require('../../assets/images/track.png'),
    title: 'Track Your Progress',
    description: 'Stay on top of your goals with expert support.',
  },
  {
    id: '4',
    image: require('../../assets/images/onboarding1.png'),
    isFinal: true,
  },
];

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    }
  };

  const handleBack = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const current = slides[index];

  if (current.isFinal) {
    return (
      <ImageBackground
        source={current.image}
        style={styles.fullscreenBg}
        resizeMode="cover"
      >
        <View style={styles.finalOverlay}>
          <Text style={styles.finalTitle}>KEELO</Text>

          <TouchableOpacity
            style={styles.whiteButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.whiteButtonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.darkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.darkButtonText}>Create Account</Text>
          </TouchableOpacity>

        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={current.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.desc}>{current.description}</Text>

      <View style={styles.linkRow}>
        <TouchableOpacity onPress={handleBack} disabled={index === 0}>
          <Text style={[styles.linkText, index === 0 && styles.disabledText]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.linkText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 100,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  image: {
    width: width * 0.8,
    height: height * 0.38,
    marginBottom: 50,
    opacity: 0.9,
    borderRadius: (height * 0.38) / 2, 
    borderWidth: 5, 
    borderColor: '#2E7D32', 
  },
  
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  desc: {
    fontSize: 15,
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 50,
  },
  linkRow: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 16,
    color: '#2E7D32',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  disabledText: {
    color: '#BDBDBD',
  },
  fullscreenBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  finalOverlay: {
    paddingBottom: 60,
    alignItems: 'center',
    width: '100%',
  },
  finalTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 30,
    padding: 1,
    backgroundColor: 'rgba(56, 56, 56, 0.5)',  
    borderRadius: 20,  
  },
  whiteButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginBottom: 15,
  },
  whiteButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  darkButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginBottom: 20,
  },
  darkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guestText: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
});