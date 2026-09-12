import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { auth, db } from "../../services/firebase";

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetMinutes: number;
  completedMinutes: number;
  completed: boolean;
  active?: boolean;
  createdAt?: any;
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetMinutes, setTargetMinutes] = useState("");

  const loadGoals = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "goals"),
        where("userId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const loadedGoals: Goal[] = snapshot.docs.map((goalDoc) => ({
        id: goalDoc.id,
        ...(goalDoc.data() as Omit<Goal, "id">),
      }));

      loadedGoals.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        return Number(b.createdAt?.seconds || 0) -
          Number(a.createdAt?.seconds || 0);
      });

      setGoals(loadedGoals);
    } catch (error) {
      console.error("Error loading goals:", error);

      Alert.alert(
        "Error",
        "Unable to load your goals. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetMinutes("");
    setShowForm(false);
  };

  const createGoal = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Login Required", "Please log in first.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const target = Number(targetMinutes);

    if (!cleanTitle) {
      Alert.alert("Missing Title", "Please enter a goal title.");
      return;
    }

    if (!target || target <= 0) {
      Alert.alert(
        "Invalid Target",
        "Please enter a target greater than 0 minutes."
      );
      return;
    }

    try {
      // Check whether the user already has an active goal.
      const activeGoalsQuery = query(
        collection(db, "goals"),
        where("userId", "==", user.uid),
        where("active", "==", true)
      );

      const activeSnapshot = await getDocs(activeGoalsQuery);

      await addDoc(collection(db, "goals"), {
        userId: user.uid,
        title: cleanTitle,
        description: cleanDescription,
        targetMinutes: target,
        completedMinutes: 0,
        completed: false,

        // If this is the first goal, automatically make it active.
        active: activeSnapshot.empty,

        createdAt: new Date(),
      });

      resetForm();

      await loadGoals();

      Alert.alert(
        "Goal Created 🎯",
        activeSnapshot.empty
          ? "Your goal has been created and set as your active goal."
          : "Your goal has been created successfully."
      );
    } catch (error) {
      console.error("Error creating goal:", error);

      Alert.alert(
        "Error",
        "Unable to create your goal. Please try again."
      );
    }
  };

  const setActiveGoal = async (goalId: string) => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    try {
      // Find all currently active goals.
      const activeQuery = query(
        collection(db, "goals"),
        where("userId", "==", user.uid),
        where("active", "==", true)
      );

      const activeSnapshot = await getDocs(activeQuery);

      // Deactivate existing active goals.
      await Promise.all(
        activeSnapshot.docs.map((activeDoc) =>
          updateDoc(activeDoc.ref, {
            active: false,
          })
        )
      );

      // Activate selected goal.
      await updateDoc(doc(db, "goals", goalId), {
        active: true,
        completed: false,
      });

      await loadGoals();

      Alert.alert(
        "Active Goal Updated",
        "Your completed focus sessions will now contribute to this goal."
      );
    } catch (error) {
      console.error("Error setting active goal:", error);

      Alert.alert(
        "Error",
        "Unable to set this goal as active."
      );
    }
  };

  const toggleCompleted = async (goal: Goal) => {
    try {
      await updateDoc(doc(db, "goals", goal.id), {
        completed: !goal.completed,

        // If manually marked incomplete, make it active.
        active: goal.completed ? true : false,
      });

      await loadGoals();
    } catch (error) {
      console.error("Error updating goal:", error);

      Alert.alert(
        "Error",
        "Unable to update this goal."
      );
    }
  };

  const deleteGoal = (goal: Goal) => {
    Alert.alert(
      "Delete Goal",
      `Are you sure you want to delete "${goal.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "goals", goal.id));

              await loadGoals();
            } catch (error) {
              console.error("Error deleting goal:", error);

              Alert.alert(
                "Error",
                "Unable to delete this goal."
              );
            }
          },
        },
      ]
    );
  };

  const getProgress = (goal: Goal) => {
    if (!goal.targetMinutes || goal.targetMinutes <= 0) {
      return 0;
    }

    return Math.min(
      goal.completedMinutes / goal.targetMinutes,
      1
    );
  };

  const formatMinutes = (minutes: number) => {
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

  const totalGoals = goals.length;
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const activeGoals = goals.filter(
    (goal) => !goal.completed
  ).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
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
            <Text style={styles.title}>Goals</Text>
            <Text style={styles.subtitle}>
              Turn your focus sessions into progress.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons
              name={showForm ? "close" : "add"}
              size={26}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {totalGoals}
            </Text>
            <Text style={styles.summaryLabel}>
              Total
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {activeGoals}
            </Text>
            <Text style={styles.summaryLabel}>
              Active
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {completedGoals}
            </Text>
            <Text style={styles.summaryLabel}>
              Done
            </Text>
          </View>
        </View>

        {/* Create Form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Create New Goal
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Goal title"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              placeholder="Description (optional)"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Target minutes e.g. 120"
              placeholderTextColor="#9CA3AF"
              value={targetMinutes}
              onChangeText={setTargetMinutes}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={createGoal}
            >
              <Ionicons
                name="checkmark-circle"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.createButtonText}>
                Create Goal
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Goal Explanation */}
        {goals.some((goal) => goal.active) && (
          <View style={styles.activeInfoCard}>
            <Ionicons
              name="flash"
              size={22}
              color="#4F46E5"
            />

            <View style={styles.activeInfoText}>
              <Text style={styles.activeInfoTitle}>
                Active Goal
              </Text>

              <Text style={styles.activeInfoDescription}>
                Completed focus sessions automatically add
                their minutes to your active goal.
              </Text>
            </View>
          </View>
        )}

        {/* Goals */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Loading goals...
            </Text>
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="flag-outline"
              size={58}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTitle}>
              No goals yet
            </Text>

            <Text style={styles.emptyText}>
              Create your first goal and start turning
              focused time into real progress.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.emptyButtonText}>
                Create Your First Goal
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => {
            const progress = getProgress(goal);

            return (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  goal.active && styles.activeGoalCard,
                  goal.completed && styles.completedGoalCard,
                ]}
              >
                {/* Goal Header */}
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleContainer}>
                    <View
                      style={[
                        styles.goalIcon,
                        goal.completed &&
                          styles.completedGoalIcon,
                      ]}
                    >
                      <Ionicons
                        name={
                          goal.completed
                            ? "checkmark"
                            : goal.active
                            ? "flash"
                            : "flag"
                        }
                        size={20}
                        color="#4F46E5"
                      />
                    </View>

                    <View style={styles.goalTitleText}>
                      <Text
                        style={[
                          styles.goalTitle,
                          goal.completed &&
                            styles.completedText,
                        ]}
                      >
                        {goal.title}
                      </Text>

                      {goal.active && !goal.completed && (
                        <Text style={styles.activeLabel}>
                          ACTIVE GOAL
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteGoal(goal)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                </View>

                {/* Description */}
                {goal.description ? (
                  <Text style={styles.description}>
                    {goal.description}
                  </Text>
                ) : null}

                {/* Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>
                      {formatMinutes(goal.completedMinutes || 0)}
                      {" / "}
                      {formatMinutes(goal.targetMinutes)}
                    </Text>

                    <Text style={styles.progressPercentage}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>

                  <View style={styles.progressBackground}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  {!goal.completed && !goal.active && (
                    <TouchableOpacity
                      style={styles.activeButton}
                      onPress={() => setActiveGoal(goal.id)}
                    >
                      <Ionicons
                        name="flash-outline"
                        size={18}
                        color="#4F46E5"
                      />

                      <Text style={styles.activeButtonText}>
                        Set Active
                      </Text>
                    </TouchableOpacity>
                  )}

                  {goal.active && !goal.completed && (
                    <View style={styles.currentActiveButton}>
                      <Ionicons
                        name="flash"
                        size={18}
                        color="#4F46E5"
                      />

                      <Text
                        style={styles.currentActiveText}
                      >
                        Active
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => toggleCompleted(goal)}
                  >
                    <Ionicons
                      name={
                        goal.completed
                          ? "refresh"
                          : "checkmark-circle-outline"
                      }
                      size={18}
                      color={
                        goal.completed
                          ? "#6B7280"
                          : "#16A34A"
                      }
                    />

                    <Text
                      style={[
                        styles.completeButtonText,
                        goal.completed &&
                          styles.completedActionText,
                      ]}
                    >
                      {goal.completed
                        ? "Mark Active"
                        : "Complete"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Motivation */}
        {goals.length > 0 && (
          <View style={styles.motivationCard}>
            <Ionicons
              name="trophy"
              size={28}
              color="#F59E0B"
            />

            <Text style={styles.motivationText}>
              Every focused minute moves you closer to
              your goals. Keep going! 💪
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  summaryNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  formTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },

  descriptionInput: {
    minHeight: 85,
    textAlignVertical: "top",
  },

  createButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  activeInfoCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  activeInfoText: {
    flex: 1,
  },

  activeInfoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#312E81",
    marginBottom: 4,
  },

  activeInfoDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#4B5563",
  },

  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  activeGoalCard: {
    borderColor: "#818CF8",
    borderWidth: 2,
  },

  completedGoalCard: {
    opacity: 0.78,
  },

  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  goalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  completedGoalIcon: {
    backgroundColor: "#DCFCE7",
  },

  goalTitleText: {
    flex: 1,
  },

  goalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  completedText: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },

  activeLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.6,
  },

  description: {
    marginTop: 13,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },

  progressSection: {
    marginTop: 18,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  progressPercentage: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4F46E5",
  },

  progressBackground: {
    height: 9,
    borderRadius: 5,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 5,
  },

  actionsRow: {
    flexDirection: "row",
    marginTop: 17,
    gap: 10,
  },

  activeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFF",
  },

  activeButtonText: {
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: 13,
  },

  currentActiveButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
  },

  currentActiveText: {
    color: "#4F46E5",
    fontWeight: "800",
    fontSize: 13,
  },

  completeButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
  },

  completeButtonText: {
    color: "#16A34A",
    fontWeight: "700",
    fontSize: 13,
  },

  completedActionText: {
    color: "#6B7280",
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
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

  emptyButton: {
    marginTop: 18,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  motivationCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 17,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  motivationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#78350F",
    fontWeight: "600",
  },
});