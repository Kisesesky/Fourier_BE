// src/modules/issues/utils/to-time.util.ts
export function toTime(value?: Date | string | null): number | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d.getTime();
}