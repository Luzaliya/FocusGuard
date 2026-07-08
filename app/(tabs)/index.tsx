import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import StatsCard from "@/components/StatsCard";
import Colors from "@/constants/colors";
import { useEffect, useState } from "react";
import { getCurrentUserProfile } from "@/services/userService";
import FocusTimer from "@/components/FocusTimer";
import { getFocusSessions } from "@/services/focusService";
import { calculateStreak } from "@/services/streakService";


export default function Home() {
  const [name, setName] = useState("User");
  const [focusMinutes, setFocusMinutes] = useState(0);

const [sessions, setSessions] = useState<any[]>([]);
const [streak, setStreak] = useState(0);
const [score, setScore] = useState(0);

useEffect(() => {
  loadDashboard();
}, []);

const loadDashboard = async () => {
  const profile = await getCurrentUserProfile();

  if (profile?.fullName) {
    setName(profile.fullName);
  }

  const data = await getFocusSessions();

  setSessions(data);

  const total = data.reduce(
    (sum: number, item: any) => sum + item.duration,
    0
  );

  setFocusMinutes(total);

  const calculatedScore = Math.min(
  Math.round((data.length / 5) * 100),
  100
);

setScore(calculatedScore);

  const currentStreak = await calculateStreak();
setStreak(currentStreak);
};

<FocusTimer onSessionComplete={loadDashboard} />

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
  value={`${sessions.length}/5`}
  progress={(sessions.length / 5) * 100}
/>
      </View>

      <View style={styles.row}>
        <StatsCard
  title="Streak"
  value={`🔥 ${streak} Days`}
/>
        <StatsCard
  title="Score"
  value={`${score}%`}
/>
      </View>

     <FocusTimer />
     
      <Text style={styles.sectionTitle}>Recent Activity</Text>

    

{sessions.length === 0 ? (
  <View style={styles.activityCard}>
    <Text>No focus sessions yet.</Text>
  </View>
) : (
  sessions.map((session: any, index: number) => (
    <View key={index} style={styles.activityCard}>
      <Text style={{ fontWeight: "bold" }}>
        ✅ {session.duration} minutes
      </Text>

      <Text style={{ color: "#666", marginTop: 5 }}>
        {session.completedAt?.toDate
          ? session.completedAt.toDate().toLocaleString()
          : "Just now"}
      </Text>
    </View>
  ))
)}
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