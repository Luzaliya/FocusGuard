import React, { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const [focusMode, setFocusMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const SettingCard = ({
    icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="#4F46E5" />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9CA3AF"
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Settings</Text>

      <View style={styles.switchCard}>
        <View style={styles.cardContent}>
          <Text style={styles.title}>Focus Mode</Text>
          <Text style={styles.subtitle}>
            Block distracting apps during study sessions.
          </Text>
        </View>

        <Switch
          value={focusMode}
          onValueChange={setFocusMode}
        />
      </View>

      <SettingCard
        icon="phone-portrait"
        title="App Usage Limits"
        subtitle="Set daily limits for WhatsApp, TikTok and more."
       onPress={() =>
  router.push("/app-limits")
}
      />

      <SettingCard
        icon="calendar"
        title="Study Schedule"
        subtitle="Create automatic focus sessions."
      />

      <SettingCard
        icon="shield-checkmark"
        title="Emergency Apps"
        subtitle="Choose apps allowed during Focus Mode."
      />

      <View style={styles.switchCard}>
        <View style={styles.cardContent}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            Receive study reminders and alerts.
          </Text>
        </View>

        <Switch
          value={notifications}
          onValueChange={setNotifications}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 20,
  },

  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
  },

  switchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
  },

  iconContainer: {
    marginRight: 15,
  },

  cardContent: {
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },
});