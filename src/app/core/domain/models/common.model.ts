/** Colores de la marca (gotas del logo + nube). */
export type BrandColor = 'sky' | 'blue' | 'red' | 'yellow' | 'pink' | 'green' | 'purple';

export const BRAND_COLORS: readonly BrandColor[] = [
  'sky',
  'blue',
  'red',
  'yellow',
  'pink',
  'green',
  'purple',
];

/** Toda entidad persistida tiene un id. */
export interface Entity {
  id: string;
}

/** Datos para crear una entidad: todo menos el id. */
export type Draft<T extends Entity> = Omit<T, 'id'>;

/** ISO weekday: 1 = lunes … 7 = domingo. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS: readonly { value: Weekday; label: string; short: string }[] = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
];
