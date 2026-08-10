import { MODELS, PROVIDER_LABELS, PROVIDER_ORDER } from "./models";
import type { DisplayCurrency, Lang, ModelInfo, PriceTier } from "./models";

export type Workload = {
  /** Uncached prompt tokens per call. */
  input: number;
  /** Prompt tokens served from a cache hit. */
  cached: number;
  /** Prompt tokens written into the cache. */
  cacheWrite: number;
  output: number;
  calls: number;
};

export type CostBreakdown = {
  /** Uncached prompt cost, in the model's own currency. */
  input: number;
  /** Cache read + cache write. */
  cache: number;
  output: number;
  total: number;
};

/** Per-token prices are published per million tokens. */
const PER = 1_000_000;

/**
 * Cost of one workload against one price tier, in the tier's currency.
 * A tier that doesn't publish a cache rate falls back to its full input rate — the
 * conservative reading, and the only honest one when nothing is published.
 */
export function costOf(tier: PriceTier, w: Workload, batchFactor?: number): CostBreakdown {
  const calls = Math.max(0, w.calls);
  const input = (w.input / PER) * tier.input;
  const cache =
    (w.cached / PER) * (tier.cacheRead ?? tier.input) + (w.cacheWrite / PER) * (tier.cacheWrite ?? 0);
  const output = (w.output / PER) * tier.output;
  const factor = (batchFactor ?? 1) * calls;
  return {
    input: input * factor,
    cache: cache * factor,
    output: output * factor,
    total: (input + cache + output) * factor,
  };
}

export function tierOf(model: ModelInfo, key: string | undefined): PriceTier | null {
  if (model.tiers.length === 0) return null;
  return model.tiers.find((t) => t.key === key) ?? model.tiers[0];
}

/* ---- currency ---------------------------------------------------------- */

export const CURRENCY_SYMBOLS: Record<DisplayCurrency, string> = {
  USD: "$",
  CNY: "CN¥",
  JPY: "JP¥",
};

/**
 * `rates[code]` is units of `code` per 1 USD, with USD itself at 1. Returns null when a
 * leg of the conversion is missing, so the caller can show "—" rather than a wrong number.
 */
export function convert(
  amount: number,
  from: DisplayCurrency,
  to: DisplayCurrency,
  rates: Record<string, number> | null,
): number | null {
  if (from === to) return amount;
  const fromRate = rates?.[from];
  const toRate = rates?.[to];
  if (typeof fromRate !== "number" || typeof toRate !== "number") return null;
  return (amount / fromRate) * toRate;
}

/** Currencies a set of models plus the display currency need a rate for. */
export function neededCurrencies(models: ModelInfo[], display: DisplayCurrency): DisplayCurrency[] {
  const set = new Set<DisplayCurrency>([display, ...models.map((m) => m.currency)]);
  return [...set].filter((c) => c !== "USD");
}

/* ---- formatting -------------------------------------------------------- */

/**
 * Money spans several orders of magnitude here — a nano-model's per-call cost sits near
 * $0.0001 while a Pro tier's batch run runs to thousands — so the precision follows the
 * value instead of being fixed at two places.
 */
export function formatMoney(v: number, currency: DisplayCurrency): string {
  const abs = Math.abs(v);
  const max = abs === 0 ? 2 : abs < 0.01 ? 5 : abs < 1 ? 4 : abs < 1000 ? 2 : 0;
  return money(v, currency, max);
}

/**
 * Per-MTok rates keep a third place so $0.20 and $0.02 don't read the same, and a fifth for
 * the cheapest cache rates — DeepSeek's cache hit lands near $0.004 once converted.
 */
export function formatRate(v: number, currency: DisplayCurrency): string {
  const abs = Math.abs(v);
  return money(v, currency, abs === 0 ? 2 : abs < 0.01 ? 5 : abs < 1 ? 3 : 2);
}

/**
 * Two decimal places wherever the value has them, more only where they carry information —
 * so $0.50 stays $0.50 while $0.0025 keeps its digits.
 */
function money(v: number, currency: DisplayCurrency, maxDigits: number): string {
  const text = v.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(2, maxDigits),
    maximumFractionDigits: maxDigits,
  });
  return `${CURRENCY_SYMBOLS[currency]}${text}`;
}

export function formatTokens(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Token counts are typed in millions as often as in digits, so "1m" and "256k" are
 * accepted alongside "1000000" and "1,000,000". Returns null for anything unparseable,
 * which leaves the stored value alone while the box is being edited.
 */
export function parseTokens(raw: string): number | null {
  const s = raw.trim().replace(/[,_\s]/g, "");
  if (s === "") return 0;
  const m = /^(\d+(?:\.\d+)?)([kmb])?$/i.exec(s);
  if (!m) return null;
  const mult = m[2] ? { k: 1e3, m: 1e6, b: 1e9 }[m[2].toLowerCase() as "k" | "m" | "b"] : 1;
  return Math.round(Number(m[1]) * mult);
}

/** Context windows and output caps read better as 1M / 256K than as digit runs. */
export function formatWindow(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(2)}M`;
  }
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

/* ---- search ------------------------------------------------------------ */

const PROVIDER_RANK: Record<string, number> = Object.fromEntries(PROVIDER_ORDER.map((p, i) => [p, i]));

function haystack(model: ModelInfo, lang: Lang): string {
  return [model.name, model.id, PROVIDER_LABELS[model.provider][lang], model.provider, ...(model.aliases ?? [])]
    .join(" ")
    .toLowerCase();
}

/** Provider order first, then newest release, so an empty query lists the current line first. */
function byProviderThenDate(a: ModelInfo, b: ModelInfo): number {
  const p = PROVIDER_RANK[a.provider] - PROVIDER_RANK[b.provider];
  if (p !== 0) return p;
  return (b.released ?? "").localeCompare(a.released ?? "");
}

/**
 * Substring search over name, id, provider and aliases. A match at the start of the name
 * or id outranks one in the middle, so typing "opus" puts Claude Opus 5 above the models
 * that only mention it. Every match is returned — the dropdown is a fixed height and
 * scrolls, so there is nothing to gain by truncating the list.
 */
export function searchModels(query: string, exclude: string[], lang: Lang): ModelInfo[] {
  const q = query.trim().toLowerCase();
  const skip = new Set(exclude);
  const pool = MODELS.filter((m) => !skip.has(m.id));

  if (q === "") return [...pool].sort(byProviderThenDate);

  return pool
    .filter((m) => haystack(m, lang).includes(q))
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) || a.id.toLowerCase().startsWith(q);
      const bStarts = b.name.toLowerCase().startsWith(q) || b.id.toLowerCase().startsWith(q);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return byProviderThenDate(a, b);
    });
}
