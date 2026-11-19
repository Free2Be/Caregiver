import { useColorScheme } from "react-native";

const light = {
  bg: "#F6F4EF",
  card: "#FFFFFF",
  text: "#1F2A2E",
  muted: "#5D6A6E",
  accent: "#2F6F62",
  accentText: "#FFFFFF",
  border: "#E2DED4",
  urgentBg: "#FFF4E0",
  urgentBorder: "#E8A33D",
  error: "#B3261E",
};

const dark: typeof light = {
  bg: "#151A1B",
  card: "#1F2628",
  text: "#E8ECEC",
  muted: "#A3AFB2",
  accent: "#5FB3A1",
  accentText: "#0E1A17",
  border: "#2F383A",
  urgentBg: "#3A2C14",
  urgentBorder: "#C98A2B",
  error: "#FF8A80",
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}
