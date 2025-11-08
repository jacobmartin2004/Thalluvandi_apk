import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

interface Prop {
  load: boolean | null;
}

export function Relocationbutton({ load }: Prop) {
  return (
    <View style={styles.floatingbutton}>
      {load ? (
        <ActivityIndicator />
      ) : (
        <AntDesign name="enviromento" size={30} color="#000" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingbutton: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 28,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
