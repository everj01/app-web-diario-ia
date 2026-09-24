export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre",
];

// empieza en lunes
export const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const pad = (n: number) => String(n).padStart(2, "0");

// ojo: NO usar toISOString aca. De noche se pasa al dia siguiente porque eso es UTC.
export function toKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function monthKey(d: Date) {
  return toKey(d).slice(0, 7);
}

export function longDate(key: string) {
  const d = fromKey(key);
  const s = d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// created_at viene en UTC ("2026-09-19 14:03:00"), lo paso a hora local solo para mostrar
export function timeOf(sqliteUtc: string) {
  const d = new Date(sqliteUtc.replace(" ", "T") + "Z");
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}
