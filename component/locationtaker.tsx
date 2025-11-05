// useCurrentLocation.ts
import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, { GeoError, GeoPosition } from 'react-native-geolocation-service';

type Location = { latitude: number; longitude: number } | null;
type Result = { location: Location; loading: boolean; error: string | null };

async function requestAndroidPermission(): Promise<boolean> {
  const hasFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  const hasCoarse = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
  if (hasFine || hasCoarse) return true;

  const res = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  const grantedFine = res[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
  const grantedCoarse = res[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
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
        // Permissions
        if (Platform.OS === 'ios') {
          const auth = await Geolocation.requestAuthorization('whenInUse');
          if (auth !== 'granted') throw new Error(`iOS location permission: ${auth}`);
        } else {
          const ok = await requestAndroidPermission();
          if (!ok) throw new Error('Android location permission denied');
        }

        // 1) Get an initial fix (don’t wait for movement)
        await new Promise<void>((resolve) => {
          Geolocation.getCurrentPosition(
            (pos: GeoPosition) => {
              setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
              setLoading(false);
              resolve();
            },
            (err: GeoError) => {
              setError(`${err.code}: ${err.message}`);
              setLoading(false);
              resolve(); // still proceed to watch, sometimes getCurrentPosition times out
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
              forceRequestLocation: true, // Android: try to force a fresh fix
              showLocationDialog: true,
            }
          );
        });

        // 2) Start watching updates
        watchId.current = Geolocation.watchPosition(
          (pos: GeoPosition) => {
            setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          },
          (err: GeoError) => {
            setError(`${err.code}: ${err.message}`);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 5,      // meters before callback fires
            interval: 5000,         // Android: ms between updates
            fastestInterval: 2000,  // Android
            showsBackgroundLocationIndicator: false,
          }
        );
      } catch (e: any) {
        setError(e?.message ?? 'Unknown location error');
        setLoading(false);
      }
    })();

    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      Geolocation.stopObserving(); // extra cleanup for Android
    };
  }, []);

  return { location, loading, error };
}
