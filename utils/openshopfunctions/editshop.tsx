import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../component/navbar';
import fetchstoredetails from '../fetching/fetchstoredetails';
import { TextInput, ScrollView } from 'react-native-gesture-handler';
import Colors from '../../theme/colorpallete';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';

// ✅ your signed uploader must forward+sign: public_id, overwrite, invalidate, timestamp, api_key
import { uploadToCloudinarySigned } from '../../cloudinary/uploadtocloudinary';

type EditableImage = {
  url: string;      // remote or local uri for preview
  isLocal: boolean; // true if user just picked (needs upload)
  mime?: string;
};

const emptyImg: EditableImage = { url: '', isLocal: false };

const Editshop = () => {
  const currentUser = auth().currentUser;

  const [shopName, setShopName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [ownerPhoto, setOwnerPhoto] = useState<EditableImage>(emptyImg);
  const [storefront, setStorefront] = useState<EditableImage>(emptyImg);

  const [saving, setSaving] = useState(false);
  const { stores, loading } = fetchstoredetails();
  const nav = useNavigation();

  useEffect(() => {
    if (stores && stores.length > 0) {
      const s: any = stores[0];

      setShopName(s.shopName || '');
      setOwnerName(s.ownerName || '');
      setContactNumber(s.ownerPhone || '');
      setAddress(s.shopAddress || '');

      setOwnerPhoto({ url: s.ownerPhotoUrl || '', isLocal: false });
      setStorefront({ url: s.storefrontUrl || '', isLocal: false });
    }
  }, [stores]);

  const pickImage = async (setter: (img: EditableImage) => void) => {
    const opts: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
      quality: 0.9,
    };
    const res = await launchImageLibrary(opts);
    if (res.didCancel) return;
    if (res.errorCode) {
      Alert.alert('Image Picker Error', res.errorMessage || res.errorCode);
      return;
    }
    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    setter({
      url: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
      isLocal: true,
      mime: asset.type || 'image/jpeg',
    });
  };

  const canSave = useMemo(() => {
    return !!stores && !!shopName?.trim() && !!ownerName?.trim();
  }, [stores, shopName, ownerName]);

  /** Upload to a FIXED public_id with overwrite+invalidate, return fresh secure_url */
  const uploadFixed = async (
    localUri: string,
    publicId: string,
    mime?: string,
  ): Promise<string> => {
    const secureUrl = await uploadToCloudinarySigned(localUri, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      mime,
    } as any);
    return secureUrl; // should include a new version (v########)
  };

  const onSave = async () => {
    if (!currentUser) {
      Alert.alert('Not signed in', 'Please sign in to update shop details.');
      return;
    }
    if (!stores || stores.length === 0) {
      Alert.alert('No store', 'No store found to update.');
      return;
    }
    if (!canSave) {
      Alert.alert('Missing fields', 'Shop name and owner name are required.');
      return;
    }

    try {
      setSaving(true);
      const storeId = (stores[0] as any).id;

      // Use consistent fixed IDs so we always overwrite the same asset
      const ownerFixedId = `shops/${currentUser.uid}/${storeId}/owner`;
      const storefrontFixedId = `shops/${currentUser.uid}/${storeId}/storefront`;

      let nextOwnerUrl = ownerPhoto.url;
      let nextStorefrontUrl = storefront.url;

      const uploads: Promise<void>[] = [];

      if (ownerPhoto.isLocal && ownerPhoto.url) {
        uploads.push(
          (async () => {
            nextOwnerUrl = await uploadFixed(ownerPhoto.url, ownerFixedId, ownerPhoto.mime);
          })(),
        );
      }

      if (storefront.isLocal && storefront.url) {
        uploads.push(
          (async () => {
            nextStorefrontUrl = await uploadFixed(storefront.url, storefrontFixedId, storefront.mime);
          })(),
        );
      }

      if (uploads.length) {
        await Promise.all(uploads);
      }

      await firestore().collection('store').doc(storeId).update({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: contactNumber.trim(),
        shopAddress: address.trim(),

        ownerPhotoUrl: nextOwnerUrl || firestore.FieldValue.delete(),
        storefrontUrl: nextStorefrontUrl || firestore.FieldValue.delete(),

        // Optional: persist fixed IDs for future reference
        ownerPhotoPublicId: ownerFixedId,
        storefrontPublicId: storefrontFixedId,

        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setOwnerPhoto({ url: nextOwnerUrl, isLocal: false });
      setStorefront({ url: nextStorefrontUrl, isLocal: false });

      Alert.alert('Success', 'Shop details updated.');
    } catch (e: any) {
      console.log('Save error:', e);
      Alert.alert('Failed to save', e?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <>
        <Navbar />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.yellow} />
        </View>
      </>
    );

  return (
    <>
      <Navbar name="Edit Shop" />
    <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Shop Details</Text>

        <TextInput
          style={styles.input}
          placeholder="Shop Name"
          value={shopName}
          onChangeText={setShopName}
          placeholderTextColor="#8f9bb3"
        />

        <TextInput
          style={styles.input}
          placeholder="Owner Name"
          value={ownerName}
          onChangeText={setOwnerName}
          placeholderTextColor="#8f9bb3"
        />

        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          keyboardType="phone-pad"
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholderTextColor="#8f9bb3"
        />

        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          placeholder="Address"
          multiline
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#8f9bb3"
        />

        {/* Images */}
        <View style={styles.imageRow}>
          <View style={styles.imageCol}>
            <Text style={styles.label}>Owner Photo</Text>
            <View style={styles.imageWrap}>
              {ownerPhoto.url ? (
                <Image source={{ uri: ownerPhoto.url }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.placeholderText}>No image</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => pickImage(setOwnerPhoto)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickBtnText}>
                  {ownerPhoto.isLocal ? 'Change (unsaved)' : 'Change'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.imageCol}>
            <Text style={styles.label}>Storefront</Text>
            <View style={styles.imageWrap}>
              {storefront.url ? (
                <Image source={{ uri: storefront.url }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.placeholderText}>No image</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => pickImage(setStorefront)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickBtnText}>
                  {storefront.isLocal ? 'Change (unsaved)' : 'Change'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {saving && (
          <View style={styles.savingRow}>
            <ActivityIndicator color={Colors.yellow} />
            <Text style={styles.savingText}>Uploading…</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!canSave || saving) && styles.saveBtnDisabled,
          ]}
          onPress={onSave}
          disabled={!canSave || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default Editshop;

// ------------------------------------
// Styles
// ------------------------------------
const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, backgroundColor: Colors.background },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.black,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.grey,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 16,
    color: Colors.black,
  },
  label: { color: Colors.black, marginBottom: 8, fontWeight: '600' },
  imageRow: { flexDirection: 'row', gap: 16 },
  imageCol: { flex: 1 },
  imageWrap: {},
  image: { width: '100%', height: 170, borderRadius: 10 },
  imagePlaceholder: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: '#6b7280' },
  pickBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
  },
  pickBtnText: { fontWeight: '700', color: '#111' },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  savingText: { color: Colors.black },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 14,
  },
  saveBtn: {
    backgroundColor: Colors.yellow,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontWeight: '700', fontSize: 16, color: 'black' },
});
