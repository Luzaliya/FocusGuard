import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  FocusSession,
  getFocusSessions,
} from "../services/focusService";

type FilterType = "all" | "today" | "week" | "month";

export default function FocusHistoryScreen() {
  const router = useRouter();

  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const loadSessions = useCallback(async () => {
    try {
      const data = await getFocusSessions();

      setSessions(data);
    } catch (error) {
      console.error("Error loading focus history:", error);

      Alert.alert(
        "Error",
        "Unable to load your focus history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
  };

  const getSessionDate = (session: FocusSession) => {
    if (!session.completedAt) {
      return null;
    }

    try {
      if (typeof session.completedAt.toDate === "function") {
        return session.completedAt.toDate();
      }

      return new Date(session.completedAt);
    } catch {
      return null;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isThisWeek = (date: Date) => {
    const today = new Date();

    const day = today.getDay();
    const difference = day === 0 ? 6 : day - 1;

    const startOfWeek = new Date(today);

    startOfWeek.setDate(
      today.getDate() - difference
    );

    startOfWeek.setHours(0, 0, 0, 0);

    return date >= startOfWeek;
  };

  const isThisMonth = (date: Date) => {
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    );
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const date = getSessionDate(session);

      if (!date) {
        return false;
      }

      if (filter === "today") {
        return isToday(date);
      }

      if (filter === "week") {
        return isThisWeek(date);
      }

      if (filter === "month") {
        return isThisMonth(date);
      }

      return true;
    });
  }, [sessions, filter]);

  const totalMinutes = useMemo(() => {
    return filteredSessions.reduce(
      (total, session) =>
        total + Number(session.duration || 0),
      0
    );
  }, [filteredSessions]);

  const longestSession = useMemo(() => {
    if (filteredSessions.length === 0) {
      return 0;
    }

    return Math.max(
      ...filteredSessions.map((session) =>
        Number(session.duration || 0)
      )
    );
  }, [filteredSessions]);

  const averageSession = useMemo(() => {
    if (filteredSessions.length === 0) {
      return 0;
    }

    return Math.round(
      totalMinutes / filteredSessions.length
    );
  }, [filteredSessions, totalMinutes]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    if (remaining === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remaining} min`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getFilterTitle = () => {
    switch (filter) {
      case "today":
        return "Today's Sessions";

      case "week":
        return "This Week";

      case "month":
        return "This Month";

      default:
        return "All Sessions";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111827"
          />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            Focus History
          </Text>

          <Text style={styles.subtitle}>
            Review your focused time.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Filter */}
        <View style={styles.filterContainer}>
          {(
            [
              ["all", "All"],
              ["today", "Today"],
              ["week", "Week"],
              ["month", "Month"],
            ] as [FilterType, string][]
          ).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.filterButton,
                filter === value &&
                  styles.activeFilterButton,
              ]}
              onPress={() => setFilter(value)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === value &&
                    styles.activeFilterText,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="time-outline"
                size={22}
                color="#4F46E5"
              />
            </View>

            <Text style={styles.summaryValue}>
              {formatDuration(totalMinutes)}
            </Text>

            <Text style={styles.summaryLabel}>
              Focus Time
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="layers-outline"
                size={22}
                color="#4F46E5"
              />
            </View>

            <Text style={styles.summaryValue}>
              {filteredSessions.length}
            </Text>

            <Text style={styles.summaryLabel}>
              Sessions
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="flash-outline"
                size={22}
                color="#4F46E5"
              />
            </View>

            <Text style={styles.summaryValue}>
              {formatDuration(longestSession)}
            </Text>

            <Text style={styles.summaryLabel}>
              Longest
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="stats-chart-outline"
                size={22}
                color="#4F46E5"
              />
            </View>

            <Text style={styles.summaryValue}>
              {formatDuration(averageSession)}
            </Text>

            <Text style={styles.summaryLabel}>
              Average
            </Text>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {getFilterTitle()}
          </Text>

          <Text style={styles.sessionCount}>
            {filteredSessions.length}{" "}
            {filteredSessions.length === 1
              ? "session"
              : "sessions"}
          </Text>
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color="#4F46E5"
            />

            <Text style={styles.stateText}>
              Loading focus history...
            </Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="time-outline"
                size={42}
                color="#9CA3AF"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No focus sessions
            </Text>

            <Text style={styles.emptyText}>
              {filter === "all"
                ? "Complete your first focus session and it will appear here."
                : "No sessions were recorded during this period."}
            </Text>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => router.push("/focus")}
            >
              <Ionicons
                name="play"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.startButtonText}>
                Start Focus Session
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Session List */
          <View>
            {filteredSessions.map((session, index) => {
              const date = getSessionDate(session);

              if (!date) {
                return null;
              }

              return (
                <View
                  key={
                    session.id ??
                    `${date.getTime()}-${index}`
                  }
                  style={styles.sessionCard}
                >
                  <View style={styles.sessionIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={27}
                      color="#16A34A"
                    />
                  </View>

                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDuration}>
                      {formatDuration(
                        Number(session.duration || 0)
                      )}
                    </Text>

                    <Text style={styles.sessionDate}>
                      {formatDate(date)}
                    </Text>

                    <Text style={styles.sessionTime}>
                      Completed at {formatTime(date)}
                    </Text>
                  </View>

                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>
                      Completed
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Motivation */}
        {filteredSessions.length > 0 && (
          <View style={styles.motivationCard}>
            <Ionicons
              name="trophy-outline"
              size={28}
              color="#F59E0B"
            />

            <View style={styles.motivationTextContainer}>
              <Text style={styles.motivationTitle}>
                Keep building your focus habit
              </Text>

              <Text style={styles.motivationText}>
                You have completed{" "}
                {formatDuration(totalMinutes)} of focused
                work in this period.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#6B7280",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 5,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },

  activeFilterButton: {
    backgroundColor: "#4F46E5",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },

  summaryCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  summaryValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },

  sessionCount: {
    fontSize: 12,
    color: "#6B7280",
  },

  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sessionInfo: {
    flex: 1,
  },

  sessionDuration: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  sessionDate: {
    marginTop: 3,
    fontSize: 13,
    color: "#374151",
  },

  sessionTime: {
    marginTop: 2,
    fontSize: 12,
    color: "#9CA3AF",
  },

  completedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },

  completedBadgeText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
  },

  centerState: {
    alignItems: "center",
    paddingVertical: 50,
  },

  stateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
  },

  startButton: {
    marginTop: 18,
    backgroundColor: "#4F46E5",
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  motivationCard: {
    marginTop: 16,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  motivationTextContainer: {
    flex: 1,
  },

  motivationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#78350F",
  },

  motivationText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#92400E",
  },
});