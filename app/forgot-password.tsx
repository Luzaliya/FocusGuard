import React, { useState } from "react";
import {
  View,
 Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      <Text style={styles.subtitle}>
        Enter your email to receive a password reset link.
      </Text>

      <TextInput
        placeholder="Email Address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2563EB",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    marginVertical: 20,
    color: "#6B7280",
  },

  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  back: {
    textAlign: "center",
    marginTop: 25,
    color: "#2563EB",
  },
});