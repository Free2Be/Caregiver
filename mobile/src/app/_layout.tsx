import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "@/lib/reminders"; // sets how reminders show while the app is open
import { StoreProvider } from "@/lib/store";
import { useColors } from "@/lib/theme";

export default function RootLayout() {
  const c = useColors();
  return (
    <StoreProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="explain" options={{ title: "Explain paperwork" }} />
        <Stack.Screen name="doc/[id]" options={{ title: "Explanation" }} />
        <Stack.Screen name="med/[id]" options={{ title: "Medicine" }} />
        <Stack.Screen name="appt/[id]" options={{ title: "Appointment" }} />
        <Stack.Screen name="todos" options={{ title: "All to-dos" }} />
      </Stack>
    </StoreProvider>
  );
}
