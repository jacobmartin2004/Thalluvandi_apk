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
    setTimeout(() => interstitialRef?.load(), 5000);
  });

  interstitialRef.load();
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
