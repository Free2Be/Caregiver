import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppointmentRow } from "@/components/AppointmentRow";
import { StepRow } from "@/components/StepRow";
import { allTodos, appointmentsOn, dosesForDay, todosDueOn } from "@/lib/agenda";
import { dayKey, formatDay, todayKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Body, Button, Card, Heading } from "@/lib/ui";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Month grid with a dot for visits and to-dos, and the chosen day's list below.
export default function Calendar() {
  const c = useColors();
  const { appts, docs, meds, doses, toggleStep } = useStore();
  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const todos = allTodos(docs);
  const apptDays = new Set(appts.map((a) => a.date));
  const todoDays = new Set(todos.filter((t) => !t.done && t.step.due_date).map((t) => t.step.due_date as string));

  // Six rows of seven days covering the month.
  const first = new Date(month);
  first.setDate(1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return d;
  });
  const rows = cells.slice(35).every((d) => d.getMonth() !== month.getMonth()) ? 5 : 6;

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const dayAppts = appointmentsOn(appts, selected);
  const dayTodos = todosDueOn(todos, selected);
  const dayDoses = selected >= today ? dosesForDay(meds, doses, selected) : [];
  const dayDosesTaken = dosesForDay(meds, doses, selected).filter((d) => d.status === "taken").length;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card>
        <View style={styles.header}>
          <Pressable onPress={() => shift(-1)} accessibilityLabel="Previous month" hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={c.accent} />
          </Pressable>
          <Text style={[styles.month, { color: c.text }]}>
            {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </Text>
          <Pressable onPress={() => shift(1)} accessibilityLabel="Next month" hitSlop={10}>
            <Ionicons name="chevron-forward" size={24} color={c.accent} />
          </Pressable>
        </View>
        <View style={styles.week}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={[styles.weekday, { color: c.muted }]}>
              {w}
            </Text>
          ))}
        </View>
        {Array.from({ length: rows }, (_, r) => (
          <View key={r} style={styles.week}>
            {cells.slice(r * 7, r * 7 + 7).map((d) => {
              const key = dayKey(d);
              const inMonth = d.getMonth() === month.getMonth();
              const isSel = key === selected;
              const isToday = key === today;
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelected(key)}
                  accessibilityLabel={formatDay(key)}
                  accessibilityState={{ selected: isSel }}
                  style={[
                    styles.day,
                    isSel && { backgroundColor: c.accent },
                    !isSel && isToday && { borderWidth: 1, borderColor: c.accent },
                  ]}
                >
                  <Text style={{ color: isSel ? c.accentText : inMonth ? c.text : c.muted, opacity: inMonth ? 1 : 0.5, fontWeight: isToday ? "800" : "500" }}>
                    {d.getDate()}
                  </Text>
                  <View style={styles.dots}>
                    {apptDays.has(key) && <View style={[styles.dot, { backgroundColor: isSel ? c.accentText : c.accent }]} />}
                    {todoDays.has(key) && <View style={[styles.dot, { backgroundColor: isSel ? c.accentText : c.urgentBorder }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: c.accent }]} />
          <Text style={{ color: c.muted, fontSize: 13 }}>Visit</Text>
          <View style={[styles.dot, { backgroundColor: c.urgentBorder, marginLeft: 12 }]} />
          <Text style={{ color: c.muted, fontSize: 13 }}>To-do due</Text>
        </View>
      </Card>

      <Card>
        <Heading>{selected === today ? `Today · ${formatDay(selected)}` : formatDay(selected)}</Heading>
        {dayAppts.map((a, i) => (
          <AppointmentRow key={a.id} appt={a} divider={i > 0} />
        ))}
        {dayTodos.map((t, i) => (
          <StepRow
            key={`${t.doc.id}-${t.index}`}
            step={t.step}
            done={t.done}
            onToggle={() => toggleStep(t.doc.id, t.index)}
            source={t.doc.title}
            divider={i > 0 || dayAppts.length > 0}
          />
        ))}
        {(dayDoses.length > 0 || dayDosesTaken > 0) && (
          <Body muted style={styles.meds}>
            💊 {selected < today ? `${dayDosesTaken} doses marked taken` : `${dayDoses.length} medicine doses scheduled`}
          </Body>
        )}
        {dayAppts.length === 0 && dayTodos.length === 0 && <Body muted>Nothing on this day.</Body>}
        <View style={styles.add}>
          <Button title="+ Add a visit on this day" variant="secondary" onPress={() => router.push(`/appt/new?date=${selected}`)} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  month: { fontSize: 18, fontWeight: "700" },
  week: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  day: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 999, margin: 1 },
  dots: { flexDirection: "row", gap: 3, height: 6, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  meds: { marginTop: 8, fontSize: 14 },
  add: { marginTop: 12 },
});
