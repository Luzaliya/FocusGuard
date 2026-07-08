import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

type Props = {
  title: string;
  value: string;
  progress?: number;
};

export default function StatsCard({
  title,
  value,
  progress,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.value}>{value}</Text>

      {progress !== undefined && (
        <>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress, 100)}%` },
              ]}
            />
          </View>

          <Text style={styles.percent}>
            {Math.min(progress, 100)}%
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    marginHorizontal: 5,
    padding: 18,
    borderRadius: 18,
    elevation: 3,
  },

  title: {
    color: Colors.gray,
    fontSize: 16,
  },

  value: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 10,
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: 12,
    overflow: "hidden",
  },

  progressFill: {
    height: 8,
    backgroundColor: "#2563EB",
  },

  percent: {
    marginTop: 8,
    color: Colors.gray,
    fontSize: 12,
    fontWeight: "600",
  },
});