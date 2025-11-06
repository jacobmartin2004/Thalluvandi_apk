import React, { useEffect } from 'react';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  MobileAds,
} from 'react-native-google-mobile-ads';
import { View, StyleSheet } from 'react-native';

const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-9723161224881753/6740742165';

/**
 * Initializes the Google Mobile Ads SDK (only needs to run once)
 */
export const initBannerAds = async () => {
  try {
    await MobileAds().setRequestConfiguration({
      testDeviceIdentifiers: ['EMULATOR'],
    });
    await MobileAds().initialize();
    console.log('[Ads] Google Mobile Ads initialized');
  } catch (error) {
    console.warn('[Ads] Banner initialization error:', error);
  }
};

/**
 * Renders a reusable BannerAd component
 */
export const BannerAdView: React.FC = () => {
  useEffect(() => {
    initBannerAds();
  }, []);

  return (
    <View style={styles.bannerContainer}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => console.log('[Ads] Banner loaded')}
        onAdFailedToLoad={error =>
          console.log('[Ads] Banner failed to load:', error)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    bottom: 65,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 5,
  },
});
