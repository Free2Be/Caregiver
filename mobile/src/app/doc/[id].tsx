import * as Clipboard from "expo-clipboard";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { StepRow } from "@/components/StepRow";
import { formatSaved } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import type { Explanation } from "@/lib/types";
import { Body, Button, Card, Heading } from "@/lib/ui";

// Plain-text version for sending to family by text message, WhatsApp, or email.
function asText(x: Explanation): string {
  const lines = [x.document_type, "", x.summary];
  if (x.urgent_warning) lines.push("", `⚠️ ${x.urgent_warning}`);
  if (x.next_steps.length) {
    lines.push("", "What to do next:");
    x.next_steps.forEach((s, i) => lines.push(`${i + 1}. ${s.action}${s.deadline ? ` (${s.deadline})` : ""}`));
  }
  if (x.costs_and_coverage) lines.push("", `Costs: ${x.costs_and_coverage}`);
  if (x.questions_for_doctor.length) {
    lines.push("", "Questions for the doctor:");
    x.questions_for_doctor.forEach((q) => lines.push(`• ${q}`));
  }
  lines.push("", "Explained by Paperwork Explainer. Not medical advice.");
  return lines.join("\n");
}

export default function DocScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { docs, loaded, toggleStep, removeDoc } = useStore();
  const [copied, setCopied] = useState(false);
  const doc = docs.find((d) => d.id === id);

  if (!doc) {
    return (
      <View style={styles.screen}>
        <Body>{loaded ? "This explanation was deleted." : "Loading…"}</Body>
        <View style={styles.space} />
        <Button title="Go to Saved" onPress={() => router.navigate("/saved")} />
      </View>
    );
  }

  const x = doc.explanation;

  function confirmDelete() {
    const remove = () => {
      removeDoc(doc!.id);
      router.back();
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm?.("Delete this explanation from your phone?")) remove();
      return;
    }
    Alert.alert("Delete this explanation?", "It will be removed from this phone, along with its to-dos.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Stack.Screen options={{ title: doc.title }} />

      {doc.demo && (
        <Card urgent>
          <Body style={styles.small}>Demo mode: the server had no API key, so this is a sample, not your document.</Body>
        </Card>
      )}

      <Card>
        <Text style={[styles.eyebrow, { color: c.accent }]}>
          {x.document_type.toUpperCase()} · SAVED {formatSaved(doc.savedAt).toUpperCase()}
        </Text>
        <Heading>What this means</Heading>
        <Body>{x.summary}</Body>
      </Card>

      {!!x.urgent_warning && (
        <Card urgent>
          <Heading>⚠️ Don't miss this</Heading>
          <Body>{x.urgent_warning}</Body>
        </Card>
      )}

      {x.next_steps.length > 0 && (
        <Card>
          <Heading>What to do next</Heading>
          {x.next_steps.map((s, i) => (
            <StepRow key={i} step={s} done={doc.done.includes(i)} onToggle={() => toggleStep(doc.id, i)} divider={i > 0} />
          ))}
        </Card>
      )}

      {!!x.costs_and_coverage && (
        <Card>
          <Heading>Costs and coverage</Heading>
          <Body>{x.costs_and_coverage}</Body>
        </Card>
      )}

      {x.questions_for_doctor.length > 0 && (
        <Card>
          <Heading>Questions to ask the doctor</Heading>
          {x.questions_for_doctor.map((q, i) => (
            <Body key={i} style={styles.bullet}>
              • {q}
            </Body>
          ))}
        </Card>
      )}

      {x.terms_explained.length > 0 && (
        <Card>
          <Heading>Words on this page</Heading>
          {x.terms_explained.map((t, i) => (
            <View key={i} style={[styles.term, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
              <Body style={styles.bold}>{t.term}</Body>
              <Body muted>{t.meaning}</Body>
            </View>
          ))}
        </Card>
      )}

      {x.is_denial && !!x.appeal_letter && (
        <Card>
          <Heading>Draft appeal letter</Heading>
          <Body muted>Fill in the [brackets], read it over, and send it before the deadline.</Body>
          <Text style={[styles.letter, { color: c.text, backgroundColor: c.bg, borderColor: c.border }]} selectable>
            {x.appeal_letter}
          </Text>
          <Button
            title={copied ? "Copied" : "Copy letter"}
            variant="secondary"
            onPress={async () => {
              await Clipboard.setStringAsync(x.appeal_letter);
              setCopied(true);
            }}
          />
        </Card>
      )}

      <View style={styles.gap}>
        <Button title="Share with family" onPress={() => Share.share({ message: asText(x) })} />
        <Button title="Explain another document" variant="secondary" onPress={() => router.navigate("/")} />
        <Button title="Delete" variant="secondary" onPress={confirmDelete} />
      </View>

      <Body muted style={[styles.small, styles.footer]}>
        This explains paperwork; it is not medical, legal, or financial advice. Check with the care team before making
        decisions. In an emergency, call 911.
      </Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  space: { height: 12 },
  small: { fontSize: 13 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 },
  bold: { fontWeight: "700" },
  bullet: { marginBottom: 6 },
  term: { paddingVertical: 8 },
  letter: { fontFamily: "monospace", fontSize: 14, lineHeight: 20, borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 10 },
  gap: { gap: 10, marginTop: 4 },
  footer: { textAlign: "center", marginTop: 28 },
});
