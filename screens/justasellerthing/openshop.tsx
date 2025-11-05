import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Navbar from '../../component/navbar';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Colors from '../../theme/colorpallete';
import { useNavigation } from '@react-navigation/native';
import { confirmAndDeleteShop } from '../../utils/openshopfunctions/deleteshop';
import { useCurrentLocation } from '../../component/locationtaker';

type Store = {
  id: string;
  UID: string; // ← make required
  shopName?: string;
  shopAddress?: string;
  storefrontUrl?: string;
  ownerName?: string;
  ownerPhone?: string;
  shopstatus?: boolean;
  openshop?: boolean;
  ownerPhotoUrl?: string;
};

const Openshop = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const { location, error } = useCurrentLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const currentUser = auth().currentUser;
  const nav = useNavigation();
  const uid = currentUser?.uid;
  const userEmail = currentUser?.email;

  const fetchStoresOnce = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('store')
        .where('UID', '==', uid)
        .get();

      const data: Store[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Store, 'id'>),
      }));

      setStores(data);
    } catch (error) {
      console.log('Something went wrong:', error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Realtime subscription for this user's stores


useEffect(() => {
  if (location) {
    console.log('Current location: jacob', location.latitude, location.longitude);
  }
  if (error) {
    console.log('Location error:', error);
  }
}, [location, error]);

  useEffect(() => {
   
    
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = firestore()
      .collection('store')
      .where('UID', '==', uid)
      .onSnapshot(
        snap => {
          const data: Store[] = snap.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Store, 'id'>),
          }));
          setStores(data);
          setLoading(false);
        },
        err => {
          console.log('onSnapshot error:', err);
          setLoading(false);
        },
      );

    return () => unsub();
  }, [uid]);

  // Pull to refresh (forces one-off fetch)
  const onRefresh = useCallback(async () => {
    if (!uid) return;
    setRefreshing(true);
    try {
      await fetchStoresOnce();
    } finally {
      setRefreshing(false);
    }
  }, [uid, fetchStoresOnce]);

  const toggleShopStatus = async (store: Store, nextVal: boolean) => {
    try {
      setUpdating(prev => ({ ...prev, [store.id]: true }));
      // Optimistic update
      setStores(prev =>
        prev.map(s => (s.id === store.id ? { ...s, shopstatus: nextVal } : s)),
      );

      await firestore().collection('store').doc(store.id).update({
        latitude: location?.latitude,
        longitude: location?.longitude,
        shopstatus: nextVal,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.log('Failed to update shopstatus:', e);
      // Revert optimistic change
      setStores(prev =>
        prev.map(s => (s.id === store.id ? { ...s, shopstatus: !nextVal } : s)),
      );
    } finally {
      setUpdating(prev => ({ ...prev, [store.id]: false }));
    }
  };

  const renderOwnerAvatar = (name?: string) => {
    const initial = (name?.trim()?.[0] || '?').toUpperCase();
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
    );
  };

  const headerSubtitle = useMemo(() => {
    if (!uid) return 'Sign in to view your stores';
    if (stores.length === 0) return 'No stores linked to your account yet';
    return `${stores.length} ${stores.length === 1 ? 'store' : 'stores'} found`;
  }, [uid, stores.length]);

  if (!currentUser) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>You’re not signed in</Text>
        <Text style={styles.emptySubtitle}>
          Please log in to manage your shop status.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading stores…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar name="Open Shop" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {stores.length > 0 ? (
          stores.map(store => {
            const isOpen =
              typeof store.shopstatus === 'boolean'
                ? store.shopstatus
                : !!store.openshop; // legacy read
            const busy = !!updating[store.id];

            return (
              <View key={store.id} style={styles.card}>
                <Image
                  source={{ uri: store.storefrontUrl }}
                  style={styles.image1}
                />

                {/* Header row: avatar + name + status pill */}
                <View style={styles.cardHeader}>
                  <View style={styles.ownerRow}>
                    {renderOwnerAvatar(store.ownerName)}
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.shopName}>
                        {store.shopName || 'Unnamed Shop'}
                      </Text>
                      <Text style={styles.ownerName} numberOfLines={1}>
                        Shop owner: {store.ownerName || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isOpen ? styles.open : styles.closed,
                    ]}
                  >
                    <Text style={styles.statusPillText}>
                      {isOpen ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>

                {/* Image */}
                {store.storefrontUrl ? (
                  <Image
                    source={{ uri: store.ownerPhotoUrl }}
                    style={styles.image}
                  />
                ) : (
                  <View style={[styles.image, styles.placeholder]}>
                    <Text style={styles.placeholderText}>
                      No storefront photo
                    </Text>
                  </View>
                )}

                {/* Address */}
                <View style={styles.row}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.value} numberOfLines={2}>
                    {store.shopAddress || 'No address available'}
                  </Text>
                </View>

                {/* Phone + actions */}
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={[styles.value, styles.link]} numberOfLines={1}>
                      {store.ownerPhone || 'N/A'}
                    </Text>
                  </View>

                  {/* {store.ownerPhone ? (
                    <TouchableOpacity
                      style={styles.ctaButton}
                      onPress={() => Linking.openURL(`tel:${store.ownerPhone}`)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.ctaButtonText}>Call Owner</Text>
                    </TouchableOpacity>
                  ) : null} */}
                </View>

                {/* Switch control */}
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchTitle}>Shop Status</Text>
                    <Text style={styles.switchSubtitle}>
                      Turn on to set this shop as open
                    </Text>
                  </View>
                  <View style={styles.switchWrap}>
                    {busy ? (
                      <ActivityIndicator />
                    ) : (
                      <Switch
                        value={isOpen}
                        onValueChange={next => toggleShopStatus(store, next)}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No stores found</Text>
            <Text style={styles.emptySubtitle}>
              Link a store to your account to manage its status here.
            </Text>
          </View>
        )}
      </ScrollView>
      {stores.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.yellow,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 8,
              width: '40%',
              marginBottom: 10,
            }}
            onPress={() => {
              nav.navigate('Editshop' as never);
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
              Edit Shop
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.alert,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 8,
              width: '40%',
              marginBottom: 10,
            }}
            onPress={() => {
              if (stores.length === 0) return;
              const first = stores[0];
              confirmAndDeleteShop(first, () => {
                setStores(prev => prev.filter(s => s.id !== first.id));
              });
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
              Delete Shop
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Openshop;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff' }, // slate-900
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellow,
    borderRadius: 40,
    marginTop: '10%',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000000ff' }, // slate-50
  headerSubtitle: { color: '#000000ff', marginTop: 2 }, // slate-400
  ownerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#111827', // gray-900
    borderWidth: 1,
    borderColor: '#1f2937', // gray-800
    maxWidth: '60%',
  },
  ownerChipTop: { color: '#e5e7eb', fontSize: 12 },
  ownerChipBottom: { color: '#9ca3af', fontSize: 12, marginTop: 2 },

  scroll: { padding: 16, paddingBottom: 32 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },

  card: {
    // backgroundColor: Colors.grey, // gray-900
    // borderRadius: 16,
    // padding: 14,
    // marginBottom: 16,
    // borderWidth: 1,
    borderColor: '#1f2937', // gray-800
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },

  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#e5e7eb', fontWeight: '700', fontSize: 16 },

  shopName: { fontSize: 18, fontWeight: '800', color: '#000000ff' },
  ownerName: { color: '#000000ff', marginTop: 2 },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: { fontWeight: '700', color: '#0b1220' },
  open: { backgroundColor: '#86efac', borderColor: '#16a34a' }, // green
  closed: { backgroundColor: '#fecaca', borderColor: '#ef4444' }, // red

  image: {
    width: '100%',
    height: 200,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#0b1220',
  },
  image1: {
    width: '100%',
    height: 180,
    borderRadius: 5,
    marginBottom: 12,
    backgroundColor: '#0b1220',
  },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#000000ff' },

  row: { marginBottom: 12 },
  rowBetween: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  label: { color: '#000000ff', fontSize: 19, marginBottom: 4, fontWeight: "bold"},
  value: { color: '#000000ff', fontSize: 15, },
  link: { textDecorationLine: 'underline' },

  ctaButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
  },
  ctaButtonText: { color: '#ffffffff', fontWeight: '700' },

  switchRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#010101ff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchTitle: { color: '#000000ff', fontWeight: '700' },
  switchSubtitle: { color: '#000000ff', fontSize: 14, marginTop: 2 },
  switchWrap: { paddingLeft: 12 },

  empty: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { color: '#000000ff', fontSize: 18, fontWeight: '800' },
  emptySubtitle: {
    color: '#000000ff',
    marginTop: 6,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
});
