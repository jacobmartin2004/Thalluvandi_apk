import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import Colors from '../../theme/colorpallete';
import caranime from '../../assests/anime/Loading 49 _ Car Types.json';

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  GoogleSignin,
  type SignInResponse,
} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleSignInButton from '../../component/googlebutton';

const Login: React.FC = () => {
  const navigation = useNavigation<any>();

  const [isfocusin1, setisfocusin1] = useState(false);
  const [isfocusin2, setisfocusin2] = useState(false);
  const [loading, setloading] = useState(false);
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');
  const [initialuser, setinitaluser] = React.useState(null);
  const [user, setuser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      if (u) {
        setuser(u);
        console.log('user present or not', u);
        navigation.replace('Main');
      } else {
        setuser(null);
      }
    });

    return unsubscribe;
  }, []);
  // Configure Google Sign-In once

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Warning', 'Please fill all the fields');
      return;
    }

    try {
      let res;
      setloading(true);
      res = await auth().signInWithEmailAndPassword(email.trim(), password);
      setloading(false);
      Alert.alert('Success', 'User signed in!');
      navigation.navigate('Main');
      const userInfo = {
        uid: res.user.uid ?? '',
        email: res.user.email ?? '',
      };
      await AsyncStorage.setItem('emaillogindata', JSON.stringify(userInfo));
      console.log('User info saved successfully');
    } catch (error: any) {
      setloading(false);
      const msg =
        typeof error?.message === 'string'
          ? error.message.split(']').pop() ?? error.message
          : 'Login failed';
      Alert.alert('Login Failed', msg);
    }
  }

  return (
    <ImageBackground
      source={require('../../assests/images/bglogin.png')}
      style={styles.container}
    >
      <View
        style={
          loading
            ? [styles.centerbox, { borderRadius: 0 }]
            : [styles.centerboxbg]
        }
      >
        <View style={styles.centerbox}>
          {loading ? (
            <LottieView
              source={caranime}
              autoPlay
              loop
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <>
              <Text style={styles.title}>Login</Text>

              <TextInput
                placeholder="Email"
                placeholderTextColor="#666"
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.textstyleinput,
                  isfocusin1
                    ? { elevation: 10, backgroundColor: '#ffffff' }
                    : { elevation: 2 },
                ]}
                onFocus={() => setisfocusin1(true)}
                onBlur={() => setisfocusin1(false)}
                onChangeText={setemail}
                value={email}
              />

              <TextInput
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry
                style={[
                  styles.textstyleinput,
                  isfocusin2
                    ? { elevation: 10, backgroundColor: '#ffffff' }
                    : { elevation: 2 },
                ]}
                onFocus={() => setisfocusin2(true)}
                onBlur={() => setisfocusin2(false)}
                onChangeText={setpassword}
                value={password}
              />

              <View style={styles.row}>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Explore</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 16 }}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text>Register</Text>
                </TouchableOpacity>
              </View>

              <GoogleSignInButton buttonname="  Sign-In with Google" />
            </>
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerbox: {
    height: 'auto',
    width: '98%',
    backgroundColor: Colors.white,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  centerboxbg: {
    height: 'auto',
    width: '90%',
    backgroundColor: Colors.black,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 50,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  textstyleinput: {
    height: 50,
    color: 'black',
    width: '80%',
    backgroundColor: Colors.grey,
    marginBottom: 10,
    borderRadius: 10,
    paddingLeft: 10,
    elevation: 2,
    borderColor: Colors.black,
    borderWidth: 0, // RN ignores borderBlockColor; use borderColor/borderWidth
  },
  row: {
    width: '90%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  button: {
    backgroundColor: Colors.buttonPrimary,
    padding: 10,
    marginTop: 16,
    borderRadius: 5,
    width: '60%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
});
