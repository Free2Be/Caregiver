import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ResultProvider } from "@/lib/result-context";
import { useColors } from "@/lib/theme";

export default function RootLayout() {
  const c = useColors();
  return (
    <ResultProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Paperwork Explainer" }} />
        <Stack.Screen name="result" options={{ title: "Explanation" }} />
      </Stack>
    </ResultProvider>
  );
}
