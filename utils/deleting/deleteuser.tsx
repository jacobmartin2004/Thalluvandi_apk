// deleteUser.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

export const deleteUserAccountAndData = async (navigation: NavigationProp<any>) => {
  const currentUser = auth().currentUser;

  if (!currentUser) {
    Alert.alert(
      'Not Logged In',
      'You are not currently signed in. Please log in and try again.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
    return;
  }

  const uid = currentUser.uid;

  try {
    await firestore().collection('store').doc(uid).delete();
    console.log('Firestore document deleted');

    await currentUser.delete();
    console.log('User authentication deleted');

    navigation.navigate('Login');
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again to delete your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      console.error('Error deleting user or data:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    }
  }
};
