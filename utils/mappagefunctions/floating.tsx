import { Alert, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useCurrentLocation } from '../../component/locationtaker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import React, { Dispatch, SetStateAction, useEffect, useMemo } from 'react';

import Modal from 'react-native-modal';
type Props = {
  ismodal: Dispatch<SetStateAction<boolean>>;
}
export function Floatingbuttonaction({ismodal}: Props) {

  const floatingbuttonaction = () => {
    ismodal(true);
  };
  return (
    <TouchableOpacity
      style={styles.floatingbutton}
      onPress={floatingbuttonaction}
    >
      <AntDesign name="dingding" size={40} color="#000" />
      <Text style={{ color: 'black' }}>explore</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  floatingbutton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
});
