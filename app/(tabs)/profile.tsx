import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";

import { auth } from "@/services/firebase";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  const [loggingOut, setLoggingOut] = useState(false);

  const user = auth.currentUser;

  const email = user?.email || "No email available";

  /**
   * Perform Firebase logout
   */
  const performLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      console.log("Starting logout...");

      await signOut(auth);

      console.log("Firebase logout successful");

      // Confirm Firebase user has been cleared
      if (auth.currentUser === null) {
        console.log("User signed out successfully");

        router.replace("/login" as any);
      } else {
        throw new Error("User is still authenticated.");
      }
    } catch (error) {
      console.error("Logout error:", error);

      setLoggingOut(false);

      if (Platform.OS === "web") {
        window.alert(
          "Unable to logout. Please try again."
        );
      } else {
        Alert.alert(
          "Logout Failed",
          "Unable to logout. Please try again."
        );
      }
    }
  };

  /**
   * Handle logout confirmation.
   *
   * Expo Web uses the browser's confirm dialog.
   * Android/iOS use React Native Alert.
   */
  const handleLogout = () => {
    if (loggingOut) return;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to logout of FocusGuard?"
      );

      if (confirmed) {
        performLogout();
      }

      return;
    }

    Alert.alert(
      "Logout",
      "Are you sure you want to logout of FocusGuard?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: performLogout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={45}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.title}>
          My Profile
        </Text>

        <Text style={styles.subtitle}>
          Manage your FocusGuard account
        </Text>
      </View>

      {/* Account Information */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="mail-outline"
              size={22}
              color={Colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.label}>
              Email
            </Text>

            <Text
              style={styles.value}
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={Colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.label}>
              Account Status
            </Text>

            <Text style={styles.value}>
              Active
            </Text>
          </View>
        </View>
      </View>

      {/* Feature Summary */}
      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Ionicons
            name="timer-outline"
            size={28}
            color={Colors.primary}
          />

          <Text style={styles.statTitle}>
            Focus
          </Text>

          <Text style={styles.statSubtitle}>
            Stay productive
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Ionicons
            name="flag-outline"
            size={28}
            color={Colors.primary}
          />

          <Text style={styles.statTitle}>
            Goals
          </Text>

          <Text style={styles.statSubtitle}>
            Track progress
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Ionicons
            name="analytics-outline"
            size={28}
            color={Colors.primary}
          />

          <Text style={styles.statTitle}>
            Analytics
          </Text>

          <Text style={styles.statSubtitle}>
            View activity
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[
          styles.logoutButton,
          loggingOut && styles.logoutButtonDisabled,
        ]}
        onPress={handleLogout}
        disabled={loggingOut}
        activeOpacity={0.8}
      >
        {loggingOut ? (
          <>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text style={styles.logoutText}>
              Logging out...
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name="log-out-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.logoutText}>
              Logout
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>
        FocusGuard • v1.0.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 5,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    marginBottom: 15,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: Colors.gray,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 18,
  },

  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 5,
  },

  statSubtitle: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 2,
    textAlign: "center",
  },

  statDivider: {
    width: 1,
    height: 55,
    backgroundColor: "#E5E7EB",
  },

  logoutButton: {
    marginTop: 25,
    backgroundColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutButtonDisabled: {
    opacity: 0.7,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  version: {
    textAlign: "center",
    color: Colors.gray,
    fontSize: 12,
    marginTop: 20,
  },
});