import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
  if (!name || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

 try {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  alert("Authentication successful");

  console.log("DB:", db);
  console.log("UID:", userCredential.user.uid);

  await setDoc(
    doc(db, "users", userCredential.user.uid),
    {
      fullName: name,
      email,
      createdAt: new Date().toISOString(),
    }
  );

  alert("Firestore successful");

  router.replace("/login");
} catch (error: any) {
  console.log(error);
  alert(error.message);
}
  };
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🛡️</Text>

      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.subtitle}>
        Join FocusGuard and improve your productivity.
      </Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Email Address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
  style={styles.button}
  onPress={handleRegister}
>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.loginText}>
          Already have an account? Login
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
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2563EB",
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginVertical: 15,
  },

  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },

  loginText: {
    textAlign: "center",
    marginTop: 25,
    color: "#2563EB",
  },
});