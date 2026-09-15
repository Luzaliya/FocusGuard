import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

import { auth, db } from "@/services/firebase";
import {
  formatUsageTime,
  getTodayAppUsage,
  hasUsageAccess,
  openUsageAccessSettings,
} from "@/services/usageStatsService";

interface AppLimit {
  id: string;
  userId: string;
  appName: string;
  dailyLimit: number;
  createdAt?: any;
}

interface UsageData {
  [appName: string]: number;
}

const APPS = [
  {
    name: "Instagram",
    icon: "logo-instagram" as const,
  },
  {
    name: "TikTok",
    icon: "musical-notes" as const,
  },
  {
    name: "Facebook",
    icon: "logo-facebook" as const,
  },
  {
    name: "YouTube",
    icon: "logo-youtube" as const,
  },
  {
    name: "X",
    icon: "logo-twitter" as const,
  },
  {
    name: "WhatsApp",
    icon: "logo-whatsapp" as const,
  },
];

const LIMIT_OPTIONS = [15, 30, 45, 60, 90, 120];

export default function AppLimitsScreen() {
  const [limits, setLimits] = useState<AppLimit[]>([]);
  const [usage, setUsage] = useState<UsageData>({});
  const [usageAccessGranted, setUsageAccessGranted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingUsage, setCheckingUsage] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingLimit, setEditingLimit] = useState<AppLimit | null>(null);

  const [selectedApp, setSelectedApp] = useState("Instagram");
  const [selectedLimit, setSelectedLimit] = useState(60);
  const [customLimit, setCustomLimit] = useState("");

  const currentUser = auth.currentUser;

  const checkUsageAccess = useCallback(() => {
    if (Platform.OS !== "android") {
      setUsageAccessGranted(false);
      return;
    }

    try {
      const granted = hasUsageAccess();
      setUsageAccessGranted(granted);
      return granted;
    } catch (error) {
      console.log("Usage access check failed:", error);
      setUsageAccessGranted(false);
      return false;
    }
  }, []);

  const loadLimits = useCallback(async () => {
    if (!currentUser) {
      setLimits([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "appLimits"),
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);

      const loadedLimits: AppLimit[] = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<AppLimit, "id">),
      }));

      setLimits(loadedLimits);
    } catch (error) {
      console.error("Error loading app limits:", error);

      Alert.alert(
        "Error",
        "Unable to load your app limits. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  const loadUsage = useCallback(async () => {
    if (Platform.OS !== "android") {
      return;
    }

    if (!currentUser) {
      return;
    }

    const granted = checkUsageAccess();

    if (!granted) {
      setUsage({});
      return;
    }

    if (limits.length === 0) {
      setUsage({});
      return;
    }

    setCheckingUsage(true);

    try {
      const usageResults: UsageData = {};

      for (const limit of limits) {
        try {
          const result = await getTodayAppUsage(limit.appName);

          if (result) {
            usageResults[limit.appName] =
              result.totalTimeInForeground;
          }
        } catch (error) {
          console.log(
            `Unable to get usage for ${limit.appName}:`,
            error
          );
        }
      }

      setUsage(usageResults);
    } catch (error) {
      console.error("Error loading usage:", error);
    } finally {
      setCheckingUsage(false);
    }
  }, [currentUser, limits, checkUsageAccess]);

  useEffect(() => {
    loadLimits();
  }, [loadLimits]);

  useFocusEffect(
    useCallback(() => {
      checkUsageAccess();

      loadLimits();
    }, [checkUsageAccess, loadLimits])
  );

  useEffect(() => {
    if (usageAccessGranted && limits.length > 0) {
      loadUsage();
    }
  }, [usageAccessGranted, limits.length]);

  const onRefresh = async () => {
    setRefreshing(true);

    checkUsageAccess();

    await loadLimits();

    if (usageAccessGranted) {
      await loadUsage();
    }
  };

  const openAddModal = () => {
    setEditingLimit(null);
    setSelectedApp("Instagram");
    setSelectedLimit(60);
    setCustomLimit("");
    setModalVisible(true);
  };

  const openEditModal = (limit: AppLimit) => {
    setEditingLimit(limit);
    setSelectedApp(limit.appName);

    if (LIMIT_OPTIONS.includes(limit.dailyLimit)) {
      setSelectedLimit(limit.dailyLimit);
      setCustomLimit("");
    } else {
      setSelectedLimit(0);
      setCustomLimit(String(limit.dailyLimit));
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingLimit(null);
    setCustomLimit("");
  };

  const saveLimit = async () => {
    if (!currentUser) {
      Alert.alert("Login Required", "Please sign in first.");
      return;
    }

    let finalLimit = selectedLimit;

    if (selectedLimit === 0) {
      finalLimit = Number(customLimit);

      if (!finalLimit || finalLimit <= 0) {
        Alert.alert(
          "Invalid Limit",
          "Please enter a valid number of minutes."
        );
        return;
      }
    }

    try {
      if (editingLimit) {
        await updateDoc(doc(db, "appLimits", editingLimit.id), {
          appName: selectedApp,
          dailyLimit: finalLimit,
          updatedAt: serverTimestamp(),
        });

        Alert.alert("Success", "App limit updated.");
      } else {
        const existingQuery = query(
          collection(db, "appLimits"),
          where("userId", "==", currentUser.uid),
          where("appName", "==", selectedApp)
        );

        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
          Alert.alert(
            "Already Added",
            `${selectedApp} already has a daily limit. Edit the existing limit instead.`
          );
          return;
        }

        await addDoc(collection(db, "appLimits"), {
          userId: currentUser.uid,
          appName: selectedApp,
          dailyLimit: finalLimit,
          createdAt: serverTimestamp(),
        });

        Alert.alert("Success", `${selectedApp} limit added.`);
      }

      closeModal();
      await loadLimits();
    } catch (error) {
      console.error("Error saving app limit:", error);

      Alert.alert(
        "Error",
        "Unable to save the app limit. Please try again."
      );
    }
  };

  const deleteLimit = (limit: AppLimit) => {
    const performDelete = async () => {
      try {
        await deleteDoc(doc(db, "appLimits", limit.id));

        setLimits((previous) =>
          previous.filter((item) => item.id !== limit.id)
        );

        setUsage((previous) => {
          const updated = { ...previous };
          delete updated[limit.appName];
          return updated;
        });
      } catch (error) {
        console.error("Error deleting limit:", error);

        Alert.alert(
          "Error",
          "Unable to delete this app limit."
        );
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Delete the ${limit.appName} limit?`
      );

      if (confirmed) {
        performDelete();
      }

      return;
    }

    Alert.alert(
      "Delete Limit",
      `Are you sure you want to remove the ${limit.appName} limit?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  const getUsagePercentage = (
    appName: string,
    dailyLimit: number
  ) => {
    const usedMilliseconds = usage[appName] || 0;
    const usedMinutes = usedMilliseconds / 60000;

    if (dailyLimit <= 0) {
      return 0;
    }

    return Math.min((usedMinutes / dailyLimit) * 100, 100);
  };

  const isLimitReached = (
    appName: string,
    dailyLimit: number
  ) => {
    const usedMilliseconds = usage[appName] || 0;
    const usedMinutes = usedMilliseconds / 60000;

    return usedMinutes >= dailyLimit;
  };

  const getAppIcon = (appName: string) => {
    const app = APPS.find((item) => item.name === appName);

    return app?.icon || "apps";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>App Limits</Text>

          <Text style={styles.subtitle}>
            Manage your daily social media usage and stay focused.
          </Text>
        </View>

        {/* USAGE ACCESS CARD */}
        <View style={styles.usageAccessCard}>
          <View style={styles.usageAccessHeader}>
            <View style={styles.usageIconContainer}>
              <Ionicons
                name="analytics-outline"
                size={24}
                color="#111827"
              />
            </View>

            <View style={styles.usageHeaderText}>
              <Text style={styles.usageAccessTitle}>
                Usage Monitoring
              </Text>

              <Text style={styles.usageAccessSubtitle}>
                {usageAccessGranted
                  ? "Real app usage monitoring is enabled."
                  : "Permission is required to monitor app usage."}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusContainer,
              usageAccessGranted
                ? styles.statusEnabled
                : styles.statusDisabled,
            ]}
          >
            <Ionicons
              name={
                usageAccessGranted
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={18}
              color={
                usageAccessGranted
                  ? "#15803D"
                  : "#B45309"
              }
            />

            <Text
              style={[
                styles.statusText,
                usageAccessGranted
                  ? styles.statusTextEnabled
                  : styles.statusTextDisabled,
              ]}
            >
              {usageAccessGranted
                ? "Usage Access is enabled"
                : "Usage Access is required"}
            </Text>
          </View>

          {!usageAccessGranted &&
            Platform.OS === "android" && (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={openUsageAccessSettings}
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.permissionButtonText}>
                  Grant Usage Access
                </Text>
              </TouchableOpacity>
            )}

          {usageAccessGranted && (
            <TouchableOpacity
              style={styles.refreshUsageButton}
              onPress={loadUsage}
              disabled={checkingUsage}
            >
              <Ionicons
                name="refresh"
                size={18}
                color="#111827"
              />

              <Text style={styles.refreshUsageText}>
                {checkingUsage
                  ? "Checking usage..."
                  : "Refresh Usage"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* INFORMATION CARD */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#4B5563"
          />

          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>
              How App Protection Works
            </Text>

            <Text style={styles.infoText}>
              FocusGuard reads your Android app usage to compare
              your actual screen time with the limits you set.
            </Text>
          </View>
        </View>

        {/* ADD BUTTON */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Ionicons
            name="add"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.addButtonText}>
            Add App Limit
          </Text>
        </TouchableOpacity>

        {/* APP LIMITS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Your App Limits
          </Text>

          {limits.length > 0 && (
            <Text style={styles.sectionCount}>
              {limits.length} app
              {limits.length === 1 ? "" : "s"}
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Loading your app limits...
            </Text>
          </View>
        ) : limits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="hourglass-outline"
              size={42}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTitle}>
              No App Limits Yet
            </Text>

            <Text style={styles.emptyText}>
              Add a daily limit for an app to start monitoring
              your screen time.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openAddModal}
            >
              <Text style={styles.emptyButtonText}>
                Add Your First Limit
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          limits.map((limit) => {
            const usedMilliseconds =
              usage[limit.appName] || 0;

            const percentage = getUsagePercentage(
              limit.appName,
              limit.dailyLimit
            );

            const reached = isLimitReached(
              limit.appName,
              limit.dailyLimit
            );

            return (
              <View
                key={limit.id}
                style={styles.limitCard}
              >
                <View style={styles.limitTopRow}>
                  <View style={styles.appIconContainer}>
                    <Ionicons
                      name={getAppIcon(limit.appName) as any}
                      size={25}
                      color="#111827"
                    />
                  </View>

                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>
                      {limit.appName}
                    </Text>

                    <Text style={styles.limitText}>
                      Daily limit: {limit.dailyLimit} min
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => openEditModal(limit)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={19}
                        color="#374151"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => deleteLimit(limit)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#DC2626"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {usageAccessGranted ? (
                  <>
                    <View style={styles.usageRow}>
                      <Text style={styles.usageLabel}>
                        Used today
                      </Text>

                      <Text
                        style={[
                          styles.usageValue,
                          reached &&
                            styles.usageValueReached,
                        ]}
                      >
                        {formatUsageTime(
                          usedMilliseconds
                        )}
                      </Text>
                    </View>

                    <View style={styles.progressBackground}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percentage}%`,
                          },
                          reached &&
                            styles.progressFillReached,
                        ]}
                      />
                    </View>

                    <View style={styles.progressFooter}>
                      <Text style={styles.progressPercentage}>
                        {Math.round(percentage)}% used
                      </Text>

                      {reached && (
                        <View style={styles.reachedBadge}>
                          <Ionicons
                            name="warning"
                            size={13}
                            color="#B91C1C"
                          />

                          <Text style={styles.reachedText}>
                            Limit reached
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.monitoringDisabled}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color="#6B7280"
                    />

                    <Text style={styles.monitoringDisabledText}>
                      Grant Usage Access to see actual usage.
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.bottomNotice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#6B7280"
          />

          <Text style={styles.bottomNoticeText}>
            FocusGuard uses Android Usage Access to measure app
            usage. Automatic app blocking will be added in the
            next stage.
          </Text>
        </View>
      </ScrollView>

      {/* ADD / EDIT MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLimit
                  ? "Edit App Limit"
                  : "Add App Limit"}
              </Text>

              <TouchableOpacity onPress={closeModal}>
                <Ionicons
                  name="close"
                  size={25}
                  color="#374151"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              Select App
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.appSelector}
            >
              {APPS.map((app) => (
                <TouchableOpacity
                  key={app.name}
                  style={[
                    styles.appOption,
                    selectedApp === app.name &&
                      styles.appOptionSelected,
                  ]}
                  onPress={() =>
                    setSelectedApp(app.name)
                  }
                >
                  <Ionicons
                    name={app.icon}
                    size={20}
                    color={
                      selectedApp === app.name
                        ? "#FFFFFF"
                        : "#374151"
                    }
                  />

                  <Text
                    style={[
                      styles.appOptionText,
                      selectedApp === app.name &&
                        styles.appOptionTextSelected,
                    ]}
                  >
                    {app.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>
              Daily Limit
            </Text>

            <View style={styles.limitOptions}>
              {LIMIT_OPTIONS.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.limitOption,
                    selectedLimit === minutes &&
                      styles.limitOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedLimit(minutes);
                    setCustomLimit("");
                  }}
                >
                  <Text
                    style={[
                      styles.limitOptionText,
                      selectedLimit === minutes &&
                        styles.limitOptionTextSelected,
                    ]}
                  >
                    {minutes} min
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.limitOption,
                  selectedLimit === 0 &&
                    styles.limitOptionSelected,
                ]}
                onPress={() => setSelectedLimit(0)}
              >
                <Text
                  style={[
                    styles.limitOptionText,
                    selectedLimit === 0 &&
                      styles.limitOptionTextSelected,
                  ]}
                >
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {selectedLimit === 0 && (
              <TextInput
                style={styles.customInput}
                value={customLimit}
                onChangeText={setCustomLimit}
                placeholder="Enter minutes"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveLimit}
            >
              <Text style={styles.saveButtonText}>
                {editingLimit
                  ? "Update Limit"
                  : "Save Limit"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModal}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    marginTop: 6,
  },

  usageAccessCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  usageAccessHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  usageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  usageHeaderText: {
    flex: 1,
  },

  usageAccessTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  usageAccessSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginTop: 3,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
  },

  statusEnabled: {
    backgroundColor: "#DCFCE7",
  },

  statusDisabled: {
    backgroundColor: "#FEF3C7",
  },

  statusText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
  },

  statusTextEnabled: {
    color: "#15803D",
  },

  statusTextDisabled: {
    color: "#B45309",
  },

  permissionButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 7,
  },

  refreshUsageButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  refreshUsageText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 7,
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 15,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  infoTextContainer: {
    flex: 1,
    marginLeft: 10,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
  },

  addButton: {
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 7,
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

  sectionCount: {
    fontSize: 13,
    color: "#6B7280",
  },

  limitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  limitTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  appIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  appInfo: {
    flex: 1,
    marginLeft: 12,
  },

  appName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  limitText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },

  actionButtons: {
    flexDirection: "row",
    gap: 6,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },

  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },

  usageLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  usageValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  usageValueReached: {
    color: "#DC2626",
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#111827",
    borderRadius: 10,
  },

  progressFillReached: {
    backgroundColor: "#DC2626",
  },

  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 7,
  },

  progressPercentage: {
    fontSize: 12,
    color: "#6B7280",
  },

  reachedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  reachedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
    marginLeft: 4,
  },

  monitoringDisabled: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    padding: 11,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
  },

  monitoringDisabledText: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 7,
  },

  emptyCard: {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    padding: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyContainer: {
    alignItems: "center",
    padding: 30,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 7,
  },

  emptyButton: {
    backgroundColor: "#111827",
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 18,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  bottomNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    padding: 15,
    backgroundColor: "#F9FAFB",
    borderRadius: 13,
  },

  bottomNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 22,
    paddingBottom: 30,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111827",
  },

  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },

  appSelector: {
    marginBottom: 20,
  },

  appOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },

  appOptionSelected: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  appOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 6,
  },

  appOptionTextSelected: {
    color: "#FFFFFF",
  },

  limitOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  limitOption: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  limitOptionSelected: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  limitOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  limitOptionTextSelected: {
    color: "#FFFFFF",
  },

  customInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 15,
  },

  saveButton: {
    backgroundColor: "#111827",
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 5,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: 13,
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
});