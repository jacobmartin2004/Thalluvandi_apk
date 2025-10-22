import { StatusBar, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Home from './screens/homescreen/home';
import ReactNavigate from './navigation/reactnavigate';
import Colors from './theme/colorpallete';

const App: React.FC = () => {
  return (
    <>
      <StatusBar backgroundColor={Colors.yellow} barStyle="dark-content" />
      <ReactNavigate />
    </>
    // <Home />
  );
};

export default App;

const styles = StyleSheet.create({});
