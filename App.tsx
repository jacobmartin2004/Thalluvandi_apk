import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import ReactNavigate from './navigation/reactnavigate';
import Colors from './theme/colorpallete';
import useCustomBackHandler from './handlers/backhandlers';

const App: React.FC = () => {

  return (
    <>
      <StatusBar backgroundColor={Colors.yellow} barStyle="dark-content" />
      <ReactNavigate />
    </>
  );
};

export default App;
