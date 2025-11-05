import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../theme/colorpallete';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

type Props = {
  bgcolor?: string;
  name?: string;
};

const Navbar: React.FC<Props> = ({ bgcolor = Colors.yellow, name = 'Back' }) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: bgcolor }]}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back-outline" size={26} color="#000" style={[styles.title , {marginTop: 23 , fontSize: 26}]} />
        <Text style={styles.title}>{name}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: '10%'
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
  },
});
