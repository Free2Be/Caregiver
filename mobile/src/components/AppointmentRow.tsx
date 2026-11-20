import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatDay } from "@/lib/dates";
import { formatTime } from "@/lib/reminders";
import { useColors } from "@/lib/theme";
import type { Appointment } from "@/lib/types";

export function AppointmentRow({ appt, showDate, divider }: { appt: Appointment; showDate?: boolean; divider?: boolean }) {
  const c = useColors();
  const when = [showDate ? formatDay(appt.date) : "", appt.time ? formatTime(appt.time) : showDate ? "" : "Any time"]
    .filter(Boolean)
    .join(" · ");
  return (
    <Pressable
      onPress={() => router.push(`/appt/${appt.id}`)}
      accessibilityRole="button"
      style={[styles.row, divider && { borderTopWidth: 1, borderTopColor: c.border }]}
    >
      <Ionicons name="medical-outline" size={20} color={c.accent} style={styles.icon} />
      <View style={styles.flex}>
        <Text style={[styles.title, { color: c.text }]}>{appt.title}</Text>
        <Text style={{ color: c.muted, fontSize: 14 }}>{[when, appt.location].filter(Boolean).join(" · ")}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  icon: { marginTop: 1 },
  flex: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700" },
});
