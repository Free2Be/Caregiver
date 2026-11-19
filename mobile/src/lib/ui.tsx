import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
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
