import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { allTodos } from "@/lib/agenda";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Body, Button, Card, Heading } from "@/lib/ui";

export default function More() {
  const c = useColors();
  const { docs, meds, appts, clearAll } = useStore();
  const openTodos = allTodos(docs).filter((t) => !t.done).length;

  function confirmClear() {
    const message =
      "This deletes every saved explanation, medicine, reminder, appointment, and to-do from this phone. It can't be undone.";
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(message)) clearAll();
      return;
    }
    Alert.alert("Delete everything?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => clearAll() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card>
        <Pressable onPress={() => router.push("/todos")} accessibilityRole="button" style={styles.link}>
          <Ionicons name="checkbox-outline" size={22} color={c.accent} />
          <Text style={[styles.linkText, { color: c.text }]}>All to-dos</Text>
          {openTodos > 0 && (
            <Text style={[styles.badge, { backgroundColor: c.accent, color: c.accentText }]}>{openTodos}</Text>
          )}
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </Pressable>
      </Card>

      <Card>
        <Heading>What this app does</Heading>
        <Body>
          Explains hospital, insurance, and medical paperwork in plain English, keeps medicines with reminders, and
          puts visits and to-dos on one calendar.
        </Body>
      </Card>

      <Card>
        <Heading>Your privacy</Heading>
        <Body>
          Photos of paperwork and labels are sent securely to be read by AI and are not kept on our server. Everything
          else (explanations, medicines, appointments, reminders) is saved only on this phone. Nothing is shared unless
          you tap Share.
        </Body>
      </Card>

      <Card>
        <Heading>Not medical advice</Heading>
        <Body>
          This app explains and organizes. It doesn't diagnose, suggest doses, or check drug interactions. Always check
          with the doctor or pharmacist before making changes. In an emergency, call 911.
        </Body>
      </Card>

      <Card>
        <Heading>Your saved data</Heading>
        <Body muted style={styles.space}>
          {docs.length} explanations · {meds.length} medicines · {appts.length} appointments, all on this phone.
        </Body>
        <Button
          title="Delete everything"
          variant="secondary"
          onPress={confirmClear}
          disabled={docs.length + meds.length + appts.length === 0}
        />
      </Card>

      <View>
        <Body muted style={styles.version}>Version {Constants.expoConfig?.version ?? "1.0.0"}</Body>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  link: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkText: { flex: 1, fontSize: 17, fontWeight: "700" },
  badge: { minWidth: 26, textAlign: "center", borderRadius: 13, paddingHorizontal: 8, paddingVertical: 2, fontWeight: "700", overflow: "hidden" },
  space: { marginBottom: 12 },
  version: { textAlign: "center", fontSize: 13, marginTop: 8 },
});
