import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { addToCalendar } from "@/lib/calendar";
import { formatDay, todayKey } from "@/lib/dates";
import { pickDate, pickTime } from "@/lib/pickers";
import { ensureReminders, formatTime } from "@/lib/reminders";
import { type AppointmentInput, useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Body, Button, Card, Chip, Field, SwitchRow } from "@/lib/ui";

// Add or edit an appointment. id "new" adds one; ?date= and ?prefill=JSON fill it in.
export default function AppointmentScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ id: string; date?: string; prefill?: string }>();
  const { appts, saveAppointment, removeAppointment } = useStore();
  const existing = appts.find((a) => a.id === params.id);

  const initial = useMemo<AppointmentInput>(() => {
    if (existing) return existing;
    let prefill: Partial<AppointmentInput> = {};
    try {
      prefill = params.prefill ? JSON.parse(params.prefill) : {};
    } catch {}
    return { title: "", date: params.date ?? "", time: "", location: "", notes: "", remind: true, ...prefill };
  }, [existing, params.date, params.prefill]);

  const [a, setA] = useState<AppointmentInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof AppointmentInput>(k: K, v: AppointmentInput[K]) => setA((prev) => ({ ...prev, [k]: v }));

  if (params.id !== "new" && !existing) {
    return (
      <View style={styles.screen}>
        <Body>This appointment was deleted.</Body>
      </View>
    );
  }

  async function onSave() {
    if (!a.title.trim()) return setError("Please enter what the appointment is.");
    if (!a.date) return setError("Please pick a date. If it isn't booked yet, add it as a to-do instead.");
    setError("");
    setSaving(true);
    try {
      if (a.remind && !(await ensureReminders()) && Platform.OS !== "web") {
        Alert.alert("Reminders are off", "Notifications are turned off for this app. You can turn them on in your phone's Settings.");
      }
      await saveAppointment({ ...a, title: a.title.trim() }, existing?.id);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    const remove = async () => {
      await removeAppointment(existing!.id);
      router.back();
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm?.("Delete this appointment?")) remove();
      return;
    }
    Alert.alert("Delete this appointment?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: existing ? "Appointment" : "Add appointment" }} />
      <Card>
        <Field label="What is it?" value={a.title} onChangeText={(v) => set("title", v)} placeholder="e.g. Cardiology follow-up" />

        <Text style={[styles.label, { color: c.text }]}>Date</Text>
        <View style={styles.chips}>
          <Chip
            title={a.date ? formatDay(a.date) : "Pick a date"}
            selected={!!a.date}
            onPress={async () => {
              const d = await pickDate(a.date || todayKey());
              if (d) set("date", d);
            }}
          />
        </View>

        <Text style={[styles.label, { color: c.text }]}>Time</Text>
        <View style={styles.chips}>
          <Chip
            title={a.time ? formatTime(a.time) : "Pick a time"}
            selected={!!a.time}
            onPress={async () => {
              const t = await pickTime(a.time || "09:00");
              if (t) set("time", t);
            }}
          />
          {!!a.time && <Chip title="No set time" onPress={() => set("time", "")} />}
        </View>

        <Field label="Where" value={a.location} onChangeText={(v) => set("location", v)} placeholder="Clinic, address, or phone" />
        <Field label="Notes" value={a.notes} onChangeText={(v) => set("notes", v)} placeholder="e.g. Bring medicine list" multiline />
        <SwitchRow
          label="Remind me"
          hint={a.time ? "The evening before and 2 hours before" : "The evening before"}
          value={a.remind}
          onChange={(v) => set("remind", v)}
        />
      </Card>

      {!!error && <Text style={[styles.error, { color: c.error }]}>{error}</Text>}
      <View style={styles.gap}>
        <Button title={saving ? "Saving…" : "Save"} onPress={onSave} disabled={saving} />
        {existing && (
          <Button
            title="Also add to phone calendar"
            variant="secondary"
            onPress={() => addToCalendar(a.title, a.date, [a.location, a.notes].filter(Boolean).join("\n"), a.time)}
          />
        )}
        {existing && <Button title="Delete" variant="secondary" onPress={onDelete} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  error: { marginBottom: 12, fontSize: 15 },
  gap: { gap: 10 },
});
