// OnboardingGate.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  OnboardingGate: undefined;
  Initalpage: undefined;
  Login: undefined;
};

const OnboardingGate: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");
        if (hasOnboarded === "true") {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: "Initalpage" }] });
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [navigation]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return null; 
};

export default OnboardingGate;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
