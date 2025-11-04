// MainPage.tsx
import React, { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  MapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
  LineLayer,
} from '@maplibre/maplibre-react-native';
import { useCurrentLocation } from '../../component/locationtaker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Floatingbuttonaction } from '../../utils/mappagefunctions/floating';
import Modal from 'react-native-modal';
import Modalcontent from '../../utils/mappagefunctions/modalcontent';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Pin = {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
};

export default function MainPage() {
  const [sellerstatus, setsellerstatus] = React.useState<boolean | null>(null);
  const { location, loading, error } = useCurrentLocation();

  const [ismodal, setismodalok] = React.useState(false);
  useEffect(() => {
    if (location) {
      console.log('Current location:', location.latitude, location.longitude);
    }
  }, [location]);
  const sellerstatusget = async () => {
    try {
      const status = await AsyncStorage.getItem('sellerstatus');
      if (status !== null) {
        setsellerstatus(JSON.parse(status));
        console.log('Seller status retrieved:', JSON.parse(status));
      } else {
        console.log('No seller status found in storage.');
      }
    } catch (error) {
      console.error('Error retrieving seller status:', error);
    }
  };

  useEffect(() => {
    sellerstatusget();
  }, []);
  const youCircle = useMemo(() => {
    if (!location) return null;
    // circlePolygon expects [lon, lat]
    return circlePolygon([location.longitude, location.latitude], 3000);
  }, [location]);
  function circlePolygon(
    [lon, lat]: [number, number],
    radiusM = 5000,
    steps = 128,
  ) {
    const R = 6371000; // Earth radius (m)
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;

    const lat1 = toRad(lat);
    const lon1 = toRad(lon);
    const angDist = radiusM / R;

    const coords: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const brng = toRad((i / steps) * 360);
      const sinLat2 =
        Math.sin(lat1) * Math.cos(angDist) +
        Math.cos(lat1) * Math.sin(angDist) * Math.cos(brng);
      const lat2 = Math.asin(sinLat2);
      const y = Math.sin(brng) * Math.sin(angDist) * Math.cos(lat1);
      const x = Math.cos(angDist) - Math.sin(lat1) * sinLat2;
      const lon2 = lon1 + Math.atan2(y, x);
      coords.push([((toDeg(lon2) + 540) % 360) - 180, toDeg(lat2)]); // normalize lon to [-180,180]
    }

    return {
      type: 'Polygon' as const,
      coordinates: [coords],
    };
  }
  const manualPins: Pin[] = useMemo(
    () => [
      {
        id: 'site-a',
        title: 'Apple vandi',
        latitude: 10.85447,
        longitude: 78.60196,
      },
      {
        id: 'site-b',
        title: 'Jacob store',
        latitude: 10.86012,
        longitude: 78.61033,
      },
      { id: 'site-c', title: 'Poo kadai', latitude: 10.8482, longitude: 78.5951 },
      { id: 'site-d', title: 'Potti kadai', latitude: 10.8519, longitude: 78.6067 },
    ],
    [],
  );
  const onClose = () => {
    setismodalok(false);
  };

  const cameraCenter: [number, number] = useMemo(() => {
    if (location) return [location.longitude, location.latitude];
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

        {location && youCircle && (
          <PointAnnotation
            id="you"
            coordinate={[location.longitude, location.latitude]}
            title="You"
          >
            <View style={styles.annotationRoot} pointerEvents="none">
              <View style={styles.youPin}>
                <View style={styles.youRing} />
                <View style={styles.youDot} />
              </View>
              <View style={styles.calloutBox}>
                <Text style={styles.calloutText}>{sellerstatus === true ? "Your shop" : "You"}</Text>
              </View>
            </View>
          </PointAnnotation>
        )}
        <ShapeSource
          id="you-radius-src"
          shape={{
            type: 'Feature',
            geometry: youCircle || { type: 'Polygon', coordinates: [] },
            properties: {},
          }}
        >
          <FillLayer
            id="you-radius-fill"
            style={{
              fillColor: 'rgba(255, 255, 255, 0.18)',
              fillAntialias: true,
              fillOutlineColor: 'rgba(255, 255, 255, 0.7)',
            }}
          />
          <LineLayer
            id="you-radius-outline"
            style={{
              lineColor: 'rgba(0,122,255,0.9)',
              lineWidth: 2,
            }}
          />
        </ShapeSource>
        {manualPins.map(pin => (
          <PointAnnotation
            key={pin.id}
            id={pin.id}
            coordinate={[pin.longitude, pin.latitude]}
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
      {sellerstatus === true && (
        <>
          <Floatingbuttonaction ismodal={setismodalok} />
          <Modal
            isVisible={ismodal}
            onBackdropPress={onClose}
            style={styles.modal}
            swipeDirection="down"
            onSwipeComplete={onClose}
            propagateSwipe
          >
            <Modalcontent />
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Modal>
        </>
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
  //modal styles
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  cancelButton: {
    backgroundColor: '#eee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
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
    zIndex: 10, // iOS layering
    elevation: 3, // Android layering
  },
  calloutText: {
    fontSize: 8,
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
