import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";

import {
  getActiveGoal,
  saveFocusSession,
  GoalProgress,
} from "../../services/focusService";

const DEFAULT_TIME = 25 * 60;

export default function FocusScreen() {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [running, setRunning] = useState(false);
  const [activeGoal, setActiveGoal] =
    useState<GoalProgress | null>(null);
  const [loadingGoal, setLoadingGoal] = useState(true);

  const loadActiveGoal = useCallback(async () => {
    try {
      const goal = await getActiveGoal();
      setActiveGoal(goal);
    } catch (error) {
      console.error("Error loading active goal:", error);
    } finally {
      setLoadingGoal(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActiveGoal();
    }, [loadActiveGoal])
  );

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval);
          setRunning(false);
          completeFocusSession();
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const completeFocusSession = async () => {
    try {
      await saveFocusSession(25);

      Alert.alert(
        "🎉 Focus Session Complete!",
        activeGoal
          ? `Great work! Your 25 focused minutes have been added to "${activeGoal.title}".`
          : "Great work! Your 25 focused minutes have been saved.",
        [
          {
            text: "OK",
            onPress: async () => {
              setTimeLeft(DEFAULT_TIME);
              await loadActiveGoal();
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Error saving focus session:",
        error
      );

      Alert.alert(
        "Session Error",
        "Your focus session could not be saved. Please try again."
      );

      setTimeLeft(DEFAULT_TIME);
    }
  };

  const toggleTimer = () => {
    setRunning((previous) => !previous);
  };

  const resetTimer = () => {
    setRunning(false);
    setTimeLeft(DEFAULT_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  const goalProgress = activeGoal
    ? Math.min(
        activeGoal.completedMinutes /
          activeGoal.targetMinutes,
        1
      )
    : 0;

  const progressPercentage = activeGoal
    ? Math.round(goalProgress * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Focus Session</Text>

          <Text style={styles.subtitle}>
            Stay focused. Make progress.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="timer-outline"
            size={27}
            color="#4F46E5"
          />
        </View>
      </View>

      {/* Timer Card */}
      <View style={styles.timerCard}>
        <View
          style={[
            styles.timerCircle,
            running && styles.timerCircleActive,
          ]}
        >
          <Text style={styles.timerLabel}>
            {running ? "FOCUSING" : "READY"}
          </Text>

          <Text style={styles.timerText}>
            {formattedMinutes}:{formattedSeconds}
          </Text>

          <Text style={styles.timerSubtext}>
            25 minute session
          </Text>
        </View>

        <View style={styles.timerActions}>
          <TouchableOpacity
            style={styles.mainButton}
            onPress={toggleTimer}
            activeOpacity={0.8}
          >
            <Ionicons
              name={
                running
                  ? "pause"
                  : "play"
              }
              size={24}
              color="#FFFFFF"
            />

            <Text style={styles.mainButtonText}>
              {running ? "Pause" : "Start Focus"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetTimer}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color="#4F46E5"
            />

            <Text style={styles.resetButtonText}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Goal */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Active Goal
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/goals" as any)}
        >
          <Text style={styles.viewGoalsText}>
            View Goals
          </Text>
        </TouchableOpacity>
      </View>

      {loadingGoal ? (
        <View style={styles.goalCard}>
          <Text style={styles.goalLoading}>
            Loading active goal...
          </Text>
        </View>
      ) : activeGoal ? (
        <View style={styles.goalCard}>
          <View style={styles.goalTop}>
            <View style={styles.goalIcon}>
              <Ionicons
                name="flag-outline"
                size={23}
                color="#4F46E5"
              />
            </View>

            <View style={styles.goalInfo}>
              <Text
                style={styles.goalTitle}
                numberOfLines={1}
              >
                {activeGoal.title}
              </Text>

              <Text style={styles.goalProgressText}>
                {activeGoal.completedMinutes} /{" "}
                {activeGoal.targetMinutes} minutes
              </Text>
            </View>

            <Text style={styles.goalPercentage}>
              {progressPercentage}%
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>

          <View style={styles.goalBottom}>
            <Text style={styles.goalBottomText}>
              {Math.max(
                activeGoal.targetMinutes -
                  activeGoal.completedMinutes,
                0
              )}{" "}
              minutes remaining
            </Text>

            <Ionicons
              name="trending-up-outline"
              size={17}
              color="#16A34A"
            />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.noGoalCard}
          onPress={() => router.push("/(tabs)/goals" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.noGoalIcon}>
            <Ionicons
              name="flag-outline"
              size={25}
              color="#4F46E5"
            />
          </View>

          <View style={styles.noGoalContent}>
            <Text style={styles.noGoalTitle}>
              No active goal
            </Text>

            <Text style={styles.noGoalText}>
              Create or activate a goal to automatically
              track your focus progress.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      )}

      {/* How It Works */}
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons
            name="information-circle-outline"
            size={23}
            color="#4F46E5"
          />
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            How FocusGuard Works
          </Text>

          <Text style={styles.infoText}>
            Complete a 25-minute focus session and
            FocusGuard automatically saves your session,
            updates your active goal, and includes the
            session in your analytics.
          </Text>
        </View>
      </View>

      {/* Session Benefits */}
      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>
          During your focus session
        </Text>

        <View style={styles.benefitRow}>
          <Ionicons
            name="checkmark-circle"
            size={19}
            color="#16A34A"
          />

          <Text style={styles.benefitText}>
            Avoid distracting apps
          </Text>
        </View>

        <View style={styles.benefitRow}>
          <Ionicons
            name="checkmark-circle"
            size={19}
            color="#16A34A"
          />

          <Text style={styles.benefitText}>
            Concentrate on one task
          </Text>
        </View>

        <View style={styles.benefitRow}>
          <Ionicons
            name="checkmark-circle"
            size={19}
            color="#16A34A"
          />

          <Text style={styles.benefitText}>
            Build consistent study habits
          </Text>
        </View>
      </View>

      {/* History Button */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() =>
          router.push("/focus-history" as any)
        }
        activeOpacity={0.8}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color="#4F46E5"
        />

        <Text style={styles.historyButtonText}>
          View Focus History
        </Text>

        <Ionicons
          name="chevron-forward"
          size={19}
          color="#9CA3AF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
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

  timerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 25,
  },

  timerCircle: {
    width: 235,
    height: 235,
    borderRadius: 118,
    borderWidth: 9,
    borderColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  timerCircleActive: {
    borderColor: "#4F46E5",
  },

  timerLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#4F46E5",
  },

  timerText: {
    marginTop: 5,
    fontSize: 48,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 2,
  },

  timerSubtext: {
    marginTop: 2,
    fontSize: 11,
    color: "#9CA3AF",
  },

  timerActions: {
    width: "100%",
    marginTop: 24,
  },

  mainButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  mainButtonText: {
    marginLeft: 9,
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  resetButton: {
    height: 48,
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  resetButtonText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  viewGoalsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  goalTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  goalIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    marginRight: 11,
  },

  goalInfo: {
    flex: 1,
  },

  goalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  goalProgressText: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
  },

  goalPercentage: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4F46E5",
  },

  progressBackground: {
    height: 9,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 15,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#4F46E5",
  },

  goalBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
  },

  goalBottomText: {
    fontSize: 11,
    color: "#6B7280",
  },

  goalLoading: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 12,
  },

  noGoalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  noGoalIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    marginRight: 12,
  },

  noGoalContent: {
    flex: 1,
  },

  noGoalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  noGoalText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: "#6B7280",
  },

  infoCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    marginBottom: 18,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#312E81",
  },

  infoText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: "#4338CA",
  },

  benefitsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  benefitsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  benefitText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#4B5563",
  },

  historyButton: {
    height: 52,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  historyButtonText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },
});