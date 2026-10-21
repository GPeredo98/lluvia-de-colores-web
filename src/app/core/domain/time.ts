import { Weekday } from './models';

/**
 * Utilidades de fecha en la zona horaria del negocio (Bolivia, UTC-4 sin horario de verano).
 * Las fechas "de calendario" se manejan como strings yyyy-MM-dd para evitar corrimientos.
 */
export const BUSINESS_UTC_OFFSET = '-04:00';
const OFFSET_MS = -4 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local del negocio (yyyy-MM-dd) para un instante. */
export function toLocalDate(instant: Date | string = new Date()): string {
  const d = new Date(new Date(instant).getTime() + OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Hora local del negocio (HH:mm) para un instante. */
export function toLocalTime(instant: Date | string): string {
  const d = new Date(new Date(instant).getTime() + OFFSET_MS);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export const today = () => toLocalDate(new Date());

export const startOfDayIso = (date: string) => `${date}T00:00:00${BUSINESS_UTC_OFFSET}`;
export const endOfDayIso = (date: string) => `${date}T23:59:59.999${BUSINESS_UTC_OFFSET}`;

/** Combina fecha local + hora local en un ISO con offset. */
export const localDateTimeIso = (date: string, time: string) =>
  new Date(`${date}T${time}:00${BUSINESS_UTC_OFFSET}`).toISOString();

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ISO weekday (1 = lunes … 7 = domingo) de una fecha yyyy-MM-dd. */
export function weekdayOf(date: string): Weekday {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/** Minutos desde medianoche de un HH:mm. */
export const minutesOf = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesBetween = (fromIso: string, toIso: string) =>
  Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);

/** Edad legible a partir de la fecha de nacimiento. */
export function ageLabel(birthDate: string, at: string = today()): string {
  if (!birthDate) return '—';
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = at.split('-').map(Number);
  let months = (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0);
  if (months < 0) months = 0;
  if (months < 24) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} años`;
}

export function ageRangeLabel(minMonths: number, maxMonths: number): string {
  const fmt = (m: number) => (m < 24 ? `${m} meses` : `${Math.floor(m / 12)} años`);
  return `${fmt(minMonths)} – ${fmt(maxMonths)}`;
}
