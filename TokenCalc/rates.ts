// Free, no API key required. ECB reference rates, updated on business days.
// https://frankfurter.dev
// Only the currencies this card can display are asked for; USD is the base and is added below.
const API_URL = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY,JPY";
// How long fetched rates stay reusable. The ECB publishes once per business day, so this is only
// about not asking again on every reload.
const TTL_MS = 60 * 60 * 1000;

export type RatesData = {
  date: string;
  /** Units of the code per 1 USD, with USD itself at 1. */
  rates: Record<string, number>;
  fetchedAt: number;
};

export async function fetchRates(): Promise<RatesData> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Rate fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as { date: string; rates: Record<string, number> };
  return { date: data.date, rates: { ...data.rates, USD: 1 }, fetchedAt: Date.now() };
}

/**
 * The card keeps its rates in its own config (comp.rates) rather than in this browser's
 * localStorage, so they travel with an exported or server-synced layout. Stored rates are
 * reusable only while inside the TTL and covering every currency on screen; a hand-edited or
 * older config, or one written before this field existed, simply counts as having nothing.
 */
export function readStoredRates(stored: unknown, codes: string[]): RatesData | null {
  const data = stored as RatesData | undefined;
  if (!data || typeof data.fetchedAt !== "number" || typeof data.date !== "string") return null;
  if (typeof data.rates !== "object" || data.rates === null) return null;
  if (Date.now() - data.fetchedAt > TTL_MS) return null;
  if (!codes.every((code) => typeof data.rates[code] === "number")) return null;
  return data;
}

/** Whether the config already says exactly this, so a card restored from it writes nothing back. */
export function sameStoredRates(stored: unknown, next: RatesData): boolean {
  const data = stored as RatesData | undefined;
  if (!data || data.fetchedAt !== next.fetchedAt || data.date !== next.date) return false;
  const codes = Object.keys(next.rates);
  return (
    Object.keys(data.rates ?? {}).length === codes.length && codes.every((code) => data.rates[code] === next.rates[code])
  );
}
