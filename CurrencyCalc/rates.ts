// Free, no API key required. ECB reference rates, updated on business days.
// https://frankfurter.dev
const API_URL = "https://api.frankfurter.dev/v1/latest?base=USD";
// How long fetched rates stay reusable. The ECB publishes once per business day, so this is only
// about not asking again on every reload.
const TTL_MS = 60 * 60 * 1000;

export type RatesData = {
  base: string;
  date: string;
  rates: Record<string, number>; // 1 unit of `base` = rates[code] units of code
  fetchedAt: number;
};

export async function fetchRates(): Promise<RatesData> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Rate fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as { base: string; date: string; rates: Record<string, number> };

  return {
    base: data.base,
    date: data.date,
    rates: { ...data.rates, [data.base]: 1 },
    fetchedAt: Date.now(),
  };
}

// The card keeps its rates in its own config (comp.rates) rather than in this browser's
// localStorage, so they travel with an exported or server-synced layout. Only the currencies on
// screen are kept — the API answers with some thirty, and a conversion only ever reads the two ends
// of the row it is on.
export function trimRates(data: RatesData, codes: string[]): RatesData {
  const rates: Record<string, number> = {};
  for (const code of codes) {
    if (typeof data.rates[code] === "number") rates[code] = data.rates[code];
  }
  return { base: data.base, date: data.date, fetchedAt: data.fetchedAt, rates };
}

// Stored rates are reusable only while inside the TTL and covering every currency shown, so a card
// that gained a currency since its last fetch asks again. A hand-edited or older config, or one
// written before this field existed, simply counts as having nothing.
export function readStoredRates(stored: unknown, codes: string[]): RatesData | null {
  const data = stored as RatesData | undefined;
  if (!data || typeof data.fetchedAt !== "number" || typeof data.base !== "string") return null;
  if (typeof data.date !== "string" || typeof data.rates !== "object" || data.rates === null) return null;
  if (Date.now() - data.fetchedAt > TTL_MS) return null;
  if (!codes.every((code) => typeof data.rates[code] === "number")) return null;
  return data;
}

// Whether the config already says exactly this, so a card restored from it writes nothing back.
export function sameStoredRates(stored: unknown, next: RatesData): boolean {
  const data = stored as RatesData | undefined;
  if (!data || data.fetchedAt !== next.fetchedAt || data.base !== next.base || data.date !== next.date) return false;
  const codes = Object.keys(next.rates);
  return (
    Object.keys(data.rates ?? {}).length === codes.length &&
    codes.every((code) => data.rates[code] === next.rates[code])
  );
}
