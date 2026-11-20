import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/tabs";
import type { ColorValue } from "react-native";
import { dosesForDay, missedDoses } from "@/lib/agenda";
import { todayKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useColors } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color as string} />;
}

export default function TabsLayout() {
  const c = useColors();
  const { meds, doses } = useStore();
  // Badge on Today: doses whose time has passed without being marked.
  const missed = missedDoses(dosesForDay(meds, doses, todayKey())).length;

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
        tabBarBadgeStyle: { backgroundColor: c.urgentBorder, color: "#1F2A2E" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: icon("sunny-outline"), tabBarBadge: missed > 0 ? missed : undefined }}
      />
      <Tabs.Screen name="documents" options={{ title: "Documents", tabBarIcon: icon("document-text-outline") }} />
      <Tabs.Screen name="medicines" options={{ title: "Medicines", tabBarIcon: icon("medkit-outline") }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: icon("calendar-outline") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: icon("ellipsis-horizontal-circle-outline") }} />
    </Tabs>
  );
}
