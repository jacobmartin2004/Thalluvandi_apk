import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { BannerAdView } from '../../ads/bannerads';

const Favourites = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Favourites</Text>
      </View>

      {/* Reusable banner from manager */}
      <BannerAdView />
    </SafeAreaView>
  );
};

export default Favourites;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});
