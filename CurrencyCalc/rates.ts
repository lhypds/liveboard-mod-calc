// Free, no API key required. ECB reference rates, updated on business days.
// https://frankfurter.dev
const API_URL = "https://api.frankfurter.dev/v1/latest?base=USD";
const CACHE_KEY = "liveboard-currency-calc-rates";
const CACHE_TTL_MS = 60 * 60 * 1000;

export type RatesData = {
  base: string;
  date: string;
  rates: Record<string, number>; // 1 unit of `base` = rates[code] units of code
  fetchedAt: number;
};

function readCache(): RatesData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RatesData;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: RatesData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export async function fetchRates(force = false): Promise<RatesData> {
  if (!force) {
    const cached = readCache();
    if (cached) return cached;
  }

  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Rate fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as { base: string; date: string; rates: Record<string, number> };

  const result: RatesData = {
    base: data.base,
    date: data.date,
    rates: { ...data.rates, [data.base]: 1 },
    fetchedAt: Date.now(),
  };
  writeCache(result);
  return result;
}
