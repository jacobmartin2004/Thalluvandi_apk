import { useEffect, useState, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, { GeoPosition, GeoError } from 'react-native-geolocation-service';

type Location = { latitude: number; longitude: number } | null;

type Result = {
  location: Location | null;
  loading: boolean;
  error: string | null;
};

async function requestAndroidPermission(): Promise<boolean> {
  const hasFine = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  const hasCoarse = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
  );
  if (hasFine || hasCoarse) return true;

  const res = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  const grantedFine =
    res[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
  const grantedCoarse =
    res[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

  return grantedFine || grantedCoarse;
}

export function useCurrentLocation(): Result {
  const [location, setLocation] = useState<Location>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'ios') {
          const auth = await Geolocation.requestAuthorization('whenInUse');
          if (auth !== 'granted') throw new Error(`iOS location permission: ${auth}`);
        } else {
          const ok = await requestAndroidPermission();
          if (!ok) throw new Error('Android location permission denied');
        }

        // 🔁 Start watching position updates
        watchId.current = Geolocation.watchPosition(
          (pos: GeoPosition) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ latitude, longitude });
            setLoading(false);
          },
          (err: GeoError) => {
            setError(`${err.code}: ${err.message}`);
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 5, // meters before callback fires (tweak as needed)
            interval: 5000, // ms between updates on Android
            fastestInterval: 2000,
            showLocationDialog: true,
          }
        );
      } catch (e: any) {
        setError(e?.message ?? 'Unknown location error');
        setLoading(false);
      }
    })();

    // Cleanup watcher on unmount
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, []);

  return { location, loading, error };
}
