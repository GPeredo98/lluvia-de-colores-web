type Row = Record<string, unknown>;

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/**
 * Mapea filas snake_case de Postgres a entidades camelCase y viceversa.
 * Solo convierte claves de primer nivel: jsonb y arrays pasan intactos.
 */
export interface RowMapper<T> {
  toDomain(row: Row): T;
  toRow(value: Partial<T>): Row;
}

export function caseMapper<T>(
  overrides: {
    toDomain?: (entity: T, row: Row) => T;
    toRow?: (row: Row) => Row;
  } = {},
): RowMapper<T> {
  return {
    toDomain(row) {
      const entity = Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v])) as T;
      return overrides.toDomain ? overrides.toDomain(entity, row) : entity;
    },
    toRow(value) {
      const row = Object.fromEntries(
        Object.entries(value as Row)
          .filter(([k, v]) => k !== 'id' && v !== undefined)
          .map(([k, v]) => [toSnake(k), v]),
      );
      return overrides.toRow ? overrides.toRow(row) : row;
    },
  };
}

/** Postgres devuelve `time` como HH:mm:ss; la UI trabaja con HH:mm. */
export const trimSeconds = (value: unknown) =>
  typeof value === 'string' ? value.slice(0, 5) : (value as string);
