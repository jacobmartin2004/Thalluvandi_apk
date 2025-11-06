import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
} from 'react-native';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';

import Colors from '../../theme/colorpallete';
import { sendResetEmail } from '../../utils/profilepagefunctions/changepassword';
import fetchstoredetails from '../../utils/fetching/fetchstoredetails';

interface Userdatamain {
  name: string | null;
  email: string | null;
  photoUrl: string | null;
}

interface StoreProfile {
  ownerName: string;
  ownerPhone: string;
  shopName: string;
  shopstatus: boolean;
  ownerPhotoUrl?: string | null;
  storefrontUrl?: string | null;
}

const Fallbacks = {
  cover:
    'https://images.unsplash.com/photo-1503602642458-232111445657?w=1600&q=80&auto=format&fit=crop',
  avatar:
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=600&q=80&auto=format&fit=crop',
};

const Profile = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<Userdatamain | null>(null);

  // Your hook – assumed to return { stores: StoreProfile[] | StoreProfile | null, loading: boolean }
  const { stores, loading } = fetchstoredetails();

  // Normalize stores to an array
  const storeProfiles: StoreProfile[] = useMemo(() => {
    if (!stores) return [];
    return Array.isArray(stores)
      ? (stores as StoreProfile[])
      : [stores as StoreProfile];
  }, [stores]);

  const primary = storeProfiles[0]; // pick first store if multiple

  useEffect(() => {
    const firebaseAuth = getAuth();
    const unsubscribe = onAuthStateChanged(firebaseAuth, u => {
      if (u) {
        setUser({
          name: u.displayName,
          email: u.email,
          photoUrl: u.photoURL,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth()
      .signOut()
      .then(() => {
        Alert.alert('Logged out successfully');
        // @ts-expect-error - typing for navigate params
        navigation.navigate('Login');
      })
      .catch(error => Alert.alert('Error logging out', error.message));
  };

  const handleChangePassword = async () => {
    try {
      await sendResetEmail(user?.email || '');
      Alert.alert(
        'Password reset email sent',
        'Check your inbox for instructions.',
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to send reset email.');
    }
  };

  const coverUrl = primary?.storefrontUrl || Fallbacks.cover;
  const ownerAvatar =
    primary?.ownerPhotoUrl || user?.photoUrl || Fallbacks.avatar;

  const Title = primary?.shopName || 'Your Store';
  const OwnerName = primary?.ownerName || user?.name || 'Owner';
  const OwnerPhone = primary?.ownerPhone || '—';
  const SellerLabel =
    typeof primary?.shopstatus === 'boolean'
      ? primary?.shopstatus
        ? 'Yes'
        : 'No'
      : '—';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {/* Cover (storefront) */}
      <View style={styles.coverWrap}>
        <ImageBackground
          source={{ uri: coverUrl }}
          style={styles.cover}
          imageStyle={styles.coverImage}
          resizeMode="cover"
        >
          <View style={styles.coverOverlay} />
        </ImageBackground>

        {/* Floating Avatar */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: ownerAvatar }} style={styles.avatar} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopTitle} numberOfLines={1}>
              {Title}
            </Text>
            <Text style={styles.ownerText} numberOfLines={1}>
              {OwnerName}
            </Text>
            {!!user?.email && (
              <Text style={styles.emailText} numberOfLines={1}>
                {user.email}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Editshop' as never)}
          >
            <Icon name="edit" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Seller Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seller Details</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Owner Name</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {OwnerName}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Phone No</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {OwnerPhone}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Shop Name</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {Title}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Seller</Text>
            <Text style={styles.rowValue}>{SellerLabel}</Text>
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Other Options</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Editshop' as never)}
          >
            <Icon name="idcard" size={18} color={Colors?.black || '#222'} />
            <Text style={styles.actionText}>Edit Profile</Text>
            <Icon name="right" size={16} color="#999" style={styles.chev} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert('Update Photo', 'Hook up your photo picker')
            }
          >
            <Icon name="picture" size={18} color={Colors?.black || '#222'} />
            <Text style={styles.actionText}>Update Photo</Text>
            <Icon name="right" size={16} color="#999" style={styles.chev} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleChangePassword}
          >
            <Icon name="unlock" size={18} color={Colors?.black || '#222'} />
            <Text style={styles.actionText}>Change Password</Text>
            <Icon name="right" size={16} color="#999" style={styles.chev} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { marginBottom: 0 }]}
            onPress={() =>
              Alert.alert('Delete account', 'Wire this up to your flow')
            }
          >
            <Icon name="delete" size={18} color={'#c1121f'} />
            <Text style={[styles.actionText, { color: '#c1121f' }]}>
              Delete account
            </Text>
            <Icon name="right" size={16} color="#c1121f" style={styles.chev} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.9}
          style={styles.logoutBtn}
        >
          <Icon name="logout" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

export default Profile;

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.yellow, // slate-900
  },

  /* Cover */
  coverWrap: {
    width: '100%',
    height: 200,
    backgroundColor: '#111827',
  },
  cover: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  /* Floating avatar */
  avatarWrap: {
    position: 'absolute',
    bottom: 5, // overlaps the card below
    left: 24,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#0f172a',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },

  content: {
    paddingTop: 64, // to accommodate the floating avatar
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  /* Header Card */
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffffff', // gray-800
    padding: 16,
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
  },
  shopTitle: {
    color: '#000000ff',
    fontSize: 22,
    fontWeight: '800',
  },
  ownerText: {
    color: '#000000ff',
    fontSize: 16,
    marginTop: 2,
  },
  emailText: {
    color: '#000000ff',
    fontSize: 13,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Cards */
  card: {
    backgroundColor: '#ffffffff', // gray-900
    padding: 16,
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
  },
  cardTitle: {
    color: '#000000ff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },

  /* Seller details rows */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rowLabel: {
    flex: 0.5,
    color: '#000000ff',
    fontSize: 14,
  },
  rowValue: {
    flex: 0.5,
    color: '#000000ff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
  },
  loadingText: {
    color: '#000000ff',
  },

  /* Action list */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  actionText: {
    flex: 1,
    color: '#000000ff',
    fontSize: 15,
    fontWeight: '600',
  },
  chev: {
    opacity: 0.6,
  },

  /* Logout button */
  logoutBtn: {
    marginTop: 8,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
