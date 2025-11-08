import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';

// ✅ TYPES (Must be at TOP)
export type StoreType = {
  shopName: string;
  ownerName: string;
  ownerPhone?: string;
};

export type Pin = {
  id: string;
  latitude: number;
  longitude: number;
  store: StoreType;
};

interface SearchProps {
  setlati: React.Dispatch<React.SetStateAction<number | null>>;
  setlong: React.Dispatch<React.SetStateAction<number | null>>;
}


const StoreSearchScreen = ({setlati, setlong}: SearchProps) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinsLoading, setPinsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Pin[]>([]);

  // ✅ FETCH DATA FROM FIRESTORE
  useEffect(() => {
    setPinsLoading(true);

    const unsub = firestore()
      .collection('store')
      .where('shopstatus', '==', true)
      .onSnapshot(
        snap => {
          const arr: Pin[] = [];

          snap.forEach(doc => {
            const d = doc.data() as any;

            if (
              typeof d.latitude === 'number' &&
              typeof d.longitude === 'number'
            ) {
              const pin: Pin = {
                id: doc.id,
                latitude: d.latitude,
                longitude: d.longitude,
                store: {
                  shopName: d.shopName || '',
                  ownerName: d.ownerName || '',
                  ownerPhone: d.ownerPhone,
                },
              };

              arr.push(pin);
            }
          });

          setPins(arr);
          setPinsLoading(false);
        },
        err => {
          console.log('Firestore error:', err);
          setPinsLoading(false);
        },
      );

    return () => unsub();
  }, []);

  // ✅ AUTOCOMPLETE SEARCH
  useEffect(() => {
    if (search.trim() === '') {
      setSuggestions([]);
      return;
    }

    const text = search.toLowerCase();

    const filtered = pins.filter(p => {
      const shop = p.store.shopName.toLowerCase();
      const owner = p.store.ownerName.toLowerCase();
      return shop.includes(text) || owner.includes(text);
    });

    setSuggestions(filtered);
  }, [search, pins]);

  // ✅ ON SELECT
  const handleSelect = (pin: Pin) => {
    console.log(
      'Selected shop →',
      pin.store.shopName,
      'LAT:',
      pin.latitude,
      'LNG:',
      pin.longitude,
    );

    setSearch(pin.store.shopName);
    setSuggestions([]);
    setlati(pin.latitude);
    setlong(pin.longitude);
  
  };

  return (
    <View style={{ paddingTop: 0 }}>
      {/* ✅ SEARCH BAR */}
      <View style={styles.searchContainer}>
        
          <Icon name="search-outline" size={22} color="#000" style={{marginLeft: 20}}/>
          <TextInput
            style={styles.searchInput}
            placeholder="Search shop or owner..."
            placeholderTextColor="#777"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity onPress={() => {setlati(null); setlong(null); setSearch('')}}>
          <Icon name="close-outline" size={22} color="#000" style={{marginRight: 20}}/>
          </TouchableOpacity>
        
      </View>

      {/* ✅ AUTOCOMPLETE DROPDOWN (ABSOLUTE) */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          <FlatList
            data={suggestions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.suggestionText}>
                  {item.store.shopName} — {item.store.ownerName}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

     
    </View>
  );
};

export default StoreSearchScreen;

// ✅ ✅ STYLES -------------------------------------------------------
const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 10,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },

  // ✅ ABSOLUTE DROPDOWN
  suggestionBox: {
    position: 'absolute',
    top: 70, // adjust if needed
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 8,
    maxHeight: 220,
    zIndex: 50,
    paddingVertical: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  suggestionText: {
    fontSize: 16,
    color: '#000',
  },
});
