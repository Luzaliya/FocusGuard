import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

type Props = {
  title: string;
  value: string;
};

export default function StatsCard({ title, value }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 5,
    elevation: 3,
  },

  title: {
    color: Colors.gray,
    fontSize: 14,
  },

  value: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 10,
  },
});