// MainPage.tsx
import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  MapView,
  Camera,
  PointAnnotation,
} from '@maplibre/maplibre-react-native';
import { useCurrentLocation } from '../../component/locationtaker';
;

export default function MainPage() {
  const { location, loading, error } = useCurrentLocation();

  useEffect(() => {
    if (location) {
      console.log('Current location:', location.latitude, location.longitude);
    }
  }, [location]);

  if (error) {
    // ⏳ Still waiting for GPS
    useEffect(() => {
      Alert.alert('waiting');
    });
    return (
      <View style={styles.container}>
        <MapView style={styles.map} />
      </View>
    );
  }

  const coordinate: [number, number] = location
    ? [location.longitude, location.latitude]
    : [0, 0];

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
        {location && (
          <Camera
            centerCoordinate={[location.longitude, location.latitude]}
            zoomLevel={13}
            pitch={30}
          />
        )}

        <PointAnnotation
          id="user-pin"
          coordinate={coordinate}
          title="You are here"
        >
          <View style={styles.pinOuter}>
            <View style={styles.pinInner} />
          </View>
        </PointAnnotation>
      </MapView>
    </View>
  );
}

const PIN = 18;
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
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
    backgroundColor: '#ff3b30',
    borderWidth: 1,
    borderColor: 'white',
  },
});
