import { BrandColor, Entity } from './common.model';

export type CalendarEventKind = 'evento' | 'taller' | 'inscripcion' | 'feriado' | 'vacaciones';

export const EVENT_KIND_LABELS: Record<CalendarEventKind, string> = {
  evento: 'Evento',
  taller: 'Taller',
  inscripcion: 'Inscripciones',
  feriado: 'Feriado',
  vacaciones: 'Vacaciones',
};

export interface CalendarEvent extends Entity {
  title: string;
  description: string;
  kind: CalendarEventKind;
  /** yyyy-MM-dd */
  startDate: string;
  /** yyyy-MM-dd; null = evento de un solo día. */
  endDate: string | null;
  color: BrandColor;
  isPublic: boolean;
}
