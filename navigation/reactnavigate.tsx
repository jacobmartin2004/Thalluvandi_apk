// navigation/ReactNavigate.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Login from '../screens/auth/login';
import Register from '../screens/auth/register';
import Initalpage from '../screens/auth/initialpage';
import OnboardingGate from '../screens/explanationcontent/onboardingappstart';
import AppTabs from './appstab'; // <— the tab navigator
import Colors from '../theme/colorpallete';
import { StatusBar } from 'react-native';

const Stack = createStackNavigator();

const ReactNavigate: React.FC = () => {
  
 return (

  <>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Initalpage"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="OnboardingGate" component={OnboardingGate} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Initalpage" component={Initalpage as React.FC} />
        <Stack.Screen name="Main" component={AppTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  </>
);
}
export default ReactNavigate;
