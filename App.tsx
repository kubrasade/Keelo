import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import SplashScreen from './src/screens/SplashScreen'; 
import OnboardingScreen from './src/screens/OnboardingScreen'; 
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DietitianRegisterScreen from './src/screens/DietitianRegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import DietitianHomeScreen from './src/screens/DietitianHomeScreen';
import UserHomeScreen from './src/screens/UserHomeScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import DietitianProfileScreen from './src/screens/DietitianProfileScreen';
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [user_type, setUserType] = useState<null | string>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem('user_type');
        const storedOnboardingStatus = await AsyncStorage.getItem('onboarding_complete');
        
        console.log("Stored User Type:", storedUserType);
        console.log("Onboarding Completed:", storedOnboardingStatus);
        
        setUserType(storedUserType);
        setIsOnboardingComplete(storedOnboardingStatus === 'true');
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    getUserData();
  }, []);

  const linking = {
    prefixes: ['keelo://'],
    config: {
      screens: {
        ResetPasswordConfirm: {
          path: 'reset-password/:uidb64/:token',
          parse: {
            uidb64: (uidb64: string) => uidb64,
            token: (token: string) => token,
          },
        },
      },
    },
  };

  useEffect(() => {
    const testDeepLink = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        console.log('Initial URL:', url);
      }
    };
    testDeepLink();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('URL event:', url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName={isOnboardingComplete ? 'Login' : 'Splash'}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="DietitianHomeScreen" component={DietitianHomeScreen} />
        <Stack.Screen name="UserHomeScreen" component={UserHomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="DietitianRegister" component={DietitianRegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPasswordConfirm" component={ResetPasswordScreen} />
        <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
        <Stack.Screen name= "DietitianProfileScreen" component={DietitianProfileScreen} />
       </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;