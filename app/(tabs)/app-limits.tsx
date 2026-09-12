import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../services/firebase";

interface AppLimit {
  id: string;
  userId: string;
  appName: string;
  dailyLimit: number;
  createdAt?: any;
}

const APPS = [
  {
    name: "Instagram",
    icon: "logo-instagram" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "TikTok",
    icon: "musical-notes" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "Facebook",
    icon: "logo-facebook" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "YouTube",
    icon: "logo-youtube" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "X",
    icon: "logo-twitter" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "WhatsApp",
    icon: "logo-whatsapp" as keyof typeof Ionicons.glyphMap,
  },
];

const LIMIT_OPTIONS = [15, 30, 45, 60, 90, 120];

function getAppIcon(appName: string) {
  const app = APPS.find((item) => item.name === appName);

  return (
    app?.icon ||
    ("phone-portrait-outline" as keyof typeof Ionicons.glyphMap)
  );
}

function formatLimit(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min/day`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours} hr/day`;
  }

  return `${hours} hr ${remaining} min/day`;
}

export default function AppLimitsScreen() {
  const [limits, setLimits] = useState<AppLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedApp, setSelectedApp] =
    useState("Instagram");

  const [selectedLimit, setSelectedLimit] =
    useState(30);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const currentUser = auth.currentUser;

  const loadLimits = useCallback(async () => {
    if (!currentUser) {
      setLimits([]);
      setLoading(false);
      return;
    }

    try {
      const limitsQuery = query(
        collection(db, "appLimits"),
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(limitsQuery);

      const loadedLimits: AppLimit[] = snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...(item.data() as Omit<AppLimit, "id">),
        })
      );

      loadedLimits.sort(
        (a, b) =>
          String(a.appName).localeCompare(
            String(b.appName)
          )
      );

      setLimits(loadedLimits);
    } catch (error) {
      console.error(
        "Error loading app limits:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load your app limits."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      loadLimits();
    }, [loadLimits])
  );

  const openAddModal = () => {
    setEditingId(null);

    const availableApp =
      APPS.find(
        (app) =>
          !limits.some(
            (limit) => limit.appName === app.name
          )
      )?.name || "Instagram";

    setSelectedApp(availableApp);
    setSelectedLimit(30);
    setModalVisible(true);
  };

  const openEditModal = (limit: AppLimit) => {
    setEditingId(limit.id);
    setSelectedApp(limit.appName);
    setSelectedLimit(limit.dailyLimit);
    setModalVisible(true);
  };

  const saveLimit = async () => {
    if (!currentUser) {
      Alert.alert(
        "Login Required",
        "Please log in to manage app limits."
      );

      return;
    }

    if (!selectedApp || selectedLimit <= 0) {
      Alert.alert(
        "Invalid Limit",
        "Please select an app and a valid daily limit."
      );

      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const limitRef = doc(
          db,
          "appLimits",
          editingId
        );

        await updateDoc(limitRef, {
          appName: selectedApp,
          dailyLimit: selectedLimit,
          updatedAt: serverTimestamp(),
        });

        Alert.alert(
          "Limit Updated",
          `${selectedApp} is now limited to ${formatLimit(
            selectedLimit
          )}.`
        );
      } else {
        const alreadyExists = limits.some(
          (limit) =>
            limit.appName === selectedApp
        );

        if (alreadyExists) {
          Alert.alert(
            "Limit Already Exists",
            `${selectedApp} already has a daily limit. Edit the existing limit instead.`
          );

          setSaving(false);
          return;
        }

        await addDoc(collection(db, "appLimits"), {
          userId: currentUser.uid,
          appName: selectedApp,
          dailyLimit: selectedLimit,
          createdAt: serverTimestamp(),
        });

        Alert.alert(
          "Limit Saved",
          `${selectedApp} is now limited to ${formatLimit(
            selectedLimit
          )}.`
        );
      }

      setModalVisible(false);
      setEditingId(null);

      await loadLimits();
    } catch (error) {
      console.error(
        "Error saving app limit:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to save the app limit. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteLimit = (limit: AppLimit) => {
    Alert.alert(
      "Remove App Limit",
      `Are you sure you want to remove the limit for ${limit.appName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(
                doc(db, "appLimits", limit.id)
              );

              await loadLimits();

              Alert.alert(
                "Limit Removed",
                `${limit.appName} is no longer on your protection list.`
              );
            } catch (error) {
              console.error(
                "Error deleting app limit:",
                error
              );

              Alert.alert(
                "Error",
                "Unable to remove the app limit."
              );
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLimits();
  };

  const availableApps = APPS.filter(
    (app) =>
      editingId ||
      !limits.some(
        (limit) => limit.appName === app.name
      )
  );

  return (
    <View style={styles.container}>
      <ScrollView
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
          <View style={styles.headerText}>
            <Text style={styles.title}>
              App Protection
            </Text>

            <Text style={styles.subtitle}>
              Set healthy limits for distracting apps.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={27}
              color="#4F46E5"
            />
          </View>
        </View>

        {/* Protection Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="shield-checkmark"
              size={28}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              Digital Protection
            </Text>

            <Text style={styles.summaryText}>
              {limits.length === 0
                ? "You haven't set any app limits yet."
                : `${limits.length} app${
                    limits.length === 1 ? "" : "s"
                  } currently have a daily limit.`}
            </Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.addButtonText}>
            Add App Limit
          </Text>
        </TouchableOpacity>

        {/* Current Limits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Your App Limits
          </Text>

          <Text style={styles.countText}>
            {limits.length}{" "}
            {limits.length === 1 ? "app" : "apps"}
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Loading app limits...
            </Text>
          </View>
        ) : limits.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="shield-outline"
                size={32}
                color="#9CA3AF"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No app limits yet
            </Text>

            <Text style={styles.emptyDescription}>
              Add a daily limit for apps that commonly
              distract you during study time.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>
                Set Your First Limit
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.limitsCard}>
            {limits.map((limit, index) => (
              <View
                key={limit.id}
                style={[
                  styles.limitRow,
                  index === limits.length - 1 &&
                    styles.lastLimitRow,
                ]}
              >
                <View style={styles.appIcon}>
                  <Ionicons
                    name={getAppIcon(limit.appName)}
                    size={24}
                    color="#4F46E5"
                  />
                </View>

                <View style={styles.limitInfo}>
                  <Text style={styles.appName}>
                    {limit.appName}
                  </Text>

                  <Text style={styles.limitText}>
                    {formatLimit(limit.dailyLimit)}
                  </Text>

                  <View style={styles.activeRow}>
                    <View style={styles.activeDot} />

                    <Text style={styles.activeText}>
                      Protection enabled
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      openEditModal(limit)
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={19}
                      color="#4F46E5"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      deleteLimit(limit)
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color="#DC2626"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
              How App Protection Works
            </Text>

            <Text style={styles.infoText}>
              Choose an app and set the maximum amount
              of time you want to spend on it each day.
              Your preferences are saved to your
              FocusGuard account.
            </Text>
          </View>
        </View>

        {/* Honest Implementation Notice */}
        <View style={styles.noticeCard}>
          <Ionicons
            name="construct-outline"
            size={20}
            color="#92400E"
          />

          <Text style={styles.noticeText}>
            App usage monitoring and automatic blocking
            require additional Android system permissions.
            Your limits are currently stored as protection
            preferences.
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) {
            setModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingId
                    ? "Edit App Limit"
                    : "Add App Limit"}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Choose an app and daily limit.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (!saving) {
                    setModalVisible(false);
                  }
                }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={27}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* App Selection */}
            <Text style={styles.inputLabel}>
              Select App
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.appSelector
              }
            >
              {(editingId
                ? APPS
                : availableApps
              ).map((app) => {
                const selected =
                  selectedApp === app.name;

                return (
                  <TouchableOpacity
                    key={app.name}
                    style={[
                      styles.appOption,
                      selected &&
                        styles.appOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedApp(app.name)
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={app.icon}
                      size={21}
                      color={
                        selected
                          ? "#FFFFFF"
                          : "#4F46E5"
                      }
                    />

                    <Text
                      style={[
                        styles.appOptionText,
                        selected &&
                          styles.appOptionTextSelected,
                      ]}
                    >
                      {app.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Limit Selection */}
            <Text style={styles.inputLabel}>
              Daily Time Limit
            </Text>

            <View style={styles.limitOptions}>
              {LIMIT_OPTIONS.map((minutes) => {
                const selected =
                  selectedLimit === minutes;

                return (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.limitOption,
                      selected &&
                        styles.limitOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedLimit(minutes)
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.limitOptionText,
                        selected &&
                          styles.limitOptionTextSelected,
                      ]}
                    >
                      {minutes < 60
                        ? `${minutes} min`
                        : `${minutes / 60} hr`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Limit */}
            <Text style={styles.inputLabel}>
              Or enter a custom limit
            </Text>

            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                keyboardType="numeric"
                placeholder="Minutes"
                placeholderTextColor="#9CA3AF"
                onChangeText={(value) => {
                  const number = Number(value);

                  if (
                    !Number.isNaN(number) &&
                    number > 0
                  ) {
                    setSelectedLimit(number);
                  }
                }}
              />

              <Text style={styles.minutesLabel}>
                minutes/day
              </Text>
            </View>

            {/* Preview */}
            <View style={styles.previewCard}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color="#4F46E5"
              />

              <Text style={styles.previewText}>
                {selectedApp} will have a daily target
                of{" "}
                <Text style={styles.previewBold}>
                  {formatLimit(selectedLimit)}
                </Text>
                .
              </Text>
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={saveLimit}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  editingId
                    ? "checkmark-circle-outline"
                    : "save-outline"
                }
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.saveButtonText}>
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Limit"
                  : "Save Limit"}
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
    backgroundColor: "#F8FAFC",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 45,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#6B7280",
  },

  headerIcon: {
    width: 53,
    height: 53,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },

  summaryCard: {
    backgroundColor: "#4F46E5",
    borderRadius: 21,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  summaryIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginRight: 13,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  summaryText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#E0E7FF",
  },

  addButton: {
    height: 53,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 27,
  },

  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
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

  countText: {
    fontSize: 12,
    color: "#6B7280",
  },

  limitsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  limitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  lastLimitRow: {
    borderBottomWidth: 0,
  },

  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    marginRight: 12,
  },

  limitInfo: {
    flex: 1,
  },

  appName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  limitText: {
    marginTop: 3,
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "700",
  },

  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 5,
  },

  activeText: {
    fontSize: 9,
    color: "#16A34A",
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    marginLeft: 8,
  },

  actionButton: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginLeft: 6,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
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
    fontSize: 13,
    color: "#6B7280",
  },

  emptyDescription: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    maxWidth: 290,
  },

  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4F46E5",
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 17,
    padding: 15,
    marginBottom: 15,
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

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderRadius: 15,
    padding: 13,
    marginBottom: 10,
  },

  noticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    lineHeight: 16,
    color: "#92400E",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 30,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111827",
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  appSelector: {
    paddingBottom: 5,
  },

  appOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: "#EEF2FF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },

  appOptionSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },

  appOptionText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },

  appOptionTextSelected: {
    color: "#FFFFFF",
  },

  limitOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 17,
  },

  limitOption: {
    width: "31%",
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginRight: "3.5%",
    marginBottom: 8,
  },

  limitOptionSelected: {
    backgroundColor: "#4F46E5",
  },

  limitOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },

  limitOptionTextSelected: {
    color: "#FFFFFF",
  },

  customInputContainer: {
    height: 49,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  customInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },

  minutesLabel: {
    fontSize: 11,
    color: "#6B7280",
  },

  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 13,
    padding: 12,
    marginBottom: 15,
  },

  previewText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 17,
    color: "#4338CA",
  },

  previewBold: {
    fontWeight: "800",
  },

  saveButton: {
    height: 53,
    borderRadius: 15,
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});