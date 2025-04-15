import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const SplashScreen = ({ navigation }: any) => {
  const letterAnim1 = useRef(new Animated.Value(-100)).current;
  const letterAnim2 = useRef(new Animated.Value(-100)).current;
  const letterAnim3 = useRef(new Animated.Value(-100)).current;
  const letterAnim4 = useRef(new Animated.Value(-100)).current;
  const letterAnim5 = useRef(new Animated.Value(-100)).current;
  const letterAnim6 = useRef(new Animated.Value(-100)).current;

  const startAnimation = () => {
    Animated.sequence([
      Animated.stagger(100, [
        Animated.timing(letterAnim1, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(letterAnim2, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(letterAnim3, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(letterAnim4, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(letterAnim5, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(letterAnim6, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  useEffect(() => {
    startAnimation();
    setTimeout(() => {
        navigation.navigate('Onboarding');
        }, 3000); 
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={styles.letterContainer}>
        <Animated.Text
          style={[styles.letter, { transform: [{ translateY: letterAnim1 }] }]}>
          K
        </Animated.Text>
        <Animated.Text
          style={[styles.letter, { transform: [{ translateY: letterAnim2 }] }]}>
          E
        </Animated.Text>
        <Animated.Text
          style={[styles.letter, { transform: [{ translateY: letterAnim3 }] }]}>
          E
        </Animated.Text>
        <Animated.Text
          style={[styles.letter, { transform: [{ translateY: letterAnim4 }] }]}>
          L
        </Animated.Text>
        <Animated.Text
          style={[styles.letter, { transform: [{ translateY: letterAnim5 }] }]}>
          O
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d3d3d3', 
  },
  letterContainer: {
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontSize: 60, 
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 5, 
    fontFamily: 'Poppins-Regular',
  },
  footerText: {
    fontSize: 18, 
    color: 'white',
    marginTop: 20,
    fontFamily: 'Poppins-Regular', 
  },
});

export default SplashScreen;