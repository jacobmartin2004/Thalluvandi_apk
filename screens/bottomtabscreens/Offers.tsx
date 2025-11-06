import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Alert, Button } from 'react-native';
import { showRewardedAd } from '../../ads/rewardad';


const Offers = () => {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎁 Offers & Rewards</Text>
      <Button title='play' onPress={() => {showRewardedAd()}} />
    </View>
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