// Due dates arrive as "YYYY-MM-DD". Treat them as local calendar days.
export function parseDay(day?: string): Date | null {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDay(day?: string): string {
  const date = parseDay(day);
  return date ? date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "";
}

// Whole days from today until the date (negative if past).
export function daysUntil(day?: string): number | null {
  const date = parseDay(day);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function dueLabel(day?: string): string {
  const n = daysUntil(day);
  if (n === null) return "";
  if (n < 0) return `Overdue · ${formatDay(day)}`;
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n <= 14) return `Due in ${n} days · ${formatDay(day)}`;
  return `Due ${formatDay(day)}`;
}

export function formatSaved(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Local calendar day as "YYYY-MM-DD".
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const todayKey = () => dayKey(new Date());

export function addDays(day: string, n: number): string {
  const d = parseDay(day) ?? new Date();
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// Usual dose times for "N times a day". The person can change them.
export function defaultTimes(timesPerDay: number, bedtime: boolean): string[] {
  if (bedtime) return ["21:00"];
  return (
    { 1: ["08:00"], 2: ["08:00", "20:00"], 3: ["08:00", "14:00", "20:00"], 4: ["08:00", "12:00", "16:00", "20:00"] }[
      timesPerDay
    ] ?? []
  );
}
