import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { explain } from "@/lib/api";
import { MAX_PAGES, PageError, choosePdf, choosePhotos, takePhoto } from "@/lib/pages";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import type { Page } from "@/lib/types";
import { Body, Button, Card, Heading } from "@/lib/ui";

export default function Explain() {
  const c = useColors();
  // Pages and question are kept in the store, so they survive leaving the app.
  const { draft, setDraft, saveResult } = useStore();
  const { pages, question } = draft;
  const [busy, setBusy] = useState<"" | "adding" | "explaining">("");
  const [error, setError] = useState("");

  const room = MAX_PAGES - pages.length;

  async function add(source: () => Promise<Page[] | "denied">) {
    setError("");
    setBusy("adding");
    try {
      const added = await source();
      if (added === "denied") {
        Alert.alert("Camera access needed", "Allow camera access in your phone's Settings to take photos of paperwork.");
        return;
      }
      if (added.length > room) setError(`You can add up to ${MAX_PAGES} pages at a time.`);
      setDraft({ pages: [...pages, ...added].slice(0, MAX_PAGES), question });
    } catch (e) {
      setError(e instanceof PageError ? e.message : "Couldn't add that page. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function submit() {
    if (pages.length === 0) return setError("Add a photo or PDF of the paperwork first.");
    setError("");
    setBusy("explaining");
    try {
      const result = await explain(pages, question);
      // An unreadable photo isn't worth saving; keep the pages so they can be retaken.
      if (!result.explanation.readable) {
        setError(`We couldn't read this. ${result.explanation.summary}`);
        return;
      }
      const id = saveResult(result);
      setDraft({ pages: [], question: "" });
      router.replace(`/doc/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Body muted style={styles.intro}>
        Hospital discharge papers, insurance letters, denials, lab results. Get a plain-English explanation, a to-do
        list, and questions to ask the doctor. Every explanation is saved on this phone.
      </Body>

      <Card>
        <Heading>1. Add the paperwork</Heading>
        <View style={styles.gap}>
          <Button title="📷  Take a photo" onPress={() => add(takePhoto)} disabled={!!busy || room === 0} />
          <Button
            title="🖼️  Choose photos"
            variant="secondary"
            onPress={() => add(() => choosePhotos(room))}
            disabled={!!busy || room === 0}
          />
          <Button title="📄  Choose a PDF" variant="secondary" onPress={() => add(choosePdf)} disabled={!!busy || room === 0} />
        </View>
        {busy === "adding" && <ActivityIndicator style={styles.spinner} color={c.accent} />}

        {pages.length > 0 && (
          <View style={styles.pages}>
            {pages.map((p, i) => (
              <View key={p.uri} style={[styles.thumb, { borderColor: c.border, backgroundColor: c.bg }]}>
                {p.mimeType === "application/pdf" ? (
                  <Text style={[styles.pdf, { color: c.muted }]} numberOfLines={3}>
                    📄{"\n"}
                    {p.name}
                  </Text>
                ) : (
                  <Image source={{ uri: p.uri }} style={styles.thumbImage} />
                )}
                <Pressable
                  accessibilityLabel={`Remove page ${i + 1}`}
                  onPress={() => setDraft({ pages: pages.filter((x) => x.uri !== p.uri), question })}
                  style={[styles.remove, { backgroundColor: c.text }]}
                  hitSlop={8}
                >
                  <Text style={{ color: c.bg, fontWeight: "700" }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Body muted style={styles.small}>
          {pages.length} of {MAX_PAGES} pages added
        </Body>
      </Card>

      <Card>
        <Heading>2. Anything specific? (optional)</Heading>
        <TextInput
          value={question}
          onChangeText={(q) => setDraft({ pages, question: q })}
          maxLength={500}
          multiline
          placeholder="e.g. Do we have to pay this?"
          placeholderTextColor={c.muted}
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.bg }]}
        />
      </Card>

      <Button
        title={busy === "explaining" ? "Reading your paperwork…" : "Explain this"}
        onPress={submit}
        disabled={!!busy}
      />
      {busy === "explaining" && (
        <View style={styles.waiting}>
          <ActivityIndicator color={c.accent} />
          <Body muted style={styles.small}>
            This can take up to a minute.
          </Body>
        </View>
      )}
      {!!error && <Text style={[styles.error, { color: c.error }]}>{error}</Text>}

      <Body muted style={[styles.small, styles.footer]}>
        Your pages are sent securely to be read and are not kept on our server. This app explains paperwork; it is not
        medical, legal, or financial advice. In an emergency, call 911.
      </Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  intro: { marginBottom: 16 },
  gap: { gap: 10 },
  spinner: { marginTop: 12 },
  pages: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  thumb: { width: 92, height: 120, borderWidth: 1, borderRadius: 10, overflow: "hidden", justifyContent: "center" },
  thumbImage: { width: "100%", height: "100%" },
  pdf: { fontSize: 12, textAlign: "center", padding: 6 },
  remove: { position: "absolute", top: 4, right: 4, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  small: { fontSize: 13, marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, minHeight: 64, textAlignVertical: "top" },
  waiting: { alignItems: "center", marginTop: 12 },
  error: { marginTop: 12, fontSize: 15 },
  footer: { textAlign: "center", marginTop: 28 },
});
