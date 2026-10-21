import { Pipe, PipeTransform } from '@angular/core';

const formats = {
  short: { day: 'numeric', month: 'short' },
  month: { month: 'short' },
  medium: { weekday: 'short', day: 'numeric', month: 'short' },
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  full: { day: 'numeric', month: 'short', year: 'numeric' },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

/**
 * Formatea fechas de calendario (yyyy-MM-dd) sin corrimiento por zona horaria
 * (DatePipe interpreta 'yyyy-MM-dd' como medianoche UTC).
 */
@Pipe({ name: 'day' })
export class DayPipe implements PipeTransform {
  transform(date: string | null | undefined, format: keyof typeof formats = 'medium'): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-BO', { ...formats[format], timeZone: 'UTC' }).format(
      new Date(`${date.slice(0, 10)}T12:00:00Z`),
    );
  }
}

/** yyyy-MM → "octubre 2026" */
@Pipe({ name: 'period' })
export class PeriodPipe implements PipeTransform {
  transform(period: string | null | undefined): string {
    if (!period) return '—';
    return new Intl.DateTimeFormat('es-BO', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${period}-15T12:00:00Z`));
  }
}

/** Minutos → "1 h 30 min" */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
  }
}
