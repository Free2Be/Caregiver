import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import { dayKey, parseDay } from "./dates";

// Opens the phone's own date or time picker. Resolves to null if cancelled.
// The browser preview (used for testing) falls back to a text prompt.

function open(mode: "date" | "time", value: Date): Promise<Date | null> {
  if (Platform.OS === "web") {
    const hint = mode === "date" ? "Date (YYYY-MM-DD)" : "Time (HH:MM, 24-hour)";
    const current = mode === "date" ? dayKey(value) : value.toTimeString().slice(0, 5);
    const answer = globalThis.prompt?.(hint, current);
    if (!answer) return Promise.resolve(null);
    if (mode === "date") return Promise.resolve(parseDay(answer.trim()));
    const m = /^(\d{1,2}):(\d{2})$/.exec(answer.trim());
    if (!m) return Promise.resolve(null);
    const d = new Date(value);
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return Promise.resolve(d);
  }
  return new Promise((resolve) => {
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: false,
      onChange: (event, date) => resolve(event.type === "set" && date ? date : null),
    });
  });
}

// "HH:MM" in, "HH:MM" out.
export async function pickTime(current?: string): Promise<string | null> {
  const d = new Date();
  if (current) {
    const [h, m] = current.split(":").map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(8, 0, 0, 0);
  }
  const picked = await open("time", d);
  return picked ? `${String(picked.getHours()).padStart(2, "0")}:${String(picked.getMinutes()).padStart(2, "0")}` : null;
}

// "YYYY-MM-DD" in, "YYYY-MM-DD" out.
export async function pickDate(current?: string): Promise<string | null> {
  const picked = await open("date", parseDay(current) ?? new Date());
  return picked ? dayKey(picked) : null;
}
