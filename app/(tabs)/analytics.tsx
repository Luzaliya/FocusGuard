import React, { useCallback, useMemo, useState } from "react";
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
import { useFocusEffect } from "expo-router";

import {
  getFocusSessions,
  FocusSession,
} from "../../services/focusService";

type Period = "week" | "month" | "all";

interface DayData {
  label: string;
  dateKey: string;
  minutes: number;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}m`;
}

function getSessionDate(session: FocusSession) {
  if (!session.completedAt) {
    return null;
  }

  const timestamp = session.completedAt as any;

  if (typeof timestamp?.toDate === "function") {
    return timestamp.toDate();
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function getPeriodStart(period: Period) {
  const now = new Date();

  if (period === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const day = start.getDay();
    const difference = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - difference);

    return start;
  }

  if (period === "month") {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
  }

  return new Date(0);
}

export default function AnalyticsScreen() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await getFocusSessions();
      setSessions(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics])
  );

  const filteredSessions = useMemo(() => {
    const startDate = getPeriodStart(period);

    return sessions.filter((session) => {
      const sessionDate = getSessionDate(session);

      if (!sessionDate) {
        return false;
      }

      return sessionDate >= startDate;
    });
  }, [sessions, period]);

  const statistics = useMemo(() => {
    const totalMinutes = filteredSessions.reduce(
      (total, session) => total + Number(session.duration || 0),
      0
    );

    const sessionCount = filteredSessions.length;

    const longestSession =
      sessionCount > 0
        ? Math.max(
            ...filteredSessions.map((session) =>
              Number(session.duration || 0)
            )
          )
        : 0;

    const averageSession =
      sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;

    return {
      totalMinutes,
      sessionCount,
      longestSession,
      averageSession,
    };
  }, [filteredSessions]);

  const todayMinutes = useMemo(() => {
    const todayKey = getDateKey(new Date());

    return sessions.reduce((total, session) => {
      const date = getSessionDate(session);

      if (!date || getDateKey(date) !== todayKey) {
        return total;
      }

      return total + Number(session.duration || 0);
    }, 0);
  }, [sessions]);

  const weeklyData = useMemo<DayData[]>(() => {
    const today = new Date();

    const days: DayData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - i);

      const dateKey = getDateKey(date);

      const minutes = sessions.reduce((total, session) => {
        const sessionDate = getSessionDate(session);

        if (!sessionDate || getDateKey(sessionDate) !== dateKey) {
          return total;
        }

        return total + Number(session.duration || 0);
      }, 0);

      days.push({
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        dateKey,
        minutes,
      });
    }

    return days;
  }, [sessions]);

  const weeklyMaximum = useMemo(() => {
    const maximum = Math.max(
      ...weeklyData.map((day) => day.minutes),
      0
    );

    return maximum === 0 ? 1 : maximum;
  }, [weeklyData]);

  const bestDay = useMemo(() => {
    if (weeklyData.length === 0) {
      return null;
    }

    return weeklyData.reduce((best, current) =>
      current.minutes > best.minutes ? current : best
    );
  }, [weeklyData]);

  const recentSessions = useMemo(() => {
    return [...filteredSessions]
      .sort((a, b) => {
        const dateA = getSessionDate(a)?.getTime() || 0;
        const dateB = getSessionDate(b)?.getTime() || 0;

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [filteredSessions]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>
          Loading your analytics...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#4F46E5"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>
            Understand your focus habits and progress.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="analytics-outline"
            size={26}
            color="#4F46E5"
          />
        </View>
      </View>

      {/* Today's Focus */}
      <View style={styles.todayCard}>
        <View style={styles.todayIcon}>
          <Ionicons
            name="timer-outline"
            size={30}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.todayContent}>
          <Text style={styles.todayLabel}>Today's Focus</Text>

          <Text style={styles.todayValue}>
            {formatMinutes(todayMinutes)}
          </Text>

          <Text style={styles.todayDescription}>
            Keep building your focus habit.
          </Text>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Focus Overview</Text>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === "week" && styles.periodButtonActive,
          ]}
          onPress={() => setPeriod("week")}
        >
          <Text
            style={[
              styles.periodText,
              period === "week" && styles.periodTextActive,
            ]}
          >
            This Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            period === "month" && styles.periodButtonActive,
          ]}
          onPress={() => setPeriod("month")}
        >
          <Text
            style={[
              styles.periodText,
              period === "month" && styles.periodTextActive,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            period === "all" && styles.periodButtonActive,
          ]}
          onPress={() => setPeriod("all")}
        >
          <Text
            style={[
              styles.periodText,
              period === "all" && styles.periodTextActive,
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons
              name="time-outline"
              size={22}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.statValue}>
            {formatMinutes(statistics.totalMinutes)}
          </Text>

          <Text style={styles.statLabel}>Focus Time</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#16A34A"
            />
          </View>

          <Text style={styles.statValue}>
            {statistics.sessionCount}
          </Text>

          <Text style={styles.statLabel}>Sessions</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons
              name="trophy-outline"
              size={22}
              color="#D97706"
            />
          </View>

          <Text style={styles.statValue}>
            {formatMinutes(statistics.longestSession)}
          </Text>

          <Text style={styles.statLabel}>Longest</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons
              name="speedometer-outline"
              size={22}
              color="#7C3AED"
            />
          </View>

          <Text style={styles.statValue}>
            {formatMinutes(statistics.averageSession)}
          </Text>

          <Text style={styles.statLabel}>Average</Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Weekly Activity</Text>
            <Text style={styles.chartSubtitle}>
              Your focus time over the last 7 days
            </Text>
          </View>

          <Ionicons
            name="bar-chart-outline"
            size={24}
            color="#4F46E5"
          />
        </View>

        <View style={styles.chart}>
          {weeklyData.map((day) => {
            const barHeight =
              day.minutes === 0
                ? 5
                : Math.max(
                    10,
                    (day.minutes / weeklyMaximum) * 130
                  );

            const isToday =
              day.dateKey === getDateKey(new Date());

            return (
              <View style={styles.barColumn} key={day.dateKey}>
                <Text style={styles.barValue}>
                  {day.minutes > 0 ? day.minutes : ""}
                </Text>

                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        opacity: day.minutes === 0 ? 0.25 : 1,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.dayLabel,
                    isToday && styles.todayDayLabel,
                  ]}
                >
                  {day.label}
                </Text>
              </View>
            );
          })}
        </View>

        {bestDay && bestDay.minutes > 0 ? (
          <View style={styles.bestDayCard}>
            <Ionicons
              name="trending-up-outline"
              size={20}
              color="#16A34A"
            />

            <Text style={styles.bestDayText}>
              Best focus day:{" "}
              <Text style={styles.bestDayBold}>
                {bestDay.label}
              </Text>{" "}
              with {formatMinutes(bestDay.minutes)}.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyChartMessage}>
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color="#9CA3AF"
            />

            <Text style={styles.emptyChartText}>
              Complete focus sessions to see your activity here.
            </Text>
          </View>
        )}
      </View>

      {/* Productivity Insight */}
      <View style={styles.insightCard}>
        <View style={styles.insightIcon}>
          <Ionicons
            name="bulb-outline"
            size={24}
            color="#4F46E5"
          />
        </View>

        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>
            Focus Insight
          </Text>

          <Text style={styles.insightText}>
            {statistics.sessionCount === 0
              ? "Start your first focus session to begin building your productivity history."
              : statistics.averageSession >= 25
              ? "Great work! Your average session is 25 minutes or more. Keep protecting your focused time."
              : "You're building momentum. Try gradually increasing the length of your focus sessions."}
          </Text>
        </View>
      </View>

      {/* Recent Sessions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Recent Sessions
        </Text>

        <Text style={styles.sessionCount}>
          {filteredSessions.length} total
        </Text>
      </View>

      {recentSessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="time-outline"
              size={30}
              color="#9CA3AF"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No focus sessions yet
          </Text>

          <Text style={styles.emptyText}>
            Complete a focus session and your analytics will
            appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsCard}>
          {recentSessions.map((session, index) => {
            const date = getSessionDate(session);

            return (
              <View
                key={
                  session.id ||
                  `${session.userId}-${session.duration}-${index}`
                }
                style={[
                  styles.sessionRow,
                  index === recentSessions.length - 1 &&
                    styles.lastSessionRow,
                ]}
              >
                <View style={styles.sessionIcon}>
                  <Ionicons
                    name="timer-outline"
                    size={21}
                    color="#4F46E5"
                  />
                </View>

                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDuration}>
                    {formatMinutes(
                      Number(session.duration || 0)
                    )}
                  </Text>

                  <Text style={styles.sessionDate}>
                    {date
                      ? date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "Date unavailable"}
                  </Text>
                </View>

                <View style={styles.completedBadge}>
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#16A34A"
                  />

                  <Text style={styles.completedText}>
                    Completed
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Bottom Message */}
      <View style={styles.bottomMessage}>
        <Ionicons
          name="shield-checkmark-outline"
          size={20}
          color="#4F46E5"
        />

        <Text style={styles.bottomMessageText}>
          Every focused minute counts. Keep going.
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

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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
    maxWidth: 280,
    lineHeight: 19,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },

  todayCard: {
    backgroundColor: "#4F46E5",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  todayIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginRight: 15,
  },

  todayContent: {
    flex: 1,
  },

  todayLabel: {
    fontSize: 13,
    color: "#E0E7FF",
    fontWeight: "600",
  },

  todayValue: {
    marginTop: 2,
    fontSize: 27,
    color: "#FFFFFF",
    fontWeight: "800",
  },

  todayDescription: {
    marginTop: 2,
    fontSize: 12,
    color: "#E0E7FF",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  sessionCount: {
    fontSize: 12,
    color: "#6B7280",
  },

  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },

  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },

  periodButtonActive: {
    backgroundColor: "#FFFFFF",
  },

  periodText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  periodTextActive: {
    color: "#4F46E5",
    fontWeight: "800",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginBottom: 10,
  },

  statValue: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111827",
  },

  statLabel: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  chartTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  chartSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  chart: {
    height: 190,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 20,
  },

  barColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  barValue: {
    height: 18,
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "700",
  },

  barContainer: {
    height: 135,
    width: 24,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  bar: {
    width: 20,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },

  dayLabel: {
    marginTop: 8,
    fontSize: 10,
    color: "#9CA3AF",
  },

  todayDayLabel: {
    color: "#4F46E5",
    fontWeight: "800",
  },

  bestDayCard: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    flexDirection: "row",
    alignItems: "center",
  },

  bestDayText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#166534",
  },

  bestDayBold: {
    fontWeight: "800",
  },

  emptyChartMessage: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
  },

  emptyChartText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },

  insightCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    marginBottom: 24,
  },

  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  insightContent: {
    flex: 1,
  },

  insightTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#312E81",
  },

  insightText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#4338CA",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    maxWidth: 280,
  },

  sessionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  lastSessionRow: {
    borderBottomWidth: 0,
  },

  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sessionInfo: {
    flex: 1,
  },

  sessionDuration: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  sessionDate: {
    marginTop: 3,
    fontSize: 11,
    color: "#6B7280",
  },

  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  completedText: {
    marginLeft: 3,
    fontSize: 9,
    color: "#16A34A",
    fontWeight: "700",
  },

  bottomMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },

  bottomMessageText: {
    marginLeft: 7,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
});