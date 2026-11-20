import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { formatSaved } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Body, Button, Card, Heading } from "@/lib/ui";

export default function Documents() {
  const c = useColors();
  const { docs, loaded } = useStore();

  if (loaded && docs.length === 0) {
    return (
      <View style={styles.screen}>
        <Card>
          <Heading>Nothing saved yet</Heading>
          <Body muted>Every document you explain is saved here, on this phone, so you can come back to it.</Body>
        </Card>
        <Button title="📄  Explain paperwork" onPress={() => router.push("/explain")} />
      </View>
    );
  }

  return (
    <FlatList
      data={docs}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.screen}
      ListHeaderComponent={
        <View style={styles.top}>
          <Button title="📄  Explain new paperwork" onPress={() => router.push("/explain")} />
        </View>
      }
      renderItem={({ item }) => {
        const open = item.explanation.next_steps.length - item.done.length;
        return (
          <Pressable
            onPress={() => router.push(`/doc/${item.id}`)}
            style={({ pressed }) => [styles.item, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
          >
            <View style={styles.flex}>
              <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Body muted style={styles.meta}>
                {formatSaved(item.savedAt)}
                {open > 0 ? ` · ${open} to-do${open === 1 ? "" : "s"} left` : item.explanation.next_steps.length ? " · all done" : ""}
                {item.demo ? " · sample" : ""}
              </Body>
              {!!item.explanation.urgent_warning && open > 0 && (
                <Text style={[styles.urgent, { color: c.text, backgroundColor: c.urgentBg, borderColor: c.urgentBorder }]}>
                  ⚠️ Has a deadline or warning
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.muted} />
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 48 },
  top: { marginBottom: 16 },
  item: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  flex: { flex: 1 },
  title: { fontSize: 17, fontWeight: "700" },
  meta: { fontSize: 14, marginTop: 2 },
  urgent: { alignSelf: "flex-start", fontSize: 13, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, marginTop: 8, overflow: "hidden" },
});
