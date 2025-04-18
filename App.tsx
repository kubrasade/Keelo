import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './src/screens/SplashScreen'; 
import OnboardingScreen from './src/screens/OnboardingScreen'; 
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DietitianRegisterScreen from './src/screens/DietitianRegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="DietitianRegister" component={DietitianRegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

