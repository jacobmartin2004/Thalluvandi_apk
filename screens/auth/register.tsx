import {
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import React, { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import Navbar from '../../component/navbar';

import LottieView from 'lottie-react-native';
import caranime from '../../assests/anime/Loading 49 _ Car Types.json';
import Colors from '../../theme/colorpallete';
import auth from '@react-native-firebase/auth';
import GoogleSignInButton from '../../component/googlebutton';
import firestore from '@react-native-firebase/firestore';

const Register: React.FC = () => {
  //find route will boolean value
  const navigate = useNavigation();
  const [isfocusin1, setisfocusin1] = React.useState<boolean>(false);
  const [isfocusin3, setisfocusin3] = React.useState<boolean>(false);
  const [isfocusin4, setisfocusin4] = React.useState<boolean>(false);

  const [isfocusin5, setisfocusin5] = React.useState<boolean>(false);

  const [isenable, setisenable] = React.useState<boolean>(false);
  const [isfocusin2, setisfocusin2] = React.useState<boolean>(false);
  const [loading, setloading] = React.useState<boolean>(false);
  const [email, setemail] = React.useState<string>('');
  const [phoneno, setphoneno] = React.useState<string>('');
  const [sellername, setsellername] = React.useState<string>('');
  const [shopname, setshopname] = React.useState<string>('');

  const [password, setpassword] = React.useState<string>('');
  const [conpassword, setconpassword] = React.useState<string>('');
  function handleLogin() {
    setloading(true);
    setTimeout(() => {
      setloading(false);
    }, 3000);
  }
  const signUptest = async () => {
    if (password !== conpassword) {
      Alert.alert("Password and Confirm Password doesn't match");
      return;
    }

    if (email === '' || password === '' || conpassword === '') {
      Alert.alert('Please fill all the fields');
      return;
    }

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      // try {
      //   await firestore().collection('users').doc(user.uid).set({
      //     email: user.email,
      //     seller: shopname ? true : false,
      //     phoneno,
      //     shopname,
      //     ownername: sellername,
      //     createdAt: firestore.FieldValue.serverTimestamp(),
      //   });
      // } catch (firestoreError) {
      //   console.log('isenable:', isenable);
      //   console.error('Firestore write error:', firestoreError);
      // }

      Alert.alert('User account created & signed in!');
      navigate.navigate('Main' as never);
    } catch (error: any) {
      Alert.alert(
        'Signup Failed',
        error.message?.split(']')[1] || error.message,
      );
      console.log(error);
    }
  };

  return (
    <>
      <ImageBackground
        source={require('../../assests/images/bglogin.png')}
        style={styles.container}
      >
        <View style={styles.centerboxbg}>
          <View style={styles.centerbox}>
            {loading ? (
              <LottieView
                source={caranime}
                autoPlay
                loop
                style={{ width: '90%', height: '50%' }}
              />
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 25,
                    fontWeight: 'bold',
                    marginBottom: 25,
                    marginTop: 20,
                    color: Colors.black,
                  }}
                >
                  Create a New Account
                </Text>
                {isenable ? (
                  <TextInput
                    placeholder="Owner Name"
                    style={[
                      styles.textstyleinput,
                      isfocusin5
                        ? { elevation: 10, backgroundColor: '#ffffff' }
                        : { elevation: 2 },
                    ]}
                    onFocus={() => setisfocusin5(true)}
                    onBlur={() => setisfocusin5(false)}
                    onChangeText={text => setsellername(text)}
                    placeholderTextColor={Colors.black}
                  />
                ) : null}
                <TextInput
                  placeholder="Email"
                  keyboardType="url"
                  style={[
                    styles.textstyleinput,
                    isfocusin1
                      ? { elevation: 10, backgroundColor: '#ffffff' }
                      : { elevation: 2 },
                      
                  ]}
                  onFocus={() => setisfocusin1(true)}
                  onBlur={() => setisfocusin1(false)}
                  onChangeText={text => setemail(text)}
                  placeholderTextColor={Colors.black}
                />
                {isenable ? (
                  <TextInput
                    placeholder="Phone No"
                    keyboardType="numeric"
                    style={[
                      styles.textstyleinput,
                      isfocusin3
                        ? { elevation: 10, backgroundColor: '#ffffff' }
                        : { elevation: 2 },
                    ]}
                    onFocus={() => setisfocusin3(true)}
                    onBlur={() => setisfocusin3(false)}
                    onChangeText={text => setphoneno(text)}
                    placeholderTextColor={Colors.black}
                  />
                ) : null}
                {isenable ? (
                  <TextInput
                    placeholder="Shop Name"
                    style={[
                      styles.textstyleinput,
                      isfocusin4
                        ? { elevation: 10, backgroundColor: '#ffffff' }
                        : { elevation: 2 },
                    ]}
                    onFocus={() => setisfocusin4(true)}
                    onBlur={() => setisfocusin4(false)}
                    onChangeText={text => setshopname(text)}
                  />
                ) : null}
                <TextInput
                  placeholder="Password"
                  secureTextEntry
                  style={[
                    styles.textstyleinput,
                    isfocusin2
                      ? { elevation: 10, backgroundColor: '#fff' }
                      : { elevation: 2 },
                  ]}
                  onFocus={() => setisfocusin2(true)}
                  onBlur={() => setisfocusin2(false)}
                  onChangeText={text => setpassword(text)}
                  placeholderTextColor={Colors.black}
                />
                <TextInput
                  placeholder="Confirm Password"
                  secureTextEntry
                  style={[
                    styles.textstyleinput,
                    isfocusin2
                      ? { elevation: 10, backgroundColor: '#fff' }
                      : { elevation: 2 },
                  ]}
                  onFocus={() => setisfocusin2(true)}
                  onBlur={() => setisfocusin2(false)}
                  onChangeText={text => setconpassword(text)}
                  placeholderTextColor={Colors.black}
                />
                {/* <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontWeight: 'bold', marginRight: 10 }}>
                    Are you a seller
                  </Text>
                  <Switch
                    onValueChange={setisenable}
                    value={isenable}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isenable ? Colors.yellow : '#f4f3f4'}
                  />
                </View> */}

                <View
                  style={[
                    {
                      width: '90%',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'space-evenly',
                    },
                    isenable ? { marginBottom: 20 } : null,
                  ]}
                >
                  <TouchableOpacity style={styles.button} onPress={signUptest}>
                    <Text style={{ color: '#ffffffff' }}>Register</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ marginTop: 16 }}
                    onPress={() => navigate.navigate('Login' as never)}
                  >
                    <Text>Login</Text>
                  </TouchableOpacity>
                </View>
                {isenable ? null : (
                  <GoogleSignInButton buttonname="  Sign-Up with Google" />
                )}
              </>
            )}
          </View>
        </View>
      </ImageBackground>
    </>
  );
};

export default Register;

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
    elevation: 5,
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
  textstyleinput: {
    height: 50,
    width: '80%',
    backgroundColor: Colors.grey,
    marginBottom: 10,
    borderRadius: 10,
    paddingLeft: 10,
    elevation: 2,
    borderBlockColor: Colors.black,
    color: Colors.black,
  },
  button: {
    backgroundColor: Colors.buttonPrimary,
    padding: 10,
    marginTop: 16,
    borderRadius: 5,
    width: '60%',
    alignItems: 'center',
  },
});
