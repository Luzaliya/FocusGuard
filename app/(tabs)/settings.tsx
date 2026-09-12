import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import {
  cancelFocusReminder,
  getScheduledFocusReminders,
  requestNotificationPermission,
  scheduleFocusReminder,
} from "../../services/notificationService";

const REMINDER_HOUR = 18;
const REMINDER_MINUTE = 0;

export default function SettingsScreen() {
  const [reminderEnabled, setReminderEnabled] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const loadReminderStatus = useCallback(async () => {
    try {
      const reminders =
        await getScheduledFocusReminders();

      setReminderEnabled(reminders.length > 0);
    } catch (error) {
      console.error(
        "Error checking reminder status:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminderStatus();
    }, [loadReminderStatus])
  );

  useEffect(() => {
    if (Platform.OS === "android") {
      requestNotificationPermission().catch((error) => {
        console.log(
          "Notification permission check:",
          error
        );
      });
    }
  }, []);

  const handleReminderToggle = async (
    value: boolean
  ) => {
    try {
      if (value) {
        const permissionGranted =
          await requestNotificationPermission();

        if (!permissionGranted) {
          Alert.alert(
            "Permission Required",
            "FocusGuard needs notification permission to send focus reminders."
          );

          setReminderEnabled(false);
          return;
        }

        await scheduleFocusReminder(
          REMINDER_HOUR,
          REMINDER_MINUTE
        );

        setReminderEnabled(true);

        Alert.alert(
          "Reminder Enabled",
          "FocusGuard will remind you every day at 6:00 PM to start a focus session."
        );
      } else {
        await cancelFocusReminder();

        setReminderEnabled(false);

        Alert.alert(
          "Reminder Disabled",
          "Your daily focus reminder has been turned off."
        );
      }
    } catch (error) {
      console.error(
        "Error changing reminder:",
        error
      );

      Alert.alert(
        "Something went wrong",
        "We could not update your focus reminder. Please try again."
      );

      await loadReminderStatus();
    }
  };

  const testNotification = async () => {
    try {
      const permissionGranted =
        await requestNotificationPermission();

      if (!permissionGranted) {
        Alert.alert(
          "Permission Required",
          "Please allow notifications first."
        );

        return;
      }

      await scheduleFocusReminder(
        new Date().getHours(),
        new Date().getMinutes() + 1
      );

      Alert.alert(
        "Test Reminder Scheduled",
        "A test focus reminder has been scheduled for about one minute from now."
      );
    } catch (error) {
      console.error(
        "Test notification error:",
        error
      );

      Alert.alert(
        "Test Failed",
        "Unable to schedule the test reminder."
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.subtitle}>
            Customize your FocusGuard experience.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="settings-outline"
            size={25}
            color="#4F46E5"
          />
        </View>
      </View>

      {/* Notifications Section */}
      <Text style={styles.sectionTitle}>
        Notifications
      </Text>

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons
              name="notifications-outline"
              size={23}
              color="#4F46E5"
            />
          </View>

          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>
              Daily Focus Reminder
            </Text>

            <Text style={styles.settingDescription}>
              Receive a reminder every day to start a
              focused study session.
            </Text>
          </View>

          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            disabled={loading}
            trackColor={{
              false: "#D1D5DB",
              true: "#C7D2FE",
            }}
            thumbColor={
              reminderEnabled ? "#4F46E5" : "#F9FAFB"
            }
          />
        </View>

        {reminderEnabled && (
          <View style={styles.reminderTime}>
            <Ionicons
              name="time-outline"
              size={19}
              color="#4F46E5"
            />

            <View>
              <Text style={styles.reminderTimeTitle}>
                Daily reminder time
              </Text>

              <Text style={styles.reminderTimeValue}>
                6:00 PM
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Test Reminder */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={testNotification}
        activeOpacity={0.8}
      >
        <Ionicons
          name="paper-plane-outline"
          size={20}
          color="#4F46E5"
        />

        <Text style={styles.testButtonText}>
          Test Focus Reminder
        </Text>
      </TouchableOpacity>

      {/* Focus Settings */}
      <Text style={styles.sectionTitle}>
        Focus
      </Text>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Ionicons
              name="timer-outline"
              size={22}
              color="#4F46E5"
            />
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              Focus Sessions
            </Text>

            <Text style={styles.optionDescription}>
              Use FocusGuard's timer to protect your
              study time.
            </Text>
          </View>

          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#16A34A"
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#4F46E5"
            />
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              App Protection
            </Text>

            <Text style={styles.optionDescription}>
              Set daily limits for distracting apps.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>
        About FocusGuard
      </Text>

      <View style={styles.aboutCard}>
        <View style={styles.logoContainer}>
          <Ionicons
            name="shield-checkmark"
            size={32}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.appName}>
          FocusGuard
        </Text>

        <Text style={styles.appDescription}>
          A productivity and digital distraction
          management application designed to help
          students build better study habits.
        </Text>

        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>
            Version 1.0.0
          </Text>
        </View>
      </View>

      {/* Privacy Message */}
      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={21}
          color="#4F46E5"
        />

        <Text style={styles.infoText}>
          Focus sessions and productivity information
          are associated with your authenticated
          FocusGuard account.
        </Text>
      </View>

      <Text style={styles.footer}>
        Focus better. Study smarter. 📚
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#6B7280",
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  settingIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    marginRight: 12,
  },

  settingContent: {
    flex: 1,
    marginRight: 10,
  },

  settingTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  settingDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: "#6B7280",
  },

  reminderTime: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F3FF",
  },

  reminderTimeTitle: {
    marginLeft: 9,
    fontSize: 11,
    color: "#6B7280",
  },

  reminderTimeValue: {
    marginLeft: 9,
    marginTop: 2,
    fontSize: 15,
    fontWeight: "800",
    color: "#4F46E5",
  },

  testButton: {
    height: 52,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: -8,
    marginBottom: 28,
  },

  testButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },

  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    marginRight: 12,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  optionDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    color: "#6B7280",
  },

  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 14,
  },

  aboutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  logoContainer: {
    width: 65,
    height: 65,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    marginBottom: 12,
  },

  appName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  appDescription: {
    marginTop: 7,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },

  versionBadge: {
    marginTop: 13,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },

  versionText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEF2FF",
    borderRadius: 15,
    padding: 14,
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11,
    lineHeight: 17,
    color: "#4338CA",
  },

  footer: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
});