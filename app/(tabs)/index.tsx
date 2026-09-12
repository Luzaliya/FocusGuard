import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { getCurrentUserProfile } from "../../services/userService";
import {
  getActiveGoal,
  getTodayFocusMinutes,
  getWeeklyFocusMinutes,
} from "../../services/focusService";
import { getStreakData } from "../../services/streakService";

interface DashboardData {
  name: string;
  todayMinutes: number;
  weeklyMinutes: number;
  currentStreak: number;
  bestStreak: number;
  activeGoal: {
    title: string;
    targetMinutes: number;
    completedMinutes: number;
  } | null;
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState<DashboardData>({
    name: "Student",
    todayMinutes: 0,
    weeklyMinutes: 0,
    currentStreak: 0,
    bestStreak: 0,
    activeGoal: null,
  });

  const loadDashboard = useCallback(async () => {
    try {
      const [profile, todayMinutes, weeklyMinutes, streak, activeGoal] =
        await Promise.all([
          getCurrentUserProfile(),
          getTodayFocusMinutes(),
          getWeeklyFocusMinutes(),
          getStreakData(),
          getActiveGoal(),
        ]);

      setData({
        name:
          profile?.fullName ||
          profile?.name ||
          "Student",
        todayMinutes: Number(todayMinutes || 0),
        weeklyMinutes: Number(weeklyMinutes || 0),
        currentStreak: Number(streak?.currentStreak || 0),
        bestStreak: Number(streak?.bestStreak || 0),
        activeGoal: activeGoal
          ? {
              title: activeGoal.title,
              targetMinutes: Number(activeGoal.targetMinutes || 0),
              completedMinutes: Number(
                activeGoal.completedMinutes || 0
              ),
            }
          : null,
      });
    } catch (error) {
      console.log("Dashboard loading error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const goalProgress = data.activeGoal
    ? Math.min(
        100,
        Math.round(
          (data.activeGoal.completedMinutes /
            Math.max(data.activeGoal.targetMinutes, 1)) *
            100
        )
      )
    : 0;

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    if (remaining === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remaining}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>

          <Text style={styles.name}>
            {data.name}
          </Text>

          <Text style={styles.subtitle}>
            Stay focused. Make progress.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/profile")}
        >
          <Ionicons
            name="person-outline"
            size={22}
            color="#4F46E5"
          />
        </TouchableOpacity>
      </View>

      {/* Main Focus Card */}
      <View style={styles.focusCard}>
        <View style={styles.focusCardIcon}>
          <Ionicons
            name="timer-outline"
            size={32}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.focusCardContent}>
          <Text style={styles.focusCardTitle}>
            Ready to focus?
          </Text>

          <Text style={styles.focusCardSubtitle}>
            Start a 25-minute focused study session.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push("/focus")}
            activeOpacity={0.85}
          >
            <Ionicons
              name="play"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.startButtonText}>
              Start Focus
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <Text style={styles.sectionTitle}>
        Your Progress
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="today-outline"
              size={22}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.statValue}>
            {formatMinutes(data.todayMinutes)}
          </Text>

          <Text style={styles.statLabel}>
            Today
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color="#059669"
            />
          </View>

          <Text style={styles.statValue}>
            {formatMinutes(data.weeklyMinutes)}
          </Text>

          <Text style={styles.statLabel}>
            This Week
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="flame-outline"
              size={22}
              color="#EA580C"
            />
          </View>

          <Text style={styles.statValue}>
            {data.currentStreak}
          </Text>

          <Text style={styles.statLabel}>
            Day Streak
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="trophy-outline"
              size={22}
              color="#CA8A04"
            />
          </View>

          <Text style={styles.statValue}>
            {data.bestStreak}
          </Text>

          <Text style={styles.statLabel}>
            Best Streak
          </Text>
        </View>
      </View>

