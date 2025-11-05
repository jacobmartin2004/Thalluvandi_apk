import { StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type ProductInDoc = {
  id: string;
  name: string;
  price: number;
  description?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
};
type Store = {
  id: string;
  UID?: string;
  shopName?: string;
  shopAddress?: string;
  storefrontUrl?: string;
  ownerName?: string;
  ownerPhone?: string;
  shopstatus?: boolean; // canonical
  openshop?: boolean;
  ownerPhotoUrl?: string;
  products?: ProductInDoc[];
};
const fetchstoredetails = () => {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const currentUser = auth().currentUser;
  const uid = currentUser?.uid;

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

  useEffect(() => {
    fetchStoresOnce();
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
  return { stores, loading, refetch: fetchStoresOnce };
};

export default fetchstoredetails;
