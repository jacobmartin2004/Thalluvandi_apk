import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Colors from '../theme/colorpallete';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
  bgcolor?: string;
};

const Navbar: React.FC<Props> = ({ bgcolor }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}><Icon name='play-back-outline' size={27}/></Text>
      </View>
    </View>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  container: {
    height: 'auto',
    width: '100%',
    backgroundColor: Colors.yellow,
    justifyContent: 'center',
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
    elevation: 5,
    padding: 10,
  },
  header: {
    marginLeft: 15,
    marginTop: 10,
  },
  text: {
    color: '#000000ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
