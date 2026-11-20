import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { Tabs } from "expo-router/tabs";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color as string} />;
}

export default function TabsLayout() {
  const c = useColors();
  const { docs } = useStore();
  const openTodos = docs.reduce((n, d) => n + d.explanation.next_steps.length - d.done.length, 0);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: c.bg },
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Explain", headerTitle: "Paperwork Explainer", tabBarIcon: icon("camera-outline") }} />
      <Tabs.Screen name="saved" options={{ title: "Saved", tabBarIcon: icon("folder-open-outline") }} />
      <Tabs.Screen
        name="todos"
        options={{
          title: "To-dos",
          tabBarIcon: icon("checkbox-outline"),
          tabBarBadge: openTodos > 0 ? openTodos : undefined,
          tabBarBadgeStyle: { backgroundColor: c.accent, color: c.accentText },
        }}
      />
      <Tabs.Screen name="about" options={{ title: "About", tabBarIcon: icon("information-circle-outline") }} />
    </Tabs>
  );
}
