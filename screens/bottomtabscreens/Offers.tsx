import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Alert, Button } from 'react-native';
import { showRewardedAd } from '../../ads/rewardad';
import Navbar from '../../component/navbar';

const Offers = () => {
  useEffect(() => {
    showRewardedAd();
  }, []);
  setTimeout(() => {
    showRewardedAd();
  }, 5000);
  return (
    <>
      <Navbar name="Offers" />

      <View style={styles.container}>

      <Text style={styles.title}>Currently There is No offers </Text>
      </View>
    </>
  );
};

export default Offers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
});
