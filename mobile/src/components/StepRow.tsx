import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { addToCalendar } from "@/lib/calendar";
import { daysUntil, dueLabel } from "@/lib/dates";
import { useColors } from "@/lib/theme";
import { Body } from "@/lib/ui";

type Step = { action: string; deadline: string; due_date?: string; why: string };

// One to-do: tick box, action, deadline, reason, and an "Add to calendar" button.
export function StepRow({
  step,
  done,
  onToggle,
  source,
  divider,
}: {
  step: Step;
  done: boolean;
  onToggle: () => void;
  source?: string; // which document it came from (shown on the To-dos tab)
  divider?: boolean;
}) {
  const c = useColors();
  const label = dueLabel(step.due_date) || step.deadline;
  const days = daysUntil(step.due_date);
  const pressing = days !== null && days <= 7 && !done;

  return (
    <View style={[styles.row, divider && { borderTopWidth: 1, borderTopColor: c.border }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={step.action}
        hitSlop={8}
        style={[styles.box, { borderColor: c.accent, backgroundColor: done ? c.accent : "transparent" }]}
      >
        {done && <Ionicons name="checkmark" size={18} color={c.accentText} />}
      </Pressable>
      <View style={styles.flex}>
        <Pressable onPress={onToggle}>
          <Body style={[styles.bold, done && styles.strike]}>{step.action}</Body>
        </Pressable>
        {!!label && (
          <Text
            style={[
              styles.deadline,
              {
                backgroundColor: pressing ? c.urgentBg : "transparent",
                borderColor: pressing ? c.urgentBorder : c.border,
                color: c.text,
              },
            ]}
          >
            {label}
          </Text>
        )}
        {!!source && <Body muted style={styles.small}>From: {source}</Body>}
        {!done && !!step.why && <Body muted style={styles.small}>{step.why}</Body>}
        {!done && (
          <Pressable
            onPress={() => addToCalendar(step.action, step.due_date, [step.deadline, step.why].filter(Boolean).join("\n"))}
            style={styles.calendar}
            accessibilityRole="button"
            hitSlop={6}
          >
            <Ionicons name="calendar-outline" size={16} color={c.accent} />
            <Text style={[styles.calendarText, { color: c.accent }]}>
              {step.due_date ? "Add to calendar" : "Add to calendar (pick a date)"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  box: { width: 26, height: 26, borderWidth: 2, borderRadius: 7, alignItems: "center", justifyContent: "center", marginTop: 1 },
  flex: { flex: 1 },
  bold: { fontWeight: "700" },
  strike: { textDecorationLine: "line-through", opacity: 0.55 },
  small: { fontSize: 14, marginTop: 2 },
  deadline: {
    alignSelf: "flex-start",
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginVertical: 4,
    overflow: "hidden",
  },
  calendar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, alignSelf: "flex-start" },
  calendarText: { fontSize: 14, fontWeight: "700" },
});
