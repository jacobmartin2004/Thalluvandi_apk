import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ExplanationContent from "../explanationcontent/explanationcontent";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  InitialPage: undefined;
  Login: undefined;
};

const ONBOARDING_KEY = "onboardingDoneV1";

type Props = NativeStackScreenProps<RootStackParamList, "InitialPage">;

const InitialPage: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (done) {
         navigation.replace("Login");
        
        
      } else {
       setShouldShowOnboarding(true);
      }
      setLoading(false);
    })();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return <View style={styles.container}>{shouldShowOnboarding ? <ExplanationContent /> : null}</View>;
};

export default InitialPage;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
