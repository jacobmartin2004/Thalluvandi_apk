// MainPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  MapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
  LineLayer,
} from '@maplibre/maplibre-react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useCurrentLocation } from '../../component/locationtaker';
import Modal from 'react-native-modal';
import { Floatingbuttonaction } from '../../utils/mappagefunctions/floating';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modalcontent from '../../utils/mappagefunctions/modalcontent';

type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
};

type StoreDoc = {
  id: string;
  shopName?: string;
  ownerName?: string;
  ownerPhone?: string;
  latitude: number;
  longitude: number;
  shopstatus?: boolean;
  products?: Product[];
};

type Pin = {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
  store: StoreDoc;
};

export default function MainPage() {
  const [sellerstatus, setsellerstatus] = useState<boolean | null>(null);
  const { location, loading, error } = useCurrentLocation();

  const [ismodal, setismodalok] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinsLoading, setPinsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreDoc | null>(null);

  // Load cached seller flag
  useEffect(() => {
    const sellerstatusget = async () => {
      try {
        const status = await AsyncStorage.getItem('sellerstatus');
        if (status !== null) setsellerstatus(JSON.parse(status));
      } catch (e) {
        // ignore
      }
    };
    sellerstatusget();
  }, []);

  // Firestore: dynamic pins (only open shops)
  useEffect(() => {
    setPinsLoading(true);
    const unsub = firestore()
      .collection('store')
      .where('shopstatus', '==', true)
      .onSnapshot(
        snap => {
          const arr: Pin[] = [];
          snap.forEach(doc => {
            const d = doc.data() as any;
            if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
              const store: StoreDoc = {
                id: doc.id,
                shopName: d.shopName,
                ownerName: d.ownerName,
                ownerPhone: d.ownerPhone,
                latitude: d.latitude,
                longitude: d.longitude,
                shopstatus: d.shopstatus,
                products: Array.isArray(d.products) ? d.products : [],
              };
              arr.push({
                id: doc.id,
                title: store.shopName || 'Unnamed Shop',
                latitude: store.latitude,
                longitude: store.longitude,
                store,
              });
            }
          });
          setPins(arr);
          setPinsLoading(false);
        },
        e => {
          console.log('pins error:', e);
          setPinsLoading(false);
        }
      );
    return () => unsub();
  }, []);

  // Circle around you
  const youCircle = useMemo(() => {
    if (!location) return null;
    return circlePolygon([location.longitude, location.latitude], 3000);
  }, [location]);

  // Camera center
  const cameraCenter: [number, number] = useMemo(() => {
    if (location) return [location.longitude, location.latitude];
    if (pins.length > 0) return [pins[0].longitude, pins[0].latitude];
    return [78.60196, 10.85447]; // fallback
  }, [location, pins]);

  const onCloseBottomModal = () => setSelectedStore(null);
  const onCloseFABModal = () => setismodalok(false);

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

        {/* You marker */}
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
                <Text style={styles.calloutText}>{sellerstatus === true ? 'Your shop' : 'You'}</Text>
              </View>
            </View>
          </PointAnnotation>
        )}

        {/* You radius */}
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

        {/* Dynamic pins */}
        {pins.map(pin => (
          <PointAnnotation
            key={pin.id}
            id={pin.id}
            coordinate={[pin.longitude, pin.latitude]}
            title={pin.title || ''}
            onSelected={() => setSelectedStore(pin.store)}   // 👈 open popup
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

      {(loading || pinsLoading) && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Location error: {String(error)}</Text>
        </View>
      )}

      {/* Seller tools (your existing modal) */}
      
        <>
          <Floatingbuttonaction ismodal={setismodalok} />
          <Modal
            isVisible={ismodal}
            onBackdropPress={onCloseFABModal}
            style={styles.modal}
            swipeDirection="down"
            onSwipeComplete={onCloseFABModal}
            propagateSwipe
          >
            {/* Your existing content */}
            <Modalcontent />
            <TouchableOpacity style={styles.cancelButton} onPress={onCloseFABModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Modal>
        </>
      

      {/* Bottom popup for a selected pin */}
      <Modal
        isVisible={!!selectedStore}
        onBackdropPress={onCloseBottomModal}
        style={styles.modal}
        swipeDirection="down"
        onSwipeComplete={onCloseBottomModal}
        propagateSwipe
      >
        {selectedStore && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>{selectedStore.shopName || 'Unnamed Shop'}</Text>

            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Owner</Text>
              <Text style={styles.sheetValue}>{selectedStore.ownerName || 'N/A'}</Text>
            </View>

            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Phone</Text>
              <TouchableOpacity
                onPress={async () => {
                  const phone = selectedStore.ownerPhone;
                  if (!phone) return;
                  const url = `tel:${phone}`;
                  const can = await Linking.canOpenURL(url);
                  if (can) Linking.openURL(url);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.sheetValue, styles.link]}>
                  {selectedStore.ownerPhone || 'N/A'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetSubTitle, { marginTop: 12 }]}>Products</Text>
            {(!selectedStore.products || selectedStore.products.length === 0) ? (
              <Text style={{ color: '#6b7280' }}>No products listed.</Text>
            ) : (
              <FlatList
                data={selectedStore.products}
                keyExtractor={p => p.id}
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item }) => (
                  <View style={styles.productCard}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>₹ {Number(item.price).toFixed(2)}</Text>
                    {item.description ? (
                      <Text style={styles.productDesc}>{item.description}</Text>
                    ) : null}
                  </View>
                )}
              />
            )}

            <TouchableOpacity style={[styles.cancelButton, { marginTop: 12 }]} onPress={onCloseBottomModal}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
}

function circlePolygon(
  [lon, lat]: [number, number],
  radiusM = 5000,
  steps = 128
) {
  const R = 6371000;
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
    coords.push([((toDeg(lon2) + 540) % 360) - 180, toDeg(lat2)]);
  }
  return { type: 'Polygon' as const, coordinates: [coords] };
}

const PIN = 18;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // Annotation root
  annotationRoot: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },

  // You pin
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

  // Modal (shared)
  modal: { justifyContent: 'flex-end', margin: 0 },
  sheet: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    marginBottom: 10,
  },
  sheetTitle: { fontWeight: '800', fontSize: 18, color: '#111827' },
  sheetSubTitle: { fontWeight: '700', fontSize: 14, color: '#111827', marginTop: 8 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sheetLabel: { color: '#6b7280' },
  sheetValue: { color: '#111827', fontWeight: '600' },
  link: { textDecorationLine: 'underline' },

  productCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  productName: { fontWeight: '700', fontSize: 14, color: '#111827' },
  productPrice: { marginTop: 2, color: '#111827' },
  productDesc: { marginTop: 4, color: '#6b7280' },

  cancelButton: {
    backgroundColor: '#eee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#333', fontWeight: '600' },

  // Other pins (red)
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

  // Callout
  calloutBox: {
    position: 'absolute',
    top: 40,
    minWidth: 40,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 3,
  },
  calloutText: { fontSize: 8, fontWeight: '600' },
  calloutSpacer: { position: 'absolute', top: 40, width: 1, height: 1 },

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
