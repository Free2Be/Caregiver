import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { parseDay } from "./dates";
import type { Appointment, Medicine } from "./types";

// Local reminders, scheduled on the phone itself. Nothing goes through a server.

const CHANNEL = "reminders";
const supported = Platform.OS !== "web";

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

let channelReady = false;

// Sets up the Android channel and asks for permission to show notifications
// (Android only asks the person once; after that this just reports the answer).
export async function ensureReminders(): Promise<boolean> {
  if (!supported) return false;
  try {
    if (Platform.OS === "android" && !channelReady) {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: "Medicine and appointment reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
      channelReady = true;
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function cancelReminders(ids: string[]) {
  if (!supported) return;
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

// One daily reminder for each dose time.
export async function scheduleMedicine(med: Medicine): Promise<string[]> {
  if (!supported || !med.remind || !med.active || med.asNeeded || med.times.length === 0) return [];
  if (!(await ensureReminders())) return [];
  const body = [med.dose, med.strength && `(${med.strength})`, med.withFood].filter(Boolean).join(" ");
  const ids: string[] = [];
  for (const t of med.times) {
    const [hour, minute] = t.split(":").map(Number);
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: { title: `Time for ${med.name}`, body: body || med.instructions, data: { medId: med.id, time: t } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
      }),
    );
  }
  return ids;
}

// Reminders the evening before (6 pm) and, when there's a time, 2 hours before.
export async function scheduleAppointment(appt: Appointment): Promise<string[]> {
  if (!supported || !appt.remind) return [];
  const day = parseDay(appt.date);
  if (!day) return [];
  const at = new Date(day);
  if (appt.time) {
    const [h, m] = appt.time.split(":").map(Number);
    at.setHours(h, m, 0, 0);
  } else {
    at.setHours(9, 0, 0, 0);
  }
  const eveningBefore = new Date(day);
  eveningBefore.setDate(eveningBefore.getDate() - 1);
  eveningBefore.setHours(18, 0, 0, 0);
  const twoHoursBefore = new Date(at.getTime() - 2 * 3600_000);

  const when = [eveningBefore, ...(appt.time ? [twoHoursBefore] : [])].filter((d) => d.getTime() > Date.now());
  if (when.length === 0 || !(await ensureReminders())) return [];

  const timeText = appt.time ? ` at ${formatTime(appt.time)}` : "";
  const ids: string[] = [];
  for (const date of when) {
    const tomorrow = date === eveningBefore;
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: tomorrow ? `Tomorrow: ${appt.title}` : `Soon: ${appt.title}`,
          body: [`${tomorrow ? "Tomorrow" : "Today"}${timeText}`, appt.location].filter(Boolean).join(" · "),
          data: { apptId: appt.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
      }),
    );
  }
  return ids;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
