import { useNavigation } from "@react-navigation/native";
import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import Colors from "../../theme/colorpallete";

const Splash = () => {
    const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Image
       source={require('../../assest/splash.jpg')}
        style={styles.image}
        resizeMode="contain"
        onLoad={() => {
          setTimeout(() => {
            navigation.navigate("Login" as never)
          }, 1500);
        }}
      />

      <Text style={styles.version}>Version 1</Text>
      <Text style={styles.companyName}>
        Created By: Jacob Martin S 
      </Text>
      <Text style={styles.companyName}>
        (React Native Dev)
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.yellow,
  },
  image: {
    width: "70%",
    height: "70%",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
    marginTop: 5,
    textAlign: "center",
  },
  version: {
    fontSize: 14,
    color: "red",
    marginTop: 90,

    textAlign: "center",
  },
});

export default Splash;
