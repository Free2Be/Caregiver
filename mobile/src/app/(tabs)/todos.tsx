import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StepRow } from "@/components/StepRow";
import { parseDay } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Body, Button, Card, Heading } from "@/lib/ui";

// Every to-do from every saved document, soonest due date first.
export default function Todos() {
  const c = useColors();
  const { docs, toggleStep } = useStore();
  const [showDone, setShowDone] = useState(false);

  const all = docs.flatMap((d) =>
    d.explanation.next_steps.map((step, index) => ({ doc: d, step, index, done: d.done.includes(index) })),
  );
  const time = (s?: string) => parseDay(s)?.getTime() ?? Number.POSITIVE_INFINITY;
  const open = all.filter((t) => !t.done).sort((a, b) => time(a.step.due_date) - time(b.step.due_date));
  const dated = open.filter((t) => parseDay(t.step.due_date));
  const undated = open.filter((t) => !parseDay(t.step.due_date));
  const done = all.filter((t) => t.done);

  if (all.length === 0) {
    return (
      <View style={styles.screen}>
        <Card>
          <Heading>No to-dos yet</Heading>
          <Body muted>When you explain a document, its next steps show up here, with due dates you can add to your calendar.</Body>
        </Card>
        <Button title="Explain a document" onPress={() => router.navigate("/")} />
      </View>
    );
  }

  const row = (t: (typeof all)[number], i: number) => (
    <StepRow
      key={`${t.doc.id}-${t.index}`}
      step={t.step}
      done={t.done}
      onToggle={() => toggleStep(t.doc.id, t.index)}
      source={t.doc.title}
      divider={i > 0}
    />
  );

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {open.length === 0 && (
        <Card>
          <Heading>All caught up 🎉</Heading>
          <Body muted>Every to-do is ticked off.</Body>
        </Card>
      )}
      {dated.length > 0 && (
        <Card>
          <Heading>Coming up</Heading>
          {dated.map(row)}
        </Card>
      )}
      {undated.length > 0 && (
        <Card>
          <Heading>No set date</Heading>
          {undated.map(row)}
        </Card>
      )}
      {done.length > 0 && (
        <Pressable onPress={() => setShowDone((s) => !s)} accessibilityRole="button" style={styles.toggle}>
          <Text style={[styles.toggleText, { color: c.accent }]}>
            {showDone ? "Hide" : "Show"} {done.length} done
          </Text>
        </Pressable>
      )}
      {showDone && done.length > 0 && <Card>{done.map(row)}</Card>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  toggle: { alignSelf: "center", padding: 12 },
  toggleText: { fontSize: 15, fontWeight: "700" },
});
