import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Navbar from '../../component/navbar';
import Colors from '../../theme/colorpallete';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useCurrentLocation } from '../../component/locationtaker';

type Store = {
  id: string;
  UID: string;
  shopName?: string;
  shopAddress?: string;
  shopstatus?: boolean;
  openshop?: boolean;
  sellerstatus?: boolean;
  latitude?: number;
  longitude?: number;
};

const Relocate = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [openAfterMove, setOpenAfterMove] = useState(true);

  const { location, error: locError } = useCurrentLocation();
  const currentUser = auth().currentUser;
  const uid = currentUser?.uid;

  // Load this user's first store (you can expand to list/select if you have multiples)
  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (!uid) {
      setLoading(false);
      return;
    }
    unsub = firestore()
      .collection('store')
      .where('UID', '==', uid)
      .limit(1)
      .onSnapshot(
        snap => {
          const first = snap.docs[0];
          if (first) {
            setStore({ id: first.id, ...(first.data() as Omit<Store, 'id'>) });
          } else {
            setStore(null);
          }
          setLoading(false);
        },
        err => {
          console.log('Relocate onSnapshot error:', err);
          setLoading(false);
        },
      );
    return () => unsub && unsub();
  }, [uid]);

  const coordText = useMemo(() => {
    if (!location) return 'Getting your current location…';
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }, [location]);

  const openInMaps = useCallback(() => {
    if (!location) return;
    const { latitude, longitude } = location;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open Maps');
    });
  }, [location]);

  const relocateHere = useCallback(async () => {
    if (!uid || !store) return;
    if (!location) {
      Alert.alert('Location not ready', 'Please wait for GPS fix and try again.');
      return;
    }

    try {
      setSaving(true);

      await firestore().collection('store').doc(store.id).update({
        latitude: location.latitude,
        longitude: location.longitude,
        // Save a free-form address/note the owner typed (optional)
        shopAddress: note?.trim() ? note.trim() : store.shopAddress ?? null,
        // Turn on statuses as requested
        shopstatus: openAfterMove ? true : store.shopstatus ?? false,
        sellerstatus: true,
        relocatedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Shop location updated and status set.');
    } catch (e) {
      console.log('Relocate error:', e);
      Alert.alert('Update failed', 'Could not update the shop. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [uid, store, location, note, openAfterMove]);

  if (!currentUser) {
    return (
     <>
     <Navbar name='Relocate' />
      <View style={styles.center}>
        <Text style={styles.centerTitle}>You’re not signed in</Text>
        <Text style={styles.centerSub}>Please log in to relocate your shop.</Text>
      </View>
     </>
    );
  }

  if (loading) {
    return (
      <>
      
     <Navbar name='Relocate' />

      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading your shop…</Text>
      </View>
      </>
    );
  }

  if (!store) {
    return (
      <>
      
     <Navbar name='Relocate' />

      <View style={styles.center}>
        <Text style={styles.centerTitle}>No store found</Text>
        <Text style={styles.centerSub}>Create or link a store first.</Text>
      </View>
      </>
    );
  }

  const isDisabled = !location || saving;

  return (
    <>
     
    
    <View style={styles.container}>
      <Navbar name="Relocate" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Relocate “{store.shopName || 'Your Shop'}”</Text>

          {/* GPS status row */}
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Current GPS</Text>
              <Text style={styles.value}>
                {coordText}
              </Text>
              {!!locError && (
                <Text style={[styles.value, { marginTop: 6 }]}>
                  Location error: {String(locError)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.pillBtn, isDisabled && styles.btnDisabled]}
              onPress={openInMaps}
              disabled={!location}
              activeOpacity={0.85}
            >
              <Text style={styles.pillBtnText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Address / note input */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>New Address / Note</Text>
            <TextInput
              placeholder="Type new address, landmark, floor, etc."
              placeholderTextColor="#6b7280"
              style={styles.input}
              value={note}
              onChangeText={setNote}
              multiline
            />
            <Text style={styles.hint}>
              Tip: If you keep this blank, we’ll keep your previous address but update the GPS.
            </Text>
          </View>

          {/* Open toggle mimic (simple 2-state button) */}
          <View style={[styles.rowBetween, { marginTop: 18 }]}>
            <Text style={styles.label}>Open after relocation</Text>
            <TouchableOpacity
              onPress={() => setOpenAfterMove(v => !v)}
              activeOpacity={0.85}
              style={[
                styles.badge,
                openAfterMove ? styles.badgeOn : styles.badgeOff,
              ]}
            >
              <Text style={styles.badgeText}>
                {openAfterMove ? 'Will be Open' : 'Keep Closed'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, isDisabled && styles.btnDisabled]}
            onPress={relocateHere}
            disabled={isDisabled}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.primaryBtnText}>
                Relocate Here & {openAfterMove ? 'Open Shop' : 'Save'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Info block */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              This will update your shop’s latitude & longitude to your current GPS, set
              <Text style={{ fontWeight: '700' }}> sellerstatus = true</Text>, and
              {openAfterMove ? ' open' : ' not open'} the shop. You can change status anytime from the Open Shop screen.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
    </>
  );
};

export default Relocate;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff' },
  scroll: { padding: 16, paddingBottom: 32 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerTitle: { fontSize: 20, fontWeight: '800', color: '#000' },
  centerSub: { color: '#111', marginTop: 6, paddingHorizontal: 24, textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  title: { fontSize: 20, fontWeight: '800', color: '#0b1220', marginBottom: 8 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  label: { color: '#000000ff', fontSize: 16, fontWeight: '700' },
  value: { color: '#000000ff', fontSize: 14, marginTop: 4 },

  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.yellow,
    borderRadius: 999,
  },
  pillBtnText: { color: '#000', fontWeight: '700' },

  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  hint: { fontSize: 12, color: '#374151', marginTop: 6 },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOn: { backgroundColor: '#86efac', borderColor: '#16a34a' },
  badgeOff: { backgroundColor: '#fecaca', borderColor: '#ef4444' },
  badgeText: { fontWeight: '700', color: '#0b1220' },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: Colors.yellow,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },

  btnDisabled: { opacity: 0.6 },

  infoBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoText: { color: '#111827', fontSize: 13, lineHeight: 18 },
});