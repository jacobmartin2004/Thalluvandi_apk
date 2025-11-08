import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { BannerAdView } from '../../ads/bannerads';
import Navbar from '../../component/navbar';

type FavItem = {
  id: string; // Firestore doc id
  userId: string;
  storeId: string;
  storeName: string;
  latitude: number;
  longitude: number;
  ownerNumber?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
};

const FAV_COL = firestore().collection('fav');

const Favourites = () => {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const unsubRef = useRef<(() => void) | null>(null);

  // Track auth state (important if user signs in after mount)
  useEffect(() => {
    const off = auth().onAuthStateChanged(user => {
      setUid(user?.uid ?? null);
    });
    return () => off();
  }, []);

  // Helper: map snapshot docs to FavItem[]
  const mapDocs = useCallback((snap: FirebaseFirestoreTypes.QuerySnapshot) => {
    const next: FavItem[] = [];
    snap.forEach(doc => {
      const d = doc.data() as any;
      next.push({
        id: doc.id,
        userId: d.userId,
        storeId: d.storeId,
        storeName: d.storeName ?? '',
        latitude: Number(d.latitude) || 0,
        longitude: Number(d.longitude) || 0,
        ownerNumber: d.ownerNumber ?? '',
        createdAt: d.createdAt ?? null,
      });
    });

    // If some docs don't have createdAt yet, sort them client-side (nulls last)
    next.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? -1;
      const tb = b.createdAt?.toMillis?.() ?? -1;
      return tb - ta;
    });

    return next;
  }, []);

  // Live query for user's favorites
  useEffect(() => {
    // Clean up previous listener if uid changes
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!uid) {
      setFavs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const query = FAV_COL.where('userId', '==', uid).orderBy(
      'createdAt',
      'desc',
    );

    const unsub = query.onSnapshot(
      snap => {
        const next = mapDocs(snap);
        setFavs(next);
        setLoading(false);
      },
      err => {
        console.log('[fav] snapshot error:', err);
        // Fallback: try without orderBy if index/field missing
        FAV_COL.where('userId', '==', uid)
          .get()
          .then(s => setFavs(mapDocs(s)))
          .catch(e => console.log('[fav] fallback get error:', e))
          .finally(() => setLoading(false));
      },
    );

    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [uid, mapDocs]);

  // Pull-to-refresh: one-off fetch
  const onRefresh = useCallback(async () => {
    if (!uid) return;
    try {
      setRefreshing(true);
      const snap = await FAV_COL.where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      setFavs(mapDocs(snap));
    } catch (e) {
      console.log('[fav] refresh error:', e);
      try {
        // Fallback without orderBy
        const snap2 = await FAV_COL.where('userId', '==', uid).get();
        setFavs(mapDocs(snap2));
      } catch (e2) {
        console.log('[fav] refresh fallback error:', e2);
        Alert.alert('Error', 'Could not refresh favourites.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [uid, mapDocs]);

  const openInGoogleMaps = useCallback(
    async (lat: number, lon: number, name?: string) => {
      const label = encodeURIComponent(name || 'Location');
      const appUrl = `comgooglemaps://?q=${lat},${lon}(${label})`;
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      try {
        const can = await Linking.canOpenURL(appUrl);
        await Linking.openURL(can ? appUrl : webUrl);
      } catch {
        Linking.openURL(webUrl);
      }
    },
    [],
  );

  const removeFavorite = useCallback(
    async (item: FavItem) => {
      if (!uid) {
        Alert.alert('Sign in required', 'Please sign in to modify favorites.');
        return;
      }
      try {
        // Delete by actual Firestore doc id
        await FAV_COL.doc(item.id).delete();

        // Optional optimistic UI
        setFavs(prev => prev.filter(f => f.id !== item.id));
      } catch (e) {
        console.log('[fav] delete error:', e);
        Alert.alert('Error', 'Could not remove favorite. Please try again.');
      }
    },
    [uid],
  );

  const renderItem = useCallback(
    ({ item }: { item: FavItem }) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {item.storeName || 'Unnamed Shop'}
          </Text>
          <TouchableOpacity
            onPress={() => removeFavorite(item)}
            style={styles.heartBtn}
            activeOpacity={0.8}
          >
            <Icon name="heart" size={22} color="red" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Owner Phone</Text>
          <TouchableOpacity
            onPress={async () => {
              if (!item.ownerNumber) return;
              const url = `tel:${item.ownerNumber}`;
              const can = await Linking.canOpenURL(url);
              if (can) Linking.openURL(url);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.value, styles.link]}>
              {item.ownerNumber || 'N/A'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              openInGoogleMaps(item.latitude, item.longitude, item.storeName)
            }
            activeOpacity={0.9}
          >
            <Icon
              name="map"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.btnText}>Open in Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnDanger]}
            onPress={() => removeFavorite(item)}
            activeOpacity={0.9}
          >
            <Icon
              name="trash"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.btnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [openInGoogleMaps, removeFavorite],
  );

  const keyExtractor = useCallback((x: FavItem) => x.id, []);

  const listEmpty = useMemo(() => {
    if (loading) return null;
    if (!uid)
      return (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>
            Please sign in to view your favourites.
          </Text>
        </View>
      );
    return (
      <View style={styles.centerBox}>
        <Text style={styles.emptyText}>No favourites yet.</Text>
        <Text style={styles.emptySubText}>
          Tap the heart on a store to add it here.
        </Text>
      </View>
    );
  }, [loading, uid]);

  return (
    <SafeAreaView style={styles.container}>
      <Navbar name="Favorites" />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={favs}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={
            favs.length === 0 ? { flex: 1 } : { padding: 12 }
          }
          ListEmptyComponent={listEmpty}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      <BannerAdView />
    </SafeAreaView>
  );
};

export default Favourites;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  heartBtn: { padding: 6 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: { color: '#000000ff', fontSize: 17, fontWeight: 'bold' },
  value: {
    color: '#111827',
    fontSize: 17,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  link: { textDecorationLine: 'underline', color: '#2563eb' },

  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnDanger: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '600' },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  emptySubText: { color: '#64748b', marginTop: 4 },
});
