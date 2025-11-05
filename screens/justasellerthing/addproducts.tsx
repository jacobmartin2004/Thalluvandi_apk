import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Navbar from '../../component/navbar';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import fetchstoredetails from '../../utils/fetching/fetchstoredetails';
import Colors from '../../theme/colorpallete';

type ProductInDoc = {
  id: string;
  name: string;
  price: number;
  description?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
};

// What you send in an update:
type NewProductPayload = {
  id: string;
  name: string;
  price: number;
  description?: string;
  createdAt: FirebaseFirestoreTypes.FieldValue; // serverTimestamp() for writes
};

const Addproducts = () => {
  const { stores, loading } = fetchstoredetails();

  // form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState(''); // keep as string for input
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const store = stores?.[0]; // use first store for now
  const products: ProductInDoc[] = Array.isArray(store?.products)
    ? store.products
    : [];

  const addProduct = async () => {
    if (!store) {
      Alert.alert('No store', 'You have no store to add products to.');
      return;
    }
    const trimmedName = name.trim();
    const p = parseFloat(price);
    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a product name.');
      return;
    }
    if (Number.isNaN(p) || p < 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }

    setSaving(true);
    try {
      const newProduct = {
        id: `${Date.now()}`,
        name: name.trim(),
        price: parseFloat(price),
        description: description.trim() || undefined,
        createdAtMillis: Date.now(), // ✅ plain number
      };
      

      await firestore()
        .collection('store')
        .doc(store.id)
        .update({
          products: firestore.FieldValue.arrayUnion(newProduct),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // clear form
      setName('');
      setPrice('');
      setDescription('');
    } catch (e: any) {
      console.log('addProduct error:', e);
      Alert.alert('Failed to add', e?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  // optional: remove product (arrayRemove must match the exact object)
  const removeProduct = async (prod: ProductInDoc) => {
    await firestore()
      .collection('store')
      .doc(store.id)
      .update({
        products: firestore.FieldValue.arrayRemove(prod),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  };

  if (loading) {
    return (
      <>
        <Navbar name="Add Products" />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Loading store…</Text>
        </View>
      </>
    );
  }

  if (!store) {
    return (
      <>
        <Navbar name="Add Products" />
        <View style={styles.center}>
          <Text>No store found. Create a store first.</Text>
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Navbar name="Add Products" />
      <View style={styles.container}>
        <Text style={styles.title}>
          Add a product to: {store.shopName || 'Your Store'}
        </Text>

        <TextInput
          placeholder="Enter product name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor={Colors.placeholdercolor}
        />
        <TextInput
          placeholder="Enter product price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={Colors.placeholdercolor}

        />
        <TextInput
          placeholder="Enter product description"
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.input, { minHeight: 80 }]}
          placeholderTextColor={Colors.placeholdercolor}

        />

        <View style={{ marginTop: 8 }}>
          {saving ? (
            <View style={styles.row}>
              <ActivityIndicator />
              <Text style={{ marginLeft: 8 }}>Saving…</Text>
            </View>
          ) : (
            <Button title="Add +" onPress={addProduct} />
          )}
        </View>

        <Text style={[styles.title, { marginTop: 20 }]}>Products</Text>

        {products.length === 0 ? (
          <Text style={{ color: '#555' }}>No products yet.</Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>
                  ₹ {item.price.toFixed(2)}
                </Text>
                {item.description ? (
                  <Text style={styles.cardBody}>{item.description}</Text>
                ) : null}
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Remove"
                    color="#c0392b"
                    onPress={() => removeProduct(item)}
                  />
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default Addproducts;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, flex: 1 },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 10 },
  input: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    color: "black",
    borderWidth: 1,
    borderColor: "black",
    
    
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  cardSubtitle: { color: '#111', marginTop: 2 },
  cardBody: { color: '#374151', marginTop: 6 },
});
