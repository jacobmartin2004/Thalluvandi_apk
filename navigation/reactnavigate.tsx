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
import Addshop from '../screens/justasellerthing/addshop';
import Openshop from '../screens/justasellerthing/openshop';
import Addproducts from '../screens/justasellerthing/addproducts';
import Relocate from '../screens/justasellerthing/relocate';
import Editshop from '../utils/openshopfunctions/editshop';
import useCustomBackHandler from '../handlers/backhandlers';
import UseCustomBackHandler from '../handlers/backhandlers';
import Splash from '../screens/splash/splash';

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
          <Stack.Screen name="Addshop" component={Addshop} />
          <Stack.Screen name="Openshop" component={Openshop} />
          <Stack.Screen name="Addproducts" component={Addproducts} />
          <Stack.Screen name="Relocate" component={Relocate} />
          <Stack.Screen name="Editshop" component={Editshop} />
          <Stack.Screen name="goback" component={UseCustomBackHandler as never} />
          <Stack.Screen name='Splash' component={Splash} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};
export default ReactNavigate;
