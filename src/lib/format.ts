import type { ServiceSchedule } from "@/domain/models";
import { plural } from "./text";

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const SHORT_WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** 1 = Sunday … 7 = Saturday. */
export function weekdayName(weekday: number): string {
  return WEEKDAYS[weekday - 1] ?? "";
}

export function shortWeekdayName(weekday: number): string {
  return SHORT_WEEKDAYS[weekday - 1] ?? "";
}

/** "10:00", "9:30" (24-hour, as in Spanish). */
export function timeOfDay(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

/** "Domingo · 10:00". */
export function scheduleSummary(schedule: ServiceSchedule): string {
  return `${weekdayName(schedule.weekday)} · ${timeOfDay(schedule.hour, schedule.minute)}`;
}

/** "1 h 10 min", "45 min", "2 h". */
export function durationSummary(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/** "4 bloques · 1 h 10 min". */
export function blocksSummary(count: number, seconds: number): string {
  return `${plural(count, "bloque")} · ${durationSummary(seconds)}`;
}

const longDate = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" });

/** "DOMINGO, 4 DE OCTUBRE". */
export function longDateOverline(date: Date): string {
  return longDate.format(date).toLocaleUpperCase("es");
}

const relativeDate = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "4 oct 2026". */
export function shortDate(iso: string): string {
  return relativeDate.format(new Date(iso));
}

/** "Buenos días," / "Buenas tardes," / "Buenas noches,". */
export function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días,";
  if (hour < 19) return "Buenas tardes,";
  return "Buenas noches,";
}
