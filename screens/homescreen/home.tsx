import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import MainPage from './mainpage';

import useCustomBackHandler from '../../handlers/backhandlers';
import StoreSearchScreen from './serachbar';
import { initInterstitialAd, showInterstitialAd } from '../../ads/interstialad';
// import { initInterstitialAd, showInterstitialAd } from '../../ads/interstialad';

const FIVE_MIN_MS = 3 * 60 * 1000;

const Home: React.FC = () => {
  useEffect(() => {
    initInterstitialAd();

    // Initial show when loaded
    const initial = setTimeout(() => showInterstitialAd(), 10000);

    // Then repeat every 3 minutes
    const schedule = setInterval(() => {
      showInterstitialAd();
    }, FIVE_MIN_MS);

    return () => {
      clearTimeout(initial);
      clearInterval(schedule);
    };
  }, []);

  useCustomBackHandler();
  const [lati , setlati] = useState<number | null>(null);
  const [long , setlong] = useState<number | null>(null);
  console.log(lati , long);
  
  return (
    <>
      <StoreSearchScreen setlati = {setlati} setlong = {setlong} />
      <MainPage lati={lati} long={long}/>
    </>
  );
};

export default Home;

const styles = StyleSheet.create({
  
});
