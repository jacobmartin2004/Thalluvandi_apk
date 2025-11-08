import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  Asset,
  ImageLibraryOptions,
} from 'react-native-image-picker';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Navbar from '../../component/navbar';
import Colors from '../../theme/colorpallete';
import { useNavigation } from '@react-navigation/native';

// ✅ import your signed Cloudinary function
import { uploadToCloudinarySigned } from '../../cloudinary/uploadtocloudinary';

type Img = { uri: string } | null;

export default function ShopForm() {
  const navigation = useNavigation();
  const [shopName, setShopName] = useState('');
  const [isshop, setisshop] = useState<boolean>(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');

  const [ownerPhoto, setOwnerPhoto] = useState<Img>(null);
  const [storefrontImage, setStorefrontImage] = useState<Img>(null);

  const [submitting, setSubmitting] = useState(false);

  // Sign in anonymously (dev) so Firestore rules can require auth.
  useEffect(() => {
    const ensureAuth = async () => {
      try {
        if (!auth().currentUser) {
          await auth().signInAnonymously();
        }
      } catch (e) {
        console.warn('Auth error:', e);
      }
    };
    ensureAuth();
  }, []);

  // Gallery options with compression
  const libOpts: ImageLibraryOptions = {
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 0.8 as ImageLibraryOptions['quality'],
    maxWidth: 1280,
    maxHeight: 1280,
    includeExtra: true,
  };

  const extract = (assets?: Asset[]) => {
    if (!assets || assets.length === 0) return null;
    const a = assets[0];
    return a.uri ? { uri: a.uri } : null;
  };

  const pickFromGallery = async (setter: (img: Img) => void) => {
    const res = await launchImageLibrary(libOpts);
    if (!res.didCancel && !res.errorCode) setter(extract(res.assets));
  };

  const onSubmit = async () => {
    try {
      if (!shopName || !ownerName || !ownerPhone || !shopAddress) {
        Alert.alert('Missing fields', 'Please fill all text fields.');
        return;
      }
      if (!ownerPhoto || !storefrontImage) {
        Alert.alert(
          'Images missing',
          'Please pick both Owner Photo and Storefront Image.',
        );
        return;
      }

      setSubmitting(true);

      // Pre-create Firestore doc in 'store' collection
      const docRef = firestore().collection('store').doc();
      const shopId = docRef.id;
      const folder = `shops/${shopId}`;

      // Upload both images to Cloudinary (parallel)
      const [ownerPhotoUrl, storefrontUrl] = await Promise.all([
        uploadToCloudinarySigned(ownerPhoto.uri!, {
          folder,
          fileName: `owner_${Date.now()}.jpg`,
        }),
        uploadToCloudinarySigned(storefrontImage.uri!, {
          folder,
          fileName: `storefront_${Date.now()}.jpg`,
        }),
      ]);

      const currentUser = auth().currentUser;

      const payload = {
        UID: currentUser?.uid,
        shopId,
        shopName,
        ownerName,
        ownerPhone,
        shopAddress,
        ownerPhotoUrl,
        storefrontUrl,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await docRef.set(payload);

      console.log('Saved ->', payload);
      Alert.alert(
        'Success',
        'Saved to Firestore (collection: store) with Cloudinary URLs.',
      );
      navigation.navigate('Main' as never);

      // Reset UI
      setShopName('');
      setOwnerName('');
      setOwnerPhone('');
      setShopAddress('');
      setOwnerPhoto(null);
      setStorefrontImage(null);
    } catch (e: any) {
      console.error('Submit error:', e);
      Alert.alert('Error', e?.message ?? 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const checkShopExists = async () => {
    console.log('checking user');

    const currentUser = auth().currentUser;

    if (!currentUser) {
      console.log('No user is logged in');
      return;
    }

    const uid = currentUser.uid;

    try {
      const storeRef = firestore().collection('store');
      const querySnapshot = await storeRef.where('UID', '==', uid).get();

      if (!querySnapshot.empty) {
        console.log('Shop already added');
        setisshop(true);
        Alert.alert(
          'Notice',
          'Shop already added',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main' as never),
            },
          ],
          { cancelable: false },
        );
      } else {
        console.log('No store present');
      }
    } catch (error) {
      console.error('Error checking shop:', error);
      return 'Error occurred';
    }
  };

  useEffect(() => {
    checkShopExists();
  }, []);

  return (
    <>
      <Navbar name="Add shop" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <Text style={{ fontSize: 22, fontWeight: '600' }}>Shop Details</Text>

          <Field label="Shop Name">
            <Input
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g., Shree Ganesh Stores"
            />
          </Field>

          <Field label="Owner Name">
            <Input
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="e.g., Ramesh Kumar"
            />
          </Field>

          <Field label="Owner Phone Number">
            <Input
              value={ownerPhone}
              onChangeText={setOwnerPhone}
              placeholder="e.g., 9876543210"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </Field>

          <Field label="Shop Address">
            <Input
              value={shopAddress}
              onChangeText={setShopAddress}
              placeholder="Street, Area, City, PIN"
              multiline
              numberOfLines={3}
            />
          </Field>

          <Field label="Owner Photo">
            <ImageRow
              image={ownerPhoto?.uri}
              onPick={() => pickFromGallery(setOwnerPhoto)}
            />
          </Field>

          <Field label="Storefront Image">
            <ImageRow
              image={storefrontImage?.uri}
              onPick={() => pickFromGallery(setStorefrontImage)}
            />
          </Field>

          <TouchableOpacity
            onPress={onSubmit}
            disabled={submitting || isshop}
            style={{
              backgroundColor: submitting ? '#93c5fd' : '#0ea5e9',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                {isshop ? 'Already Registered' : 'Register'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

/* ---------- Small UI helpers ---------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 16, color: '#334155', fontWeight: 'bold' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      style={{
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'white',
        fontSize: 15,
      }}
      placeholderTextColor="#94a3b8"
    />
  );
}

function ImageRow({ image, onPick }: { image?: string; onPick: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text
            style={{
              fontSize: 10,
              color: '#94a3b8',
              padding: 6,
              textAlign: 'center',
            }}
          >
            No Image
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onPick}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: '#f1f5f9',
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            color: '#0f172a',
            fontWeight: '600',
            backgroundColor: Colors.grey,
            padding: 10,
            borderRadius: 20,
          }}
        >
          Pick from Gallery
        </Text>
      </TouchableOpacity>
    </View>
  );
}
