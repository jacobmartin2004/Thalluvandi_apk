// navigation/AppTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../theme/colorpallete';

// Your screen components
import Home from '../screens/homescreen/home';


import Maps from '../screens/bottomtabscreens/Maps';
import Offers from '../screens/bottomtabscreens/Offers';
import Favourites from '../screens/bottomtabscreens/Favourites';
import Profile from '../screens/bottomtabscreens/Profile';
import Navbar from '../component/navbar';
import { StatusBar } from 'react-native';

const Tab = createBottomTabNavigator();

const AppTabs: React.FC = () => {
  return (
    <>

     {/* <Navbar /> */}
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: ({ focused, size, color }) => {
          const icons: Record<string, string> = {
            Home: 'home-outline',
            Map: 'map-outline',
            Offers: 'pricetag-outline',
            Favourites: 'heart-outline',
            Profile: 'person-outline',
          };
          const base = icons[route.name] ?? 'ellipse-outline';
          const name = focused ? base.replace('-outline', '') : base;
          return <Icon name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: '#000000ff',
        tabBarInactiveBackgroundColor: Colors.yellow,
        tabBarActiveBackgroundColor: Colors.white,
        tabBarStyle: {
          height: 70,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Map" component={Maps} />
      <Tab.Screen name="Offers" component={Offers} />
      <Tab.Screen name="Favourites" component={Favourites} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
    </>
  );
};

export default AppTabs;
