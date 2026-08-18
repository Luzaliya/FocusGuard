import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Colors from "@/constants/colors";
import { getFocusSessions } from "@/services/focusService";
import { Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";

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

const chartData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      data: [25, 50, 75, 30, 60, 45, 20],
    },
  ],
};

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

<Text style={styles.sectionTitle}>This Week</Text>

<BarChart
  data={chartData}
  width={Dimensions.get("window").width - 40}
  height={220}
  fromZero
  yAxisLabel=""
  yAxisSuffix="m"
  chartConfig={{
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  }}
  style={{
    marginVertical: 16,
    borderRadius: 16,
  }}
/>

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

  sectionTitle: {
  fontSize: 20,
  fontWeight: "bold",
  color: Colors.text,
  marginTop: 20,
  marginBottom: 10,
},
});