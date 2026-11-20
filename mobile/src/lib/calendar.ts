import { createEventInCalendarAsync } from "expo-calendar/legacy";
import { Alert, Platform } from "react-native";
import { parseDay } from "./dates";

// Opens the phone's own calendar screen with the event filled in, so the person
// can adjust the date and save it. No calendar permission is needed for this.
export async function addToCalendar(title: string, dueDate: string | undefined, notes: string) {
  if (Platform.OS === "web") {
    Alert.alert("Not available", "Adding to a calendar works in the phone app.");
    return;
  }
  // With no exact date, start on tomorrow so the person picks the real day.
  const start = parseDay(dueDate) ?? new Date(Date.now() + 86_400_000);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  try {
    await createEventInCalendarAsync({
      title,
      startDate: start,
      endDate: end,
      notes: `${notes}\n\nFrom Paperwork Explainer.`,
    });
  } catch {
    Alert.alert("Couldn't open your calendar", "Please add this to your calendar app by hand.");
  }
}
