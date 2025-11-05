import { Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

type Store = {
  UID: string | undefined;
  id: string;
  shopName: string | undefined;
};
type MinimalStore = Pick<Store, 'id'> & { UID?: string; shopName?: string };
export async function confirmAndDeleteShop(
  store:  MinimalStore,
  onDeleted?: () => void,
) {
  const user = auth().currentUser;
  if (!user) {
    Alert.alert('Not signed in', 'Please sign in to delete a shop.');
    return;
  }
  if (store.UID !== user.uid) {
    Alert.alert('Permission denied', 'You can only delete your own shop.');
    return;
  }

  Alert.alert(
    'Delete shop?',
    `This will permanently delete “${
      store.shopName || 'this shop'
    }” from Firestore.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await firestore().collection('store').doc(store.id).delete();
            onDeleted?.();
            Alert.alert('Deleted', 'Shop has been deleted.');
          } catch (e: any) {
            console.error('Delete error:', e);
            Alert.alert('Failed to delete', e?.message || 'Unknown error');
          }
        },
      },
    ],
  );
}
