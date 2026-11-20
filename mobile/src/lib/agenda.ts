import { parseDay } from "./dates";
import type { Appointment, DoseLog, DoseStatus, Medicine, SavedDoc } from "./types";

export type Dose = { med: Medicine; time: string; status: DoseStatus | undefined };

// Scheduled doses for a day, earliest first. "As needed" medicines have none.
export function dosesForDay(meds: Medicine[], doses: DoseLog, day: string): Dose[] {
  const log = doses[day] ?? {};
  return meds
    .filter((m) => m.active && !m.asNeeded)
    .flatMap((med) => med.times.map((time) => ({ med, time, status: log[`${med.id}@${time}`] })))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export type Todo = {
  doc: SavedDoc;
  index: number;
  step: SavedDoc["explanation"]["next_steps"][number];
  done: boolean;
};

export function allTodos(docs: SavedDoc[]): Todo[] {
  return docs.flatMap((doc) =>
    doc.explanation.next_steps.map((step, index) => ({ doc, index, step, done: doc.done.includes(index) })),
  );
}

export function appointmentsOn(appts: Appointment[], day: string): Appointment[] {
  return appts.filter((a) => a.date === day).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
}

export function todosDueOn(todos: Todo[], day: string): Todo[] {
  return todos.filter((t) => t.step.due_date === day);
}

const time = (day?: string) => parseDay(day)?.getTime() ?? Number.POSITIVE_INFINITY;
export const byDueDate = (a: Todo, b: Todo) => time(a.step.due_date) - time(b.step.due_date);

// Doses whose time has passed today without being marked taken or skipped.
export function missedDoses(list: Dose[], now = new Date()): Dose[] {
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return list.filter((d) => !d.status && d.time <= hhmm);
}
