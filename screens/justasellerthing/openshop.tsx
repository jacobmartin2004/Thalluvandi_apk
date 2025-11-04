import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import Navbar from '../../component/navbar';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const Openshop = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth().currentUser;

  const fetchStore = async () => {
    const uid = currentUser?.uid;
    try {
      const snapshot = await firestore()
        .collection('store')
        .where('UID', '==', uid)
        .get();

      const storesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStores(storesData);
    } catch (error) {
      console.log('Something went wrong:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar name="Open Shop" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {stores.length > 0 ? (
          stores.map((store) => (
            <View key={store.id} style={styles.card}>
              {store.storefrontUrl ? (
                <Image source={{ uri: store.storefrontUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholder]} />
              )}
              <Text style={styles.shopName}>{store.shopName || 'Unnamed Shop'}</Text>
              <Text style={styles.address}>{store.shopAddress || 'No address available'}</Text>
              <Text style={styles.owner}>Owner: {store.ownerName || 'N/A'}</Text>
              <Text style={styles.phone}>Phone: {store.ownerPhone || 'N/A'}</Text>
              <Text style={styles.status}>
                Status: {store.openshop ? '🟢 Open' : '🔴 Closed'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noStore}>No stores found for this user.</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default Openshop;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  address: {
    color: '#6b7280',
    marginVertical: 4,
  },
  owner: {
    color: '#374151',
  },
  phone: {
    color: '#1d4ed8',
    marginTop: 4,
  },
  status: {
    marginTop: 6,
    fontWeight: 'bold',
  },
  noStore: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 30,
  },
});
