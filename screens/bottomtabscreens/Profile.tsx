import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colorpallete';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { sendResetEmail } from '../../utils/profilepagefunctions/changepassword';

interface Userdatamain {
  name: string | null;
  email: string | null;
  photoUrl: string | null;
}
interface Userprofiledata {
  email: string;
  ownername: string;
  phoneno: string;
  shopname: string;
  seller: boolean;
}
const Profile = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [userdata, setuserdata] = useState<Userdatamain | null>(null);
  const [userdataprofile, setuserdataprofile] =
    useState<Userprofiledata | null>(null);
  const navigation = useNavigation();

  const logout = () => {
    navigation.navigate('Login' as never);
  };
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        console.log('UID:', user);
        console.log('Email:', user.email);
        let data = {
          name: user.displayName,
          email: user.email,
          photoUrl: user.photoURL,
        };
        setuserdata(data);
        console.log(data);
      } else {
        console.log('No user is logged in');
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);
  async function fetchmyprofile() {
    const user = auth().currentUser;
    if (!user) return Alert.alert('No user is logged in');

    try {
      const userdata = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();
      if (userdata) {
        const userDataObj = userdata.data();

        console.log('profile data', userDataObj);
        let data = {
          email: userDataObj?.email,
          ownername: userDataObj?.ownername,
          phoneno: userDataObj?.phoneno,
          shopname: userDataObj?.shopname,
          seller: userDataObj?.seller,
        };
        setuserdataprofile(data);
      } else {
        console.log('No user data found in Firestore');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }
  useEffect(() => {
    fetchmyprofile();
  }, []);
  const changepassword = async () => {
    await sendResetEmail(userdata?.email || '');
  };
  // async function triggerReset(email: string) {
  //   setLoading(true);
  //   try {
  //     // If you want the default flow, call without actionCodeSettings
  //     await sendResetEmail(email);
  //     Alert.alert(
  //       'Success',
  //       'Password reset email sent successfully. Check your inbox and spam folder.',
  //     );
  //   } catch (err: any) {
  //     console.warn('sendResetEmail error', err);
  //     const code = err?.code;
  //     if (code === 'auth/invalid-email') {
  //       Alert.alert('Invalid email', 'The email address is badly formatted.');
  //     } else if (code === 'auth/user-not-found') {
  //       Alert.alert(
  //         'User not found',
  //         'No account exists with that email address.',
  //       );
  //     } else if (code === 'auth/network-request-failed') {
  //       Alert.alert(
  //         'Network error',
  //         'Please check your connection and try again.',
  //       );
  //     } else {
  //       Alert.alert(
  //         'Error',
  //         err?.message ?? 'Failed to send password reset email.',
  //       );
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  //   return { changepassword, loading };
  // }

  return (
    <View style={styles.container}>
      <View style={styles.headerprofile}>
        {userdata?.photoUrl ? (
          <Image source={{ uri: userdata?.photoUrl }} style={styles.image} />
        ) : (
          <Icon
            name="user"
            size={40}
            color={Colors.black || '#666'}
            style={{ backgroundColor: 'white', borderRadius: 20, padding: 10 }}
          />
        )}
        {userdata?.name ? (
          <Text style={styles.text}>{userdata?.name}</Text>
        ) : (
          <Text style={styles.text}>{userdata?.email}</Text>
        )}
      </View>
      <View style={styles.divider}></View>
      {userdataprofile?.seller === true && (
        <>
          <View style={styles.profilepage}>
            <Text style={styles.header}>Seller Details</Text>
            <View style={{ flexDirection: 'row', width: '80%' }}>
              <Text style={styles.sidehead}>Email:</Text>
              <Text style={styles.sidedata}>{userdataprofile?.email}</Text>
            </View>
            <View style={{ flexDirection: 'row', width: '80%' }}>
              <Text style={styles.sidehead}>Owner Name:</Text>
              <Text style={styles.sidedata}>{userdataprofile?.ownername}</Text>
            </View>
            <View style={{ flexDirection: 'row', width: '80%' }}>
              <Text style={styles.sidehead}>Phone No:</Text>
              <Text style={styles.sidedata}>{userdataprofile?.phoneno}</Text>
            </View>
            <View style={{ flexDirection: 'row', width: '80%' }}>
              <Text style={styles.sidehead}>Shop Name:</Text>
              <Text style={styles.sidedata}>{userdataprofile?.shopname}</Text>
            </View>
            <View style={{ flexDirection: 'row', width: '80%' }}>
              <Text style={styles.sidehead}>Seller:</Text>
              <Text style={styles.sidedata}>
                {userdataprofile?.seller ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
          <View style={styles.divider}></View>
        </>
      )}

      <View style={styles.profilepage1}>
        <Text style={styles.header}>Other Options</Text>

        <TouchableOpacity>
          <Text style={styles.otheroptionstext}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.otheroptionstext}>Update Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={changepassword}>
          <Text style={styles.otheroptionstext}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={[styles.otheroptionstext, { color: 'red' }]}>
            Delete account
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={logout} style={styles.logout}>
        <Icon
          name="logout"
          size={22}
          color={Colors.black || '#666'}
          style={{ marginRight: 10 }}
        />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
  logout: {
    flexDirection: 'row',
    backgroundColor: 'red',
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 13,
    position: 'absolute',
    bottom: 100,
    gap: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 50,
  },
  headerprofile: {
    marginTop: 50,
    alignItems: 'center',
    gap: 30,
    flexDirection: 'row',
  },
  profilepage: {
    alignItems: 'flex-start',
  },
  profilepage1: {
    alignItems: 'flex-start',
    marginRight: '30%',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sidehead: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  sidedata: {
    fontSize: 17,
    marginTop: 10,
    marginLeft: 20,
    fontWeight: '500',
  },
  divider: {
    backgroundColor: 'black',
    height: 1,
    width: '90%',
    marginTop: 25,
    marginBottom: 25,
  },
  otheroptionstext: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 15,
  },
});
