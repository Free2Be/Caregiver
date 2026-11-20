import Constants from "expo-constants";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import { useStore } from "@/lib/store";
import { Body, Button, Card, Heading } from "@/lib/ui";

export default function About() {
  const { docs, clearAll } = useStore();

  function confirmClear() {
    const message = "This deletes every saved explanation and to-do from this phone. It can't be undone.";
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
        <Heading>What this app does</Heading>
        <Body>
          Take a photo of hospital, insurance, or medical paperwork and get a plain-English explanation, a to-do list
          with deadlines, questions for the doctor, and a draft appeal letter for denials.
        </Body>
      </Card>

      <Card>
        <Heading>Your privacy</Heading>
        <Body>
          Pages are sent securely to be read by AI and are not kept on our server. Explanations and to-dos are saved
          only on this phone. Nothing is shared unless you tap Share.
        </Body>
      </Card>

      <Card>
        <Heading>Not medical advice</Heading>
        <Body>
          This app explains paperwork. It doesn't diagnose or replace the care team. Always check with the doctor
          before making decisions. In an emergency, call 911.
        </Body>
      </Card>

      <Card>
        <Heading>Your saved data</Heading>
        <Body muted style={styles.space}>
          {docs.length} saved explanation{docs.length === 1 ? "" : "s"} on this phone.
        </Body>
        <Button title="Delete everything" variant="secondary" onPress={confirmClear} disabled={docs.length === 0} />
      </Card>

      <Body muted style={styles.version}>Version {Constants.expoConfig?.version ?? "1.0.0"}</Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  space: { marginBottom: 12 },
  version: { textAlign: "center", fontSize: 13, marginTop: 8 },
});
