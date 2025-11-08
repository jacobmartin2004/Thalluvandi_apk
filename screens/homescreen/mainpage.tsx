// MainPage.tsx
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import {
  MapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
  LineLayer,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';

import { useCurrentLocation } from '../../component/locationtaker';
import { Floatingbuttonaction } from '../../utils/mappagefunctions/floating';
import Modalcontent from '../../utils/mappagefunctions/modalcontent';
import { Relocationbutton } from '../../utils/mappagefunctions/relocationbutton';
import { SearchBar } from 'react-native-screens';
import Icon from 'react-native-vector-icons/Ionicons';
import { checkFavorite, toggleFavorite } from '../../utils/fav/favorite';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

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
  ownerPhotoUrl?: string; // 🆕 photo of the owner
  storefrontUrl?: string; // 🆕 photo of the storefront
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

////////////////////////////////////////////////////////////////////////////////
// Constants & Utilities
////////////////////////////////////////////////////////////////////////////////

const PIN_SIZE = 18;
// Tiruchirappalli (Trichy), Tamil Nadu, India — [lon, lat]
const TRICHY_CENTER: [number, number] = [78.7047, 10.7905];
const DEFAULT_ZOOM = 13;
const DEFAULT_PITCH = 30;
const ANIM_MS = 800;

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

// Great-circle polygon for a meter radius around [lon, lat]
function circlePolygon(
  [lon, lat]: [number, number],
  radiusM = 3000,
  steps = 128,
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

////////////////////////////////////////////////////////////////////////////////
// Components
////////////////////////////////////////////////////////////////////////////////

const ProductCard = memo(({ item }: { item: Product }) => {
  return (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>
        {formatINR(Number(item.price) || 0)}
      </Text>
      {!!item.description && (
        <Text style={styles.productDesc}>{item.description}</Text>
      )}
    </View>
  );
});

////////////////////////////////////////////////////////////////////////////////
// Screen
////////////////////////////////////////////////////////////////////////////////
interface propsdata {
  lati: number | null;
  long: number | null;
}
export default function MainPage({ lati, long }: propsdata) {
  console.log('main page jacob', lati, long);
  const [isFav, setIsFav] = useState(false);

  const [sellerstatus, setSellerStatus] = useState<boolean | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinsLoading, setPinsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreDoc | null>(null);
  const [isFabModal, setFabModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [load, setload] = useState<boolean | null>(false);
  const {
    location,
    loading: locationLoading,
    error: locationError,
  } = useCurrentLocation();

  // Lock the initial center ONCE (no auto-recentering later)
  const initialCenterRef = useRef<[number, number]>(
    location ? [location.longitude, location.latitude] : TRICHY_CENTER,
  );

  const cameraRef = useRef<CameraRef>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedStore) return;
      try {
        const fav = await checkFavorite(selectedStore.id);
        if (mounted) setIsFav(fav);
      } catch {
        if (mounted) setIsFav(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedStore]);

  // Load cached seller flag
  useEffect(() => {
    (async () => {
      try {
        const status = await AsyncStorage.getItem('sellerstatus');
        if (status !== null) setSellerStatus(JSON.parse(status));
      } catch {
        // ignore
      }
    })();
  }, []);
  const openInGoogleMaps = async (selectedStore?: StoreDoc) => {
    if (!selectedStore) return;
    const { latitude, longitude, shopName } = selectedStore;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    const label = encodeURIComponent(shopName || 'Location');
    const appUrl = `comgooglemaps://?q=${latitude},${longitude}(${label})`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpenApp ? appUrl : webUrl);
    } catch {
      Linking.openURL(webUrl);
    }
  };
  const cameraDefault = useMemo(
    () => ({
      centerCoordinate: initialCenterRef.current,
      zoomLevel: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
    }),
    [location], // important: empty deps so identity stays stable
  );
  // Subscribe to Firestore: dynamic pins (only open shops)
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
            if (
              typeof d.latitude === 'number' &&
              typeof d.longitude === 'number'
            ) {
              const store: StoreDoc = {
                id: doc.id,
                shopName: d.shopName,
                ownerName: d.ownerName,
                ownerPhone: d.ownerPhone,
                latitude: d.latitude,
                longitude: d.longitude,
                shopstatus: d.shopstatus,
                storefrontUrl: d.storefrontUrl,
                ownerPhotoUrl: d.ownerPhotoUrl,
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
        },
      );

    return () => unsub();
  }, []);

  const youCircle = useMemo(() => {
    if (!location) return null;
    return circlePolygon([location.longitude, location.latitude], 3000);
  }, [location]);

  // Recenter ONLY on button press (if location available)
  const handleRecenter = () => {
    try {
      if (!location) {
        setload(true);
        return; // exit early so TypeScript knows location is not null after this
      }

      cameraRef.current?.setCamera?.({
        centerCoordinate: [location.longitude, location.latitude],
        zoomLevel: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        animationDuration: ANIM_MS,
      });
    } catch {
      console.log('problem');
    } finally {
      setload(false);
    }
  };

  // (Optional) If you want to snap to user's location ONLY ONCE
  // the first time a proper GPS fix arrives, keep this. Otherwise, remove it.
  const centeredOnceRef = useRef(false);
  useEffect(() => {
    if (!location || centeredOnceRef.current) return;
    centeredOnceRef.current = true;
    cameraRef.current?.setCamera?.({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      animationDuration: ANIM_MS,
    });
  }, [location]);

  const closeBottomSheet = useCallback(() => setSelectedStore(null), []);
  const closeFabModal = useCallback(() => setFabModal(false), []);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <ProductCard item={item} />,
    [],
  );

  const keyExtractorProduct = useCallback((p: Product) => p.id, []);
  useEffect(() => {
    if (lati != null && long != null) {
      cameraRef.current?.setCamera?.({
        centerCoordinate: [long, lati], // MapLibre expects [lon, lat]
        zoomLevel: 16,
        pitch: DEFAULT_PITCH,
        animationDuration: ANIM_MS,
      });
    }
  }, [lati, long]);

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
        {/* Apply initial view ONLY ONCE using defaultSettings */}
        <Camera ref={cameraRef} defaultSettings={cameraDefault} />

        {/* You marker */}
        {location && (
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
                <Text style={styles.calloutText}>
                  {sellerstatus === true ? 'Your shop' : 'You'}
                </Text>
              </View>
            </View>
          </PointAnnotation>
        )}

        {/* You radius */}
        {youCircle && (
          <ShapeSource
            id="you-radius-src"
            shape={{
              type: 'Feature',
              geometry: youCircle,
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
        )}
        {/* Search result pin */}
        {lati != null && long != null && (
          <PointAnnotation
            id="search-result"
            coordinate={[long, lati]}
            title="Search result"
          >
            <View style={styles.annotationRoot} pointerEvents="none">
              <View style={styles.searchPin}>
                <View style={styles.searchPinOuter}>
                  <View style={styles.searchPinInner} />
                </View>
              </View>
              <View style={styles.calloutBox}>
                <Text style={styles.calloutText}>Search result</Text>
              </View>
            </View>
          </PointAnnotation>
        )}

        {/* Dynamic pins */}
        {pins.map(pin => (
          <PointAnnotation
            key={pin.id}
            id={pin.id}
            coordinate={[pin.longitude, pin.latitude]}
            title={pin.title || ''}
            onSelected={() => setSelectedStore(pin.store)}
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

      {(locationLoading || pinsLoading) && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {!!locationError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Location error: {String(locationError)}
          </Text>
        </View>
      )}

      {/* Controls */}
      <TouchableOpacity onPress={handleRecenter}>
        <Relocationbutton load={load} />
      </TouchableOpacity>

      <Floatingbuttonaction ismodal={setFabModal} />

      {/* FAB Modal */}
      <Modal
        isVisible={isFabModal}
        onBackdropPress={closeFabModal}
        style={styles.modal}
        swipeDirection="down"
        onSwipeComplete={closeFabModal}
        propagateSwipe
      >
        <Modalcontent />
        <TouchableOpacity style={styles.cancelButton} onPress={closeFabModal}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Sheet for selected pin */}
      <Modal
        isVisible={!!selectedStore}
        onBackdropPress={closeBottomSheet}
        onSwipeComplete={closeBottomSheet}
        // swipeDirection="down"
        propagateSwipe
        useNativeDriver
        useNativeDriverForBackdrop
        style={styles.modal} // see styles below
        scrollTo={p => scrollViewRef.current?.scrollTo(p)}
        scrollOffset={scrollOffset}
      >
        {selectedStore && (
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Header (not scrollable) */}
            <Text style={styles.sheetTitle}>
              {selectedStore.shopName || 'Unnamed Shop'}
            </Text>

            {/* Scrollable content */}
            <ScrollView
              style={styles.scroll} // gives it height
              contentContainerStyle={styles.scrollInner} // spacing/padding
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* Photos */}
              {(selectedStore.ownerPhotoUrl || selectedStore.storefrontUrl) && (
                <View style={styles.imageRow}>
                  {/* {selectedStore.ownerPhotoUrl ? (
                    <Image
                      source={{ uri: selectedStore.ownerPhotoUrl }}
                      style={styles.sheetImage}
                      resizeMode="cover"
                      accessible
                      accessibilityLabel="Owner photo"
                    />
                  ) : null} */}
                  {selectedStore.storefrontUrl ? (
                    <Image
                      source={{ uri: selectedStore.storefrontUrl }}
                      style={styles.sheetImage}
                      resizeMode="cover"
                      accessible
                      accessibilityLabel="Storefront photo"
                    />
                  ) : null}
                </View>
              )}

              {/* Info rows */}
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Owner</Text>
                <Text style={styles.sheetValue}>
                  {selectedStore.ownerName || 'N/A'}
                </Text>
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
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}
              >
                {typeof selectedStore.latitude === 'number' &&
                  typeof selectedStore.longitude === 'number' && (
                    <TouchableOpacity
                      style={styles.mapsButton}
                      onPress={() => openInGoogleMaps(selectedStore)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.mapsButtonText}>
                        Open in Google Maps
                      </Text>
                    </TouchableOpacity>
                  )}
                <TouchableOpacity
                  style={styles.mapsButton}
                  onPress={async () => {
                    if (!selectedStore) return;
                    try {
                      const newState = await toggleFavorite(selectedStore);
                      setIsFav(newState);
                    } catch (e) {
                      Alert.alert(
                        'Sign in required',
                        'Please sign in to use favorites.',
                      );
                    }
                  }}
                  activeOpacity={0.9}
                >
                  <Icon
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={22}
                    color="red"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.mapsButtonText}>
                    {isFav ? 'Favorited' : 'Favorite'}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Open in Google Maps */}

              {/* Products */}
              <Text style={[styles.sheetSubTitle, { marginTop: 16 }]}>
                Products
              </Text>

              {!selectedStore?.products ||
              selectedStore.products.length === 0 ? (
                <Text style={{ color: '#6b7280' }}>No products listed.</Text>
              ) : (
                selectedStore.products.map((item, index) => {
                  const key =
                    typeof keyExtractorProduct === 'function'
                      ? keyExtractorProduct(item)
                      : item.id ?? String(index);

                  return <View key={key}>{renderProduct({ item })}</View>;
                })
              )}

              {/* Bottom padding so last item doesn't hide behind safe area */}
              <View style={{ height: 8 }} />
            </ScrollView>

            {/* Footer (fixed) */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeBottomSheet}
              activeOpacity={0.9}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Styles
////////////////////////////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  // merge into your StyleSheet
  modal: {
    margin: 0, // full-width
    justifyContent: 'flex-end', // bottom sheet
  },

  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    maxHeight: '80%', // 👈 critical: bound height so ScrollView can scroll
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },

  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  scroll: {
    // occupies remaining space inside sheet
    maxHeight: '100%',
  },

  scrollInner: {
    paddingBottom: 8,
    rowGap: 10, // RN 0.73+; if not supported, replace with margins
  },

  imageRow: {
    flexDirection: 'row',
    gap: 8, // if not supported, add marginRight to first image
  },

  sheetImage: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },

  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  sheetLabel: {
    color: '#6B7280',
    fontSize: 14,
  },

  sheetValue: {
    color: '#111827',
    fontSize: 14,

    textAlign: 'right',
  },

  link: {
    textDecorationLine: 'underline',
    color: '#2563eb',
  },

  mapsButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
  },

  mapsButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  sheetSubTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
  },

  cancelText: {
    color: 'white',
    fontWeight: '700',
  },

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
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    width: PIN_SIZE - 6,
    height: PIN_SIZE - 6,
    borderRadius: (PIN_SIZE - 6) / 2,
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
  searchPin: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
  },
  searchPinOuter: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: 'rgba(37, 99, 235, 0.2)', // soft blue halo
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPinInner: {
    width: PIN_SIZE - 6,
    height: PIN_SIZE - 6,
    borderRadius: (PIN_SIZE - 6) / 2,
    backgroundColor: '#2563eb', // solid blue dot
    borderWidth: 1,
    borderColor: 'white',
  },
});
