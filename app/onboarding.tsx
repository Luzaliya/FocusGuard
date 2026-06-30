import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FocusGuard</Text>

      <Text style={styles.subtitle}>
        Reduce digital distractions, improve focus, and build better study
        habits.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 20,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 40,
    lineHeight: 28,
  },

  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 15,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});