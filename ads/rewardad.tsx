import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  MobileAds,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { Alert } from 'react-native';

const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-9723161224881753/8896858568';

let rewardedRef: RewardedAd | null = null;
let isShowing = false;
let loaded = false;

/** Initialize Google Mobile Ads once */
const initAds = async () => {
  await MobileAds()
    .setRequestConfiguration({ testDeviceIdentifiers: ['EMULATOR'] })
    .then(() => MobileAds().initialize());
  console.log('[Ads] Initialized');
};

/** Create and set up a RewardedAd instance */
const createRewardedAd = () => {
  rewardedRef = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  rewardedRef.addAdEventListener(RewardedAdEventType.LOADED, () => {
    console.log('[Ads] Rewarded Ad Loaded');
    loaded = true;
  });

  rewardedRef.addAdEventListener(RewardedAdEventType.EARNED_REWARD, reward => {
    console.log('[Ads] Reward Earned:', reward);
    Alert.alert('🎉 Reward Received!', `You earned ${reward.amount} ${reward.type}`);
  });

  rewardedRef.addAdEventListener(AdEventType.CLOSED, () => {
    console.log('[Ads] Rewarded Ad Closed');
    isShowing = false;
    loaded = false;
    rewardedRef?.load(); // prepare for next time
  });

  rewardedRef.addAdEventListener(AdEventType.ERROR, error => {
    console.log('[Ads] Rewarded Ad Error:', error);
    isShowing = false;
    loaded = false;
    setTimeout(() => rewardedRef?.load(), 5000);
  });

  rewardedRef.load();
};

/** Show a Rewarded Ad when called (no timers or auto triggers) */
export const showRewardedAd = async () => {
  if (!rewardedRef) {
    await initAds();
    createRewardedAd();
  }

  if (isShowing) return;

  if (loaded && rewardedRef) {
    try {
      isShowing = true;
      rewardedRef.show();
    } catch (error) {
      console.log('[Ads] Show Error:', error);
      isShowing = false;
      rewardedRef.load();
    }
  } else {
    console.log('[Ads] Loading Ad...');
    rewardedRef?.load();
  }
};

/** Optionally preload the ad early in app lifecycle */
export const preloadRewardedAd = async () => {
  await initAds();
  createRewardedAd();
  console.log('[Ads] Rewarded Ad Preloaded');
};
