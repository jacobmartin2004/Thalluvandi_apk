import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colorpallete';
interface Userdatamain {
  name: string | null;
  email: string | null;
  photoUrl: string | null;
}
const Profile = () => {
  const [userdata, setuserdata] = useState<Userdatamain | null>(null);
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

  return (
    <View style={styles.container}>
      {userdata?.name ? (
        <Text style={styles.text}>{userdata?.name}</Text>
      ) : null}

      <Text style={styles.text}>{userdata?.email}</Text>
      {userdata?.photoUrl ? (
        <Image source={{ uri: userdata?.photoUrl }} style={styles.image} />
      ) : null}

      <TouchableOpacity onPress={logout} style={{ flexDirection: 'row' }}>
        <Icon name="logout" size={22} color={Colors.black || '#666'} />{' '}
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
