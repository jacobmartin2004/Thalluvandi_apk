import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

const UseCustomBackHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false; // allow default behavior (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);
};

export default UseCustomBackHandler;
