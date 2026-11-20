import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type ViewStyle } from "react-native";
import { useColors } from "./theme";

export function Card({ children, urgent, style }: { children: ReactNode; urgent?: boolean; style?: ViewStyle }) {
  const c = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: urgent ? c.urgentBg : c.card, borderColor: urgent ? c.urgentBorder : c.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={[styles.heading, { color: c.text }]}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  const c = useColors();
  return <Text style={[styles.body, { color: muted ? c.muted : c.text }, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const c = useColors();
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? c.accent : "transparent",
          borderColor: c.accent,
          opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? c.accentText : c.accent }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 18, marginBottom: 14 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24 },
  button: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center" },
  buttonText: { fontSize: 16, fontWeight: "700" },
});

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const c = useColors();
  return (
    <View style={fieldStyles.wrap}>
      <Text style={[fieldStyles.label, { color: c.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        multiline={multiline}
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multi,
          { color: c.text, borderColor: c.border, backgroundColor: c.bg },
        ]}
      />
    </View>
  );
}

export function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const c = useColors();
  return (
    <View style={fieldStyles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={[fieldStyles.label, { color: c.text, marginBottom: 0 }]}>{label}</Text>
        {!!hint && <Text style={{ color: c.muted, fontSize: 14 }}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.accent }} />
    </View>
  );
}

export function Chip({ title, onPress, selected }: { title: string; onPress?: () => void; selected?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        fieldStyles.chip,
        { borderColor: c.accent, backgroundColor: selected ? c.accent : "transparent", opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={{ color: selected ? c.accentText : c.accent, fontWeight: "700", fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  multi: { minHeight: 70, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
