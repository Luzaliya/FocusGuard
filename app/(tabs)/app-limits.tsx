import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  getAppLimits,
  saveAppLimit,
} from "../../services/appLimitService";

type AppItem = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  limit: string;
  limitMinutes: number;
  enabled: boolean;
  progress: number;
};

const apps: AppItem[] = [
  {
    id: "1",
    name: "WhatsApp",
    icon: "logo-whatsapp",
    limit: "1 Hour",
    limitMinutes: 60,
    enabled: true,
    progress: 70,
  },
  {
    id: "2",
    name: "Instagram",
    icon: "logo-instagram",
    limit: "30 Minutes",
    limitMinutes: 30,
    enabled: true,
    progress: 35,
  },
  {
    id: "3",
    name: "TikTok",
    icon: "musical-notes",
    limit: "20 Minutes",
    limitMinutes: 20,
    enabled: false,
    progress: 0,
  },
  {
    id: "4",
    name: "Facebook",
    icon: "logo-facebook",
    limit: "45 Minutes",
    limitMinutes: 45,
    enabled: true,
    progress: 60,
  },
];

const limitOptions = [
  { label: "15 Minutes", minutes: 15 },
  { label: "30 Minutes", minutes: 30 },
  { label: "45 Minutes", minutes: 45 },
  { label: "1 Hour", minutes: 60 },
  { label: "2 Hours", minutes: 120 },
];

export default function AppLimitsScreen() {
  const [list, setList] = useState<AppItem[]>(apps);
  const [selectedApp, setSelectedApp] =
    useState<AppItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load saved limits from Firebase
  useEffect(() => {
    const loadLimits = async () => {
      try {
        const savedLimits = await getAppLimits();

        if (savedLimits.length > 0) {
          setList((currentList) =>
            currentList.map((app) => {
              const saved = savedLimits.find(
                (item) => item.id === app.id
              );

              if (!saved) {
                return app;
              }

              return {
                ...app,
                limitMinutes: saved.limitMinutes,
                limit:
                  saved.limitMinutes >= 60
                    ? `${saved.limitMinutes / 60} Hour${
                        saved.limitMinutes > 60 ? "s" : ""
                      }`
                    : `${saved.limitMinutes} Minutes`,
                enabled: saved.enabled,
              };
            })
          );
        }
      } catch (error) {
        console.log("Error loading app limits:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLimits();
  }, []);

  // Enable / disable an app
  const toggleApp = async (id: string) => {
    const app = list.find((item) => item.id === id);

    if (!app) return;

    const newEnabled = !app.enabled;

    setList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, enabled: newEnabled }
          : item
      )
    );

    try {
      await saveAppLimit(
        app.id,
        app.name,
        app.limitMinutes,
        newEnabled
      );
    } catch (error) {
      console.log("Error saving app status:", error);
    }
  };

  // Change the selected app's limit
  const editLimit = async (
    label: string,
    minutes: number
  ) => {
    if (!selectedApp) return;

    setSaving(true);

    try {
      await saveAppLimit(
        selectedApp.id,
        selectedApp.name,
        minutes,
        selectedApp.enabled
      );

      setList((prev) =>
        prev.map((app) =>
          app.id === selectedApp.id
            ? {
                ...app,
                limit: label,
                limitMinutes: minutes,
              }
            : app
        )
      );

      setSelectedApp(null);
    } catch (error) {
      console.log("Error saving app limit:", error);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({
    item,
  }: {
    item: AppItem;
  }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons
          name={item.icon}
          size={30}
          color="#4F46E5"
        />

        <View style={styles.appInfo}>
          <Text style={styles.appName}>{item.name}</Text>

          <Text style={styles.limit}>
            Daily Limit: {item.limit}
          </Text>
        </View>

        <Switch
          value={item.enabled}
          onValueChange={() => toggleApp(item.id)}
        />
      </View>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progress,
            { width: `${item.progress}%` },
          ]}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.usageText}>
          {item.progress}% of daily limit used
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setSelectedApp(item)}
        >
          <Text style={styles.buttonText}>
            Edit Limit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#4F46E5"
        />

        <Text style={styles.loadingText}>
          Loading app limits...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          App Usage Limits
        </Text>

        <Text style={styles.headerSubtitle}>
          Manage how long each app can be used daily.
        </Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={selectedApp !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedApp(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Set Daily Limit
            </Text>

            {selectedApp && (
              <Text style={styles.modalSubtitle}>
                {selectedApp.name}
              </Text>
            )}

            {limitOptions.map((option) => (
              <TouchableOpacity
                key={option.minutes}
                style={styles.limitOption}
                disabled={saving}
                onPress={() =>
                  editLimit(
                    option.label,
                    option.minutes
                  )
                }
              >
                <Text style={styles.limitOptionText}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              disabled={saving}
              onPress={() => setSelectedApp(null)}
            >
              <Text style={styles.cancelText}>
                {saving ? "Saving..." : "Cancel"}
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
    backgroundColor: "#F9FAFB",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: "#4F46E5",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },

  headerSubtitle: {
    color: "#E5E7EB",
    fontSize: 14,
    marginTop: 6,
  },

  list: {
    padding: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  appInfo: {
    flex: 1,
    marginLeft: 15,
  },

  appName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  limit: {
    color: "#6B7280",
    marginTop: 5,
    fontSize: 13,
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 20,
    marginTop: 18,
    overflow: "hidden",
  },

  progress: {
    height: 8,
    backgroundColor: "#4F46E5",
    borderRadius: 20,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },

  usageText: {
    color: "#6B7280",
    fontSize: 12,
  },

  button: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 35,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 20,
  },

  limitOption: {
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 10,
  },

  limitOptionText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
    color: "#111827",
  },

  cancelButton: {
    padding: 15,
    marginTop: 5,
  },

  cancelText: {
    textAlign: "center",
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 16,
  },
});