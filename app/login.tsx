import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/services/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleLogin = async () => {
  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);

    alert("Login successful!");

    router.replace("/(tabs)");
  } catch (error: any) {
    switch (error.code) {
      case "auth/invalid-credential":
        alert("Invalid email or password.");
        break;

      case "auth/user-not-found":
        alert("User not found.");
        break;

      case "auth/wrong-password":
        alert("Incorrect password.");
        break;

      default:
        alert(error.message);
    }
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🛡️</Text>

      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.subtitle}>
        Sign in to continue using FocusGuard
      </Text>

      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#888"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={() => router.push("/forgot-password")}
      >
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.button}
  onPress={handleLogin}
>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/register")}
      >
        <Text style={styles.register}>
          Don't have an account? Create one
        </Text>
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

  logo: {
    fontSize: 60,
    textAlign: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2563EB",
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 10,
    marginBottom: 40,
    fontSize: 16,
  },

  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 16,
  },

  forgot: {
    textAlign: "right",
    color: "#2563EB",
    marginBottom: 25,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 12,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },

  register: {
    textAlign: "center",
    marginTop: 25,
    color: "#2563EB",
    fontSize: 15,
  },
});