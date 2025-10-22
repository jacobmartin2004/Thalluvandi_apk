import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Button,
  ActivityIndicator,
} from 'react-native';
import {
  GoogleSignin,
  SignInResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Colors from '../theme/colorpallete';
const WEB_CLIENT_ID =
  '217764581283-m3d97od22ta1lnuibdpsp2rl8oc0lr4k.apps.googleusercontent.com';
type Userdata = {
  email: string;
  photo: string;
  name: string;
};
const GoogleSignInButton: React.FC<{ buttonname: string }> = ({
  buttonname,
}) => {
  const [loading, setloading] = React.useState<boolean>(false);
  const navigation = useNavigation<any>();
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
    });
  }, []);
  const saveUserData = async (user: Userdata): Promise<void> => {
    try {
      await AsyncStorage.setItem('userEmail', user.email);
      await AsyncStorage.setItem('userName', user.name);
      await AsyncStorage.setItem('userPhoto', user.photo);
      console.log('User data saved successfully!');
    } catch (error) {
      console.error('Error saving user data: ', error);
    }
  };
  async function onGoogleButtonPress() {
    try {
      setloading(true);

      // Ensure Google Play Services (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // v13+ returns { data: { idToken, ... } }
      const result: SignInResponse = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken ?? (result as any)?.idToken ?? null;

      if (!idToken) {
        throw new Error(
          'No ID token found. Make sure GoogleSignin.configure({ webClientId }) is set and the user completed sign-in.',
        );
      }

      // Create Firebase credential and sign in
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
      console.log('Google Sign-In successful', result);

      await AsyncStorage.setItem('userToken', result?.data?.idToken || '');
      saveUserData(result?.data?.user as unknown as Userdata);
      if (buttonname === '  Sign-Up with Google') {
        Alert.alert('Success', 'Signed up with Google!');
      } else {
        Alert.alert('Success', 'Signed in with Google!');
      }

      navigation.navigate('Main');
      setloading(false);
    } catch (error: any) {
      setloading(false);
      // If user cancelled, you may want to silently ignore
      const msg = error?.message ?? 'Google Sign-In failed';
      Alert.alert('Google Sign-In Failed', msg);
    }
  }

  return (
    <TouchableOpacity
      onPress={onGoogleButtonPress}
      disabled={loading}
      style={[styles.button, { width: '80%', marginTop: 12 }]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.buttonText}>
          <FontAwesome name="google" size={23} color={Colors.black} />{' '}
          {buttonname}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default GoogleSignInButton;
const styles = StyleSheet.create({
  button: {
    marginTop: 10,
    backgroundColor: Colors.yellow,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
