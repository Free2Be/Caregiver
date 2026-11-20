import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { readLabel } from "@/lib/api";
import { defaultTimes } from "@/lib/dates";
import { PageError, choosePhotos, takePhoto } from "@/lib/pages";
import { formatTime } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import type { Medicine, Page } from "@/lib/types";
import { Body, Button, Card, Heading } from "@/lib/ui";

export default function Medicines() {
  const c = useColors();
  const { meds } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const active = meds.filter((m) => m.active).sort((a, b) => a.name.localeCompare(b.name));
  const stopped = meds.filter((m) => !m.active);

  // Photo of the label -> the server reads it -> open the form filled in to check.
  async function scan(source: () => Promise<Page[] | "denied">) {
    setError("");
    setBusy(true);
    try {
      const pages = await source();
      if (pages === "denied") {
        Alert.alert("Camera access needed", "Allow camera access in your phone's Settings to photograph labels.");
        return;
      }
      if (pages.length === 0) return;
      const { label } = await readLabel(pages.slice(0, 2));
      if (!label.readable) {
        setError("We couldn't read that label. Try a closer, sharper photo in good light.");
        return;
      }
      const prefill = {
        name: label.name,
        strength: label.strength,
        dose: label.dose,
        instructions: label.instructions,
        times: label.as_needed ? [] : defaultTimes(label.times_per_day, label.bedtime),
        asNeeded: label.as_needed,
        withFood: label.with_food,
        purpose: label.purpose,
        prescriber: label.prescriber,
        pharmacy: label.pharmacy,
        refills: label.refills,
        warnings: label.warnings,
        source: "label",
      };
      router.push({ pathname: "/med/[id]", params: { id: "new", prefill: JSON.stringify(prefill) } });
    } catch (e) {
      setError(e instanceof PageError || e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card>
        <Heading>Add a medicine</Heading>
        <Body muted style={styles.sub}>
          Photograph the pharmacy label and we'll fill in the details for you to check.
        </Body>
        <View style={styles.gap}>
          <Button title="📷  Scan a label" onPress={() => scan(takePhoto)} disabled={busy} />
          <Button title="🖼️  Choose a photo of a label" variant="secondary" onPress={() => scan(() => choosePhotos(1))} disabled={busy} />
          <Button title="✏️  Type it in" variant="secondary" onPress={() => router.push("/med/new")} disabled={busy} />
        </View>
        {busy && (
          <View style={styles.waiting}>
            <ActivityIndicator color={c.accent} />
            <Body muted style={styles.sub}>Reading the label…</Body>
          </View>
        )}
        {!!error && <Text style={[styles.error, { color: c.error }]}>{error}</Text>}
      </Card>

      {active.length > 0 && (
        <Card>
          <Heading>Taking now ({active.length})</Heading>
          {active.map((m, i) => (
            <MedRow key={m.id} med={m} divider={i > 0} />
          ))}
        </Card>
      )}

      {stopped.length > 0 && (
        <Card>
          <Heading>No longer taking</Heading>
          {stopped.map((m, i) => (
            <MedRow key={m.id} med={m} divider={i > 0} />
          ))}
        </Card>
      )}

      <Body muted style={styles.footer}>
        This list records what the label or doctor says. It doesn't check for drug interactions or give dosing advice.
        Ask the pharmacist or doctor about any changes.
      </Body>
    </ScrollView>
  );
}

function MedRow({ med, divider }: { med: Medicine; divider?: boolean }) {
  const c = useColors();
  const when = med.asNeeded ? "As needed" : med.times.length ? med.times.map(formatTime).join(", ") : "No set times";
  return (
    <Pressable
      onPress={() => router.push(`/med/${med.id}`)}
      accessibilityRole="button"
      style={[styles.row, divider && { borderTopWidth: 1, borderTopColor: c.border }]}
    >
      <View style={styles.flex}>
        <Text style={[styles.name, { color: c.text }]}>
          {med.name}
          {med.strength ? <Text style={{ fontWeight: "400" }}> {med.strength}</Text> : null}
        </Text>
        <Text style={{ color: c.muted, fontSize: 14 }}>
          {[med.dose, when].filter(Boolean).join(" · ")}
          {med.remind && med.active && !med.asNeeded && med.times.length ? "  🔔" : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  sub: { fontSize: 14, marginBottom: 10 },
  gap: { gap: 10 },
  waiting: { alignItems: "center", marginTop: 12 },
  error: { marginTop: 12, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  footer: { fontSize: 13, textAlign: "center", marginTop: 8 },
});
