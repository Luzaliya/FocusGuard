import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Colors from "@/constants/colors";
import { getFocusSessions } from "@/services/focusService";

export default function Analytics() {
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    const sessions = await getFocusSessions();

    setTotalSessions(sessions.length);

    const minutes = sessions.reduce(
      (sum: number, session: any) => sum + session.duration,
      0
    );

    setTotalMinutes(minutes);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Analytics</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Total Focus Sessions</Text>
        <Text style={styles.value}>{totalSessions}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Lifetime Focus Time</Text>
        <Text style={styles.value}>
          {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 20,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
  },

  label: {
    fontSize: 16,
    color: Colors.gray,
  },

  value: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 10,
  },
});