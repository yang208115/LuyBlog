const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

function toShanghaiDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + SHANGHAI_OFFSET_MS);
}

/** Format a timestamp deterministically as YYYY/MM/DD in UTC+8 for SSR/client hydration parity. */
export function formatDateCN(value: string | Date | null | undefined): string {
  const d = toShanghaiDate(value);
  if (!d) return "--/--/--";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

/** Format a timestamp deterministically as YYYY.MM.DD in UTC+8. */
export function formatShortDateCN(value: string | Date | null | undefined): string {
  const d = toShanghaiDate(value);
  if (!d) return "--.--";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** Format a timestamp deterministically as YYYY/MM/DD HH:mm in UTC+8. */
export function formatDateTimeCN(value: string | Date | null | undefined): string {
  const d = toShanghaiDate(value);
  if (!d) return "--/--/-- --:--";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

/** Return the current year in UTC+8 consistently on server and client. */
export function getCurrentYearCN(): number {
  return new Date(Date.now() + SHANGHAI_OFFSET_MS).getUTCFullYear();
}
