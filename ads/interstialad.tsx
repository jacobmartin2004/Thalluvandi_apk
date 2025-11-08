import React, { useEffect } from 'react';
import {
  MobileAds,
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-9723161224881753/9199384540';

let interstitialRef: InterstitialAd | null = null;
let loaded = false;
let reloadInterval: ReturnType<typeof setInterval> | null = null;

/** Initialize and set listeners for interstitial ads */
export const initInterstitialAd = () => {
  if (interstitialRef) return; // Prevent re-init

  MobileAds()
    .setRequestConfiguration({
      testDeviceIdentifiers: ['EMULATOR'],
    })
    .then(() => MobileAds().initialize())
    .then(() => console.log('[Ads] Interstitial Initialized'));

  interstitialRef = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  interstitialRef.addAdEventListener(AdEventType.LOADED, () => {
    console.log('[Ads] Interstitial Loaded');
    loaded = true;
  });

  interstitialRef.addAdEventListener(AdEventType.CLOSED, () => {
    console.log('[Ads] Interstitial Closed — reloading...');
    loaded = false;
    interstitialRef?.load();
  });

  interstitialRef.addAdEventListener(AdEventType.ERROR, error => {
    console.log('[Ads] Interstitial Error:', error);
    loaded = false;
    setTimeout(() => interstitialRef?.load(), 10000);
  });

  interstitialRef.load();

  // Reload ad every 5 minutes
  if (!reloadInterval) {
    reloadInterval = setInterval(() => {
      console.log('[Ads] Auto-reloading interstitial ad...');
      interstitialRef?.load();
    }, 5 * 60 * 1000); // 5 minutes
  }
};

/** Show interstitial ad immediately if ready, else load and retry */
export const showInterstitialAd = () => {
  if (!interstitialRef) {
    console.warn('[Ads] Not initialized yet, calling init...');
    initInterstitialAd();
    return;
  }

  if (loaded) {
    try {
      interstitialRef.show();
      loaded = false; // reset after show
    } catch (e) {
      console.warn('[Ads] Error showing ad:', e);
      interstitialRef.load();
    }
  } else {
    console.log('[Ads] Not ready — loading new ad');
    interstitialRef.load();
  }
};

/** Cleanup when not needed (e.g., on unmount or exit) */
export const destroyInterstitialAd = () => {
  if (reloadInterval) {
    clearInterval(reloadInterval);
    reloadInterval = null;
  }
  interstitialRef = null;
  loaded = false;
};

/** Example React hook to initialize on mount */
export const useInterstitialAd = () => {
  useEffect(() => {
    initInterstitialAd();
    return () => {
      destroyInterstitialAd();
    };
  }, []);
};
