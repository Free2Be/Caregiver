import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppointmentRow } from "@/components/AppointmentRow";
import { DoseRow } from "@/components/DoseRow";
import { StepRow } from "@/components/StepRow";
import { allTodos, byDueDate, dosesForDay, missedDoses } from "@/lib/agenda";
import { addDays, daysUntil, todayKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Body, Button, Card, Heading } from "@/lib/ui";

// The home screen: today's medicines and what's coming up this week.
export default function Today() {
  const c = useColors();
  const { meds, doses, appts, docs, toggleStep, loaded } = useStore();
  const today = todayKey();
  const weekEnd = addDays(today, 7);

  const todaysDoses = dosesForDay(meds, doses, today);
  const missed = new Set(missedDoses(todaysDoses));
  const taken = todaysDoses.filter((d) => d.status === "taken").length;

  const upcomingAppts = appts
    .filter((a) => a.date >= today && a.date <= weekEnd)
    .sort((a, b) => (a.date + (a.time || "99")).localeCompare(b.date + (b.time || "99")));
  const openTodos = allTodos(docs).filter((t) => !t.done);
  const dueSoon = openTodos.filter((t) => {
    const n = daysUntil(t.step.due_date);
    return n !== null && n <= 7;
  }).sort(byDueDate);

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const empty = loaded && meds.length === 0 && appts.length === 0 && docs.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={[styles.date, { color: c.muted }]}>{dateLabel}</Text>

      {empty && (
        <Card>
          <Heading>Welcome 👋</Heading>
          <Body muted>
            Keep track of someone's care in one place: explain confusing paperwork, set medicine reminders, and keep
            appointments and to-dos on a calendar. Everything stays on this phone.
          </Body>
        </Card>
      )}

      <View style={styles.actions}>
        <Button title="📄  Explain paperwork" onPress={() => router.push("/explain")} />
        <View style={styles.row2}>
          <View style={styles.flex}>
            <Button title="💊 Add medicine" variant="secondary" onPress={() => router.navigate("/medicines")} />
          </View>
          <View style={styles.flex}>
            <Button title="📅 Add visit" variant="secondary" onPress={() => router.push(`/appt/new?date=${today}`)} />
          </View>
        </View>
      </View>

      {todaysDoses.length > 0 && (
        <Card>
          <Heading>Today's medicines</Heading>
          <Body muted style={styles.sub}>
            {taken} of {todaysDoses.length} doses taken
          </Body>
          {todaysDoses.map((d, i) => (
            <DoseRow key={`${d.med.id}@${d.time}`} dose={d} day={today} late={missed.has(d)} divider={i > 0} />
          ))}
        </Card>
      )}

      {upcomingAppts.length > 0 && (
        <Card>
          <Heading>Visits this week</Heading>
          {upcomingAppts.map((a, i) => (
            <AppointmentRow key={a.id} appt={a} showDate divider={i > 0} />
          ))}
        </Card>
      )}

      {dueSoon.length > 0 && (
        <Card urgent={dueSoon.some((t) => (daysUntil(t.step.due_date) ?? 1) < 0)}>
          <Heading>To-dos due soon</Heading>
          {dueSoon.map((t, i) => (
            <StepRow
              key={`${t.doc.id}-${t.index}`}
              step={t.step}
              done={t.done}
              onToggle={() => toggleStep(t.doc.id, t.index)}
              source={t.doc.title}
              divider={i > 0}
            />
          ))}
        </Card>
      )}

      {openTodos.length > dueSoon.length && (
        <Button
          title={`See all ${openTodos.length} open to-dos`}
          variant="secondary"
          onPress={() => router.push("/todos")}
        />
      )}

      {!empty && todaysDoses.length === 0 && upcomingAppts.length === 0 && dueSoon.length === 0 && (
        <Card>
          <Heading>Nothing scheduled today</Heading>
          <Body muted>Medicines with set times, visits this week, and to-dos due soon show up here.</Body>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  date: { fontSize: 15, fontWeight: "600", marginBottom: 12 },
  actions: { gap: 10, marginBottom: 16 },
  row2: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  sub: { fontSize: 14, marginTop: -4 },
});
