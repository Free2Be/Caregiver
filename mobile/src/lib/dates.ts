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
