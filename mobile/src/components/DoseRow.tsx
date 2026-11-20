import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Dose } from "@/lib/agenda";
import { formatTime } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";

// One scheduled dose with Taken / Skip buttons. Tapping the chosen one again undoes it.
export function DoseRow({ dose, day, late, divider }: { dose: Dose; day: string; late?: boolean; divider?: boolean }) {
  const c = useColors();
  const { setDose } = useStore();
  const { med, time, status } = dose;
  const mark = (s: "taken" | "skipped") => setDose(day, med.id, time, status === s ? null : s);

  return (
    <View style={[styles.row, divider && { borderTopWidth: 1, borderTopColor: c.border }]}>
      <Pressable style={styles.info} onPress={() => router.push(`/med/${med.id}`)} accessibilityRole="button">
        <Text style={[styles.time, { color: late && !status ? c.error : c.muted }]}>
          {formatTime(time)}
          {late && !status ? " · missed?" : ""}
        </Text>
        <Text style={[styles.name, { color: c.text }, status && styles.doneText]} numberOfLines={2}>
          {med.name}
        </Text>
        {!!(med.dose || med.withFood) && (
          <Text style={{ color: c.muted, fontSize: 14 }} numberOfLines={1}>
            {[med.dose, med.withFood].filter(Boolean).join(" · ")}
          </Text>
        )}
      </Pressable>
      <View style={styles.buttons}>
        {(["taken", "skipped"] as const).map((s) => {
          const on = status === s;
          return (
            <Pressable
              key={s}
              onPress={() => mark(s)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${s === "taken" ? "Taken" : "Skipped"}: ${med.name} at ${formatTime(time)}`}
              style={[
                styles.btn,
                { borderColor: s === "taken" ? c.accent : c.border, backgroundColor: on ? (s === "taken" ? c.accent : c.border) : "transparent" },
              ]}
            >
              <Text style={{ fontWeight: "700", fontSize: 14, color: on ? (s === "taken" ? c.accentText : c.text) : s === "taken" ? c.accent : c.muted }}>
                {s === "taken" ? (on ? "✓ Taken" : "Taken") : on ? "Skipped" : "Skip"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  info: { flex: 1 },
  time: { fontSize: 13, fontWeight: "700" },
  name: { fontSize: 16, fontWeight: "700" },
  doneText: { opacity: 0.6 },
  buttons: { flexDirection: "row", gap: 6 },
  btn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
});
