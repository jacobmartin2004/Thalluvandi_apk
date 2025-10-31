import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

type FeatureDoc = {
  imageurl1?: string;
  imageurl2?: string;
};

const DOC_PATH = { collection: 'dataandlink', doc: '6GdNE82YbCHYrABbHg61' };

const Modalcontent = () => {
  const [data, setData] = useState<FeatureDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) {
      setErrMsg('No user is logged in');
      setLoading(false);
      Alert.alert('No user is logged in');
      return;
    }

    try {
      setLoading(true);
      setErrMsg(null);

      const snap = await firestore()
        .collection(DOC_PATH.collection)
        .doc(DOC_PATH.doc)
        .get();

      if (!snap.exists) {
        setErrMsg('Document not found');
        setData(null);
      } else {
        const payload = (snap.data() || {}) as FeatureDoc;
        setData(payload);
        console.log('Fetched Firestore data:', payload);
      }
    } catch (e) {
      console.error('Firestore fetch error:', e);
      setErrMsg('Something went wrong while fetching data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Features</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : errMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errMsg}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 30 }}>
          {/* Image 1 */}
          {data?.imageurl1 ? (
            <TouchableOpacity activeOpacity={0.8}>
              <Image
                source={{ uri: data.imageurl1 }}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <Text style={styles.description}>Shop</Text>
            </TouchableOpacity>
          ) : (
            <Text>No Image 1 Found</Text>
          )}

          {/* Image 2 */}
          {data?.imageurl2 ? (
            <TouchableOpacity activeOpacity={0.8}>
              <Image
                source={{ uri: data.imageurl2 }}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <Text style={styles.description}>Customers</Text>
            </TouchableOpacity>
          ) : (
            <Text>No Image 2 Found</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default Modalcontent;

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  content: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '700',
  },
  featureImage: {
    width: 140,
    height: 140,
    marginBottom: 10,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorBox: {
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#c1121f',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryText: {
    color: '#333',
    fontWeight: '600',
  },
});
