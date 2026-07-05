import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import StatsCard from "@/components/StatsCard";
import Colors from "@/constants/colors";
import { useEffect, useState } from "react";
import { getCurrentUserProfile } from "@/services/userService";
import FocusTimer from "@/components/FocusTimer";
import { getFocusSessions } from "@/services/focusService";

export default function Home() {
  const [name, setName] = useState("User");
  const [focusMinutes, setFocusMinutes] = useState(0);
const [sessions, setSessions] = useState(0);

useEffect(() => {
  async function loadUser() {
    const profile = await getCurrentUserProfile();

    const data = await getFocusSessions();

setSessions(data.length);

const total = data.reduce(
  (sum: number, item: any) => sum + item.duration,
  0
);

setFocusMinutes(total);
    if (profile?.fullName) {
      setName(profile.fullName);
    }
  }

  loadUser();
}, []);
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.greeting}>👋 Good Afternoon</Text>

      <Text style={styles.name}>
  Welcome back, {name}
</Text>

      <View style={styles.row}>
        <StatsCard
  title="Today's Focus"
  value={`${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`}
/>
       <StatsCard
  title="Goal"
  value={`${sessions}/5`}
/>
      </View>

      <View style={styles.row}>
        <StatsCard title="Streak" value="0 Days" />
        <StatsCard title="Score" value="100%" />
      </View>

     <FocusTimer />
     
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      <View style={styles.activityCard}>
        <Text>No focus sessions yet.</Text>
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

  greeting: {
    fontSize: 18,
    color: Colors.gray,
    marginTop: 20,
  },

  name: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 25,
  },

  row: {
    flexDirection: "row",
    marginBottom: 15,
  },

  button: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 18,
    marginTop: 15,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  sectionTitle: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },

  activityCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginTop: 15,
  },
});