      {/* Active Goal */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Active Goal
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/goals")}
        >
          <Text style={styles.seeAll}>
            View Goals
          </Text>
        </TouchableOpacity>
      </View>

      {data.activeGoal ? (
        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => router.push("/goals")}
          activeOpacity={0.85}
        >
          <View style={styles.goalTopRow}>
            <View style={styles.goalIcon}>
              <Ionicons
                name="flag-outline"
                size={24}
                color="#4F46E5"
              />
            </View>

            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>
                {data.activeGoal.title}
              </Text>

              <Text style={styles.goalMinutes}>
                {formatMinutes(
                  data.activeGoal.completedMinutes
                )}{" "}
                of{" "}
                {formatMinutes(
                  data.activeGoal.targetMinutes
                )}
              </Text>
            </View>

            <Text style={styles.goalPercentage}>
              {goalProgress}%
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${goalProgress}%` },
              ]}
            />
          </View>

          <Text style={styles.goalHint}>
            Keep going — every focused minute counts.
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.emptyGoalCard}
          onPress={() => router.push("/goals")}
          activeOpacity={0.85}
        >
          <View style={styles.emptyGoalIcon}>
            <Ionicons
              name="flag-outline"
              size={26}
              color="#4F46E5"
            />
          </View>

          <View style={styles.emptyGoalText}>
            <Text style={styles.emptyGoalTitle}>
              Set a focus goal
            </Text>

            <Text style={styles.emptyGoalDescription}>
              Create a goal to track your study progress.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/focus-history")}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="time-outline"
              size={25}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.actionTitle}>
            Focus History
          </Text>

          <Text style={styles.actionDescription}>
            Review your sessions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/analytics")}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="bar-chart-outline"
              size={25}
              color="#059669"
            />
          </View>

          <Text style={styles.actionTitle}>
            Analytics
          </Text>

          <Text style={styles.actionDescription}>
            View your statistics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/goals")}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="checkmark-circle-outline"
              size={25}
              color="#EA580C"
            />
          </View>

          <Text style={styles.actionTitle}>
            Goals
          </Text>

          <Text style={styles.actionDescription}>
            Manage your goals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/settings")}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="notifications-outline"
              size={25}
              color="#7C3AED"
            />
          </View>

          <Text style={styles.actionTitle}>
            Reminders
          </Text>

          <Text style={styles.actionDescription}>
            Manage focus reminders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Focus History Banner */}
      <TouchableOpacity
        style={styles.historyBanner}
        onPress={() => router.push("/focus-history")}
        activeOpacity={0.85}
      >
        <View style={styles.historyIcon}>
          <Ionicons
            name="book-outline"
            size={26}
            color="#4F46E5"
          />
        </View>

        <View style={styles.historyContent}>
          <Text style={styles.historyTitle}>
            Keep building your focus habit
          </Text>

          <Text style={styles.historyDescription}>
            Review your previous sessions and see how
            consistently you've been focusing.
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={20}
          color="#9CA3AF"
        />

        <Text style={styles.footerText}>
          FocusGuard — Your space for better focus.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  greeting: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 3,
  },

  name: {
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  focusCard: {
    backgroundColor: "#4F46E5",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    marginBottom: 26,
  },

  focusCardIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  focusCardContent: {
    flex: 1,
  },

  focusCardTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  focusCardSubtitle: {
    color: "#E0E7FF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 13,
  },

  startButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  startButtonText: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "800",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 13,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 25,
  },

  seeAll: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 13,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 25,
  },

  goalTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  goalIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  goalInfo: {
    flex: 1,
  },

  goalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  goalMinutes: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  goalPercentage: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4F46E5",
  },

  progressBackground: {
    height: 9,
    borderRadius: 5,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginTop: 17,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 5,
  },

  goalHint: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 9,
  },

  emptyGoalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 25,
  },

  emptyGoalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  emptyGoalText: {
    flex: 1,
  },

  emptyGoalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  emptyGoalDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
    marginTop: 3,
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  actionDescription: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },

  historyBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 10,
  },

  historyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  historyContent: {
    flex: 1,
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  historyDescription: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 17,
    marginTop: 4,
  },

  footer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    flexDirection: "row",
    gap: 7,
  },

  footerText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});