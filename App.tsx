import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import ReactNavigate from './navigation/reactnavigate';
import Colors from './theme/colorpallete';
import useCustomBackHandler from './handlers/backhandlers';
import { LogBox } from 'react-native';

const App: React.FC = () => {
  // This hides all warning messages
  LogBox.ignoreAllLogs(true);

  return (
    <>
      <StatusBar backgroundColor={Colors.yellow} barStyle="dark-content" />
      <ReactNavigate />
    </>
  );
};

export default App;
