import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import SearchBar from './serachbar';
import MainPage from './mainpage';

import useCustomBackHandler from '../../handlers/backhandlers';
import { initInterstitialAd, showInterstitialAd } from '../../ads/interstialad';

const FIVE_MIN_MS = 3 * 60 * 1000;

const Home: React.FC = () => {
  useEffect(() => {
    initInterstitialAd();

    // Initial show when loaded
    const initial = setTimeout(() => showInterstitialAd(), 2000);

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

  return (
    <>
      <SearchBar placeholder="Search vendors, items..." bgcolor="#fff" />
      <MainPage />
    </>
  );
};

export default Home;

const styles = StyleSheet.create({});
