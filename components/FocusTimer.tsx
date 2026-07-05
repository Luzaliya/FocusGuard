import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { saveFocusSession } from "@/services/focusService";

const DEFAULT_TIME = 25 * 60;

export default function FocusTimer() {
  const [seconds, setSeconds] = useState(DEFAULT_TIME);
  const [running, setRunning] = useState(false);

  useEffect(() => {
  let interval: NodeJS.Timeout;

  if (running && seconds > 0) {
    interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
  }

  if (running && seconds === 0) {
    setRunning(false);

    saveFocusSession(25);

    alert("🎉 Focus session completed!");
  }

  return () => clearInterval(interval);
}, [running, seconds]);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Focus Session</Text>

      <Text style={styles.timer}>
        {String(minutes).padStart(2, "0")}:
        {String(secs).padStart(2, "0")}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setRunning(!running)}
      >
        <Text style={styles.buttonText}>
          {running ? "Pause" : "Start"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setRunning(false);
          setSeconds(DEFAULT_TIME);
        }}
      >
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 25,
    marginTop: 25,
    alignItems: "center",
    elevation: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.text,
  },

  timer: {
    fontSize: 60,
    fontWeight: "bold",
    color: Colors.primary,
    marginVertical: 25,
  },

  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 15,
  },

  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  resetButton: {
    marginTop: 15,
  },

  resetText: {
    color: Colors.danger,
    fontWeight: "bold",
    fontSize: 18,
  },
});