// MainPage.tsx
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import {
  MapView,
  Camera,
  PointAnnotation,
} from '@maplibre/maplibre-react-native';
import { useCurrentLocation } from '../../component/locationtaker';

type Pin = {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
};

export default function MainPage() {
  const { location, loading, error } = useCurrentLocation();

  useEffect(() => {
    if (location) {
      console.log('Current location:', location.latitude, location.longitude);
    }
  }, [location]);

  // ====== Manually define OTHER locations here ======
  const manualPins: Pin[] = useMemo(
    () => [
      { id: 'site-a', title: 'Site A', latitude: 10.85447, longitude: 78.60196 },
      { id: 'site-b', title: 'Site B', latitude: 10.86012, longitude: 78.61033 },
      { id: 'site-c', title: 'Site C', latitude: 10.8482,  longitude: 78.5951  },
      { id: 'site-d', title: 'Site D', latitude: 10.8519,  longitude: 78.6067  },
    ],
    []
  );

  // Camera center: prefer user location, fallback to first manual pin
  const cameraCenter: [number, number] = useMemo(() => {
    if (location) return [location.longitude, location.latitude]; // [lng, lat]
    return [manualPins[0].longitude, manualPins[0].latitude];
  }, [location, manualPins]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapStyle="https://api.maptiler.com/maps/streets-v4/style.json?key=aFu5QKOgg8nlB75eg7y8"
        compassEnabled
        logoEnabled
        attributionEnabled
        zoomEnabled
        rotateEnabled
        scrollEnabled
        pitchEnabled
      >
        <Camera centerCoordinate={cameraCenter} zoomLevel={13} pitch={30} />

        {/* ========= MAIN (GPS) LOCATION — distinct look ========= */}
        {location && (
          <PointAnnotation
            id="you"
            coordinate={[location.longitude, location.latitude]}
            title="You"
          >
            {/* IMPORTANT: PointAnnotation must have exactly ONE child */}
            <View style={styles.annotationRoot} pointerEvents="none">
              <View style={styles.youPin}>
                <View style={styles.youRing} />
                <View style={styles.youDot} />
              </View>
              <View style={styles.calloutBox}>
                <Text style={styles.calloutText}>You</Text>
              </View>
            </View>
          </PointAnnotation>
        )}

        {/* ========= OTHER (MANUAL) LOCATIONS ========= */}
        {manualPins.map((pin) => (
          <PointAnnotation
            key={pin.id}
            id={pin.id}
            coordinate={[pin.longitude, pin.latitude]} // MapLibre expects [lng, lat]
            title={pin.title || ''}
          >
            <View style={styles.annotationRoot} pointerEvents="none">
              <View style={styles.pin}>
                <View style={styles.pinOuter}>
                  <View style={styles.pinInner} />
                </View>
              </View>
              {pin.title ? (
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutText}>{pin.title}</Text>
                </View>
              ) : (
                <View style={styles.calloutSpacer} />
              )}
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Location error: {String(error)}</Text>
        </View>
      )}
    </View>
  );
}

const PIN = 18;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // The ONE child of each PointAnnotation — fixed size, relative parent
  annotationRoot: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },

  // ======= MAIN/User pin (green with ring) =======
  youPin: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
  },
  youRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(46, 204, 113, 0.25)',
  },
  youDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2ecc71',
    borderWidth: 2,
    borderColor: 'white',
  },

  // ======= Other pins (red) =======
  pin: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
  },
  pinOuter: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    width: PIN - 6,
    height: PIN - 6,
    borderRadius: (PIN - 6) / 2,
    backgroundColor: '#ff0000ff',
    borderWidth: 1,
    borderColor: 'white',
  },

  // ======= Callout below the pin =======
  calloutBox: {
    position: 'absolute',
    top: 40, // sits below the 28px pin
    minWidth: 40,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,     // iOS layering
    elevation: 3,   // Android layering
  },
  calloutText: {
    fontSize: 11,
    fontWeight: '600',
  },
  calloutSpacer: {
    position: 'absolute',
    top: 40,
    width: 1,
    height: 1,
  },

  // Loading & error banners
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
  },
  errorBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#cc0000',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
