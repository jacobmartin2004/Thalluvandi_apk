import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  InitialPage: undefined;
  Login: undefined;
};

const slides = [
  {
    id: 1,
    title: 'For Sellers',
    description: 'Register with OTP, pick category, add menu & hours.',
  },
  {
    id: 2,
    title: 'Sellers Insights',
    description: 'Go Live, plan routes, see peak hours & top areas.',
  },
  {
    id: 3,
    title: 'For Buyers',
    description: 'See nearby carts, filter by category, get alerts.',
  },
  {
    id: 4,
    title: 'Engage',
    description: 'Follow, rate, bookmark favorites & get notified.',
  },
];

const ONBOARDING_KEY = 'onboardingDoneV1';

const ExplanationContent: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // Mark onboarding as done and go to Login
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{slides[currentIndex].title}</Text>
      <Text style={styles.description}>{slides[currentIndex].description}</Text>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>

      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { opacity: i === currentIndex ? 1 : 0.4 }]}
          />
        ))}
      </View>
    </View>
  );
};

export default ExplanationContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#f39c12',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  dotsContainer: { flexDirection: 'row', marginTop: 20 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
    backgroundColor: 'white',
  },
});
