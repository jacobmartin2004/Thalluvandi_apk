import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../../theme/colorpallete';

type Props = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  bgcolor?: string;
};

const SearchBar: React.FC<Props> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  bgcolor = '#fff',
}) => {
  return (
    <View style={[styles.container, { backgroundColor: bgcolor }]}>
      <Icon name="search-outline" size={22} color={Colors.black || '#666'} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#000',
  },
});
