import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { pickTime } from "@/lib/pickers";
import { ensureReminders, formatTime } from "@/lib/reminders";
import { type MedicineInput, useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Body, Button, Card, Chip, Field, Heading, SwitchRow } from "@/lib/ui";

const BLANK: MedicineInput = {
  name: "",
  strength: "",
  dose: "",
  instructions: "",
  times: [],
  asNeeded: false,
  withFood: "",
  purpose: "",
  prescriber: "",
  pharmacy: "",
  refills: "",
  warnings: [],
  notes: "",
  remind: true,
  active: true,
};

// Add or edit a medicine. id "new" adds one; ?prefill=JSON fills the form
// (from a scanned label or from paperwork) for the person to check.
export default function MedicineScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ id: string; prefill?: string }>();
  const { meds, saveMedicine, removeMedicine } = useStore();
  const existing = meds.find((m) => m.id === params.id);

  const initial = useMemo(() => {
    if (existing) return existing as MedicineInput;
    try {
      return { ...BLANK, ...(params.prefill ? JSON.parse(params.prefill) : {}) } as MedicineInput & { source?: string };
    } catch {
      return BLANK;
    }
  }, [existing, params.prefill]);
  const source = existing ? undefined : (initial as { source?: "label" | "paperwork" }).source;

  const [m, setM] = useState<MedicineInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof MedicineInput>(k: K, v: MedicineInput[K]) => setM((prev) => ({ ...prev, [k]: v }));

  if (params.id !== "new" && !existing) {
    return (
      <View style={styles.screen}>
        <Body>This medicine was deleted.</Body>
      </View>
    );
  }

  async function addTime() {
    const t = await pickTime(m.times.at(-1));
    if (t && !m.times.includes(t)) set("times", [...m.times, t].sort());
  }

  async function changeTime(old: string) {
    const t = await pickTime(old);
    if (t) set("times", Array.from(new Set(m.times.map((x) => (x === old ? t : x)))).sort());
  }

  async function onSave() {
    if (!m.name.trim()) return setError("Please enter the medicine name.");
    setError("");
    setSaving(true);
    try {
      const wantsReminders = m.remind && m.active && !m.asNeeded && m.times.length > 0;
      if (wantsReminders && !(await ensureReminders()) && Platform.OS !== "web") {
        Alert.alert(
          "Reminders are off",
          "Notifications are turned off for this app, so reminders won't show. You can turn them on in your phone's Settings.",
        );
      }
      const { source: _s, ...clean } = m as MedicineInput & { source?: string };
      await saveMedicine({ ...clean, name: m.name.trim() }, existing?.id);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    const remove = async () => {
      await removeMedicine(existing!.id);
      router.back();
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm?.("Delete this medicine and its reminders?")) remove();
      return;
    }
    Alert.alert("Delete this medicine?", "Its reminders and history will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: existing ? m.name || "Medicine" : "Add medicine" }} />

      {!!source && (
        <Card urgent>
          <Body style={styles.small}>
            {source === "label"
              ? "Filled in from the label photo. Please check every detail against the bottle before saving."
              : "Filled in from the paperwork. Please check the details and times against the pharmacy label before saving."}
          </Body>
        </Card>
      )}

      <Card>
        <Field label="Medicine name" value={m.name} onChangeText={(v) => set("name", v)} placeholder="e.g. Metoprolol" />
        <Field label="Strength" value={m.strength} onChangeText={(v) => set("strength", v)} placeholder="e.g. 25 mg" />
        <Field label="How much each time" value={m.dose} onChangeText={(v) => set("dose", v)} placeholder="e.g. 1 tablet" />
        <Field
          label="Directions"
          value={m.instructions}
          onChangeText={(v) => set("instructions", v)}
          placeholder="As written on the label"
          multiline
        />
        <Field label="With food?" value={m.withFood} onChangeText={(v) => set("withFood", v)} placeholder="e.g. With food" />
      </Card>

      <Card>
        <Heading>When to take it</Heading>
        <SwitchRow
          label="Only as needed"
          hint="No set times, no reminders"
          value={m.asNeeded}
          onChange={(v) => set("asNeeded", v)}
        />
        {!m.asNeeded && (
          <>
            <View style={styles.chips}>
              {m.times.map((t) => (
                <Chip key={t} title={`${formatTime(t)}  ✎`} onPress={() => changeTime(t)} selected />
              ))}
              <Chip title="+ Add a time" onPress={addTime} />
            </View>
            {m.times.length > 0 && (
              <View style={styles.chips}>
                {m.times.map((t) => (
                  <Chip key={t} title={`Remove ${formatTime(t)}`} onPress={() => set("times", m.times.filter((x) => x !== t))} />
                ))}
              </View>
            )}
            <SwitchRow
              label="Remind me"
              hint="A notification at each time, every day"
              value={m.remind}
              onChange={(v) => set("remind", v)}
            />
          </>
        )}
      </Card>

      <Card>
        <Heading>More details (optional)</Heading>
        <Field label="What it's for" value={m.purpose} onChangeText={(v) => set("purpose", v)} placeholder="e.g. Blood pressure" />
        <Field label="Prescribed by" value={m.prescriber} onChangeText={(v) => set("prescriber", v)} />
        <Field label="Pharmacy" value={m.pharmacy} onChangeText={(v) => set("pharmacy", v)} />
        <Field label="Refills left" value={m.refills} onChangeText={(v) => set("refills", v)} />
        <Field label="Notes" value={m.notes} onChangeText={(v) => set("notes", v)} multiline />
        {m.warnings.length > 0 && (
          <View style={styles.warnings}>
            <Text style={[styles.label, { color: c.text }]}>Label warnings</Text>
            {m.warnings.map((w, i) => (
              <Body key={i} muted>
                ⚠️ {w}
              </Body>
            ))}
          </View>
        )}
        {existing && (
          <SwitchRow label="Still taking this" hint="Turn off if the doctor stopped it" value={m.active} onChange={(v) => set("active", v)} />
        )}
      </Card>

      {!!error && <Text style={[styles.error, { color: c.error }]}>{error}</Text>}
      <View style={styles.gap}>
        <Button title={saving ? "Saving…" : "Save"} onPress={onSave} disabled={saving} />
        {existing && <Button title="Delete" variant="secondary" onPress={onDelete} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  small: { fontSize: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  warnings: { marginBottom: 12, gap: 4 },
  label: { fontSize: 15, fontWeight: "700" },
  error: { marginBottom: 12, fontSize: 15 },
  gap: { gap: 10 },
});
