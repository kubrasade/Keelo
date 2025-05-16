import React, { useEffect, useState } from 'react';
import { NavigationContainer, StackRouter } from '@react-navigation/native';
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
import DietPlanScreen from './src/screens/DietPlanScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import FindDietitianScreen from './src/screens/FindDietitianScreen';
import HealthMetricsScreen from './src/screens/HealthMetricsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';
import CreateAppointmentScreen from './src/screens/CreateAppointmenScreen';
import DietitianChatListScreen from './src/screens/DietitianChatListScreen';
import DietitianChatScreen from './src/screens/DietitianChatScreen';
import MatchScreen from './src/screens/MatchScreen';
import DietitianDietPlanScreen from './src/screens/DietitianDietPlanScreen';
import DietitianProgressScreen from './src/screens/DietitianProgressScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import WorkoutsScreen from './src/screens/WorkoutsScreen';
import DietitianReviewScreen from './src/screens/DietitianReviewScreen';
import { ThemeProvider } from './src/context/ThemeContext';
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
   <ThemeProvider>
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
          <Stack.Screen name="DietPlanScreen" component={DietPlanScreen} />
          <Stack.Screen name="ProgressScreen" component={ProgressScreen} />
          <Stack.Screen name="FindDietitianScreen" component={FindDietitianScreen} />
          <Stack.Screen name= "HealthMetricsScreen" component={HealthMetricsScreen} />
          <Stack.Screen name= "SettingsScreen" component={SettingsScreen} />
          <Stack.Screen name= "ReviewScreen" component={ReviewScreen} />
          <Stack.Screen name= "ChatListScreen" component={ChatListScreen} />
          <Stack.Screen name='ChatScreen' component={ChatScreen} />
          <Stack.Screen name= 'AppointmentScreen' component={AppointmentScreen} />
          <Stack.Screen name='CreateAppointmentScreen' component={CreateAppointmentScreen} />
          <Stack.Screen name='DietitianChatListScreen' component={DietitianChatListScreen} />
          <Stack.Screen name='DietitianChatScreen' component={DietitianChatScreen} />
          <Stack.Screen name='MatchScreen' component={MatchScreen} />
          <Stack.Screen name='DietitianDietPlanScreen' component={DietitianDietPlanScreen} />
          <Stack.Screen name='DietitianProgressScreen' component={DietitianProgressScreen} />
          <Stack.Screen name='RecipesScreen' component={RecipesScreen}/>
          <Stack.Screen name='WorkoutsScreen' component={WorkoutsScreen}/>
          <Stack.Screen name='DietitianReviewScreen' component={DietitianReviewScreen} />
         </Stack.Navigator>
      </NavigationContainer>
      </ThemeProvider>
  );
};

export default AppNavigator;