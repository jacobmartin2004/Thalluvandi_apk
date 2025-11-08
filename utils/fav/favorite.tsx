import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StoreDoc = {
  id: string;
  shopName?: string;
  ownerName?: string;
  ownerPhone?: string;
  latitude: number;
  longitude: number;
  shopstatus?: boolean;
  products?: any[];
  storefrontUrl?: string;
  ownerPhotoUrl?: string;
};

const favCol = firestore().collection('fav');

const favDocId = (uid: string, storeId: string) => `${uid}_${storeId}`;

const getUserId = async (): Promise<string> => {
  // Prefer Firebase Auth; fallback to any locally stored uid if you keep one
  const uid = auth().currentUser?.uid || (await AsyncStorage.getItem('uid'));
  if (!uid) throw new Error('NO_UID');
  return uid;
};

export const checkFavorite = async (storeId: string): Promise<boolean> => {
  const uid = await getUserId();
  const ref = favCol.doc(favDocId(uid, storeId));
  const snap = await ref.get();
  return snap.exists(); // ✅ must call it as a function
};


export const toggleFavorite = async (store: StoreDoc): Promise<boolean> => {
  const uid = await getUserId();
  const id = favDocId(uid, store.id);
  const ref = favCol.doc(id);
  const snap = await ref.get();

  if (snap.exists()) {
    await ref.delete();
    return false; // now not favorited
  }

  await ref.set({
    userId: uid,
    storeId: store.id,
    storeName: store.shopName ?? '',
    latitude: store.latitude,
    longitude: store.longitude,
    ownerNumber: store.ownerPhone ?? '',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return true; // now favorited
};
