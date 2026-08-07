import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CURRENCIES, CURRENCY_MAP, DEFAULT_CURRENCIES, convert, type Lang } from "./calc";
import { fetchRates, readStoredRates, sameStoredRates, trimRates, type RatesData } from "./rates";
import { config as defaultConfig } from "./config";
import styles from "./calc.module.css";

type CompValues = {
  baseCode: string;
  amount: number;
  currencies: string[];
};

const DEFAULTS = defaultConfig.comp as CompValues;
const ZERO_DECIMAL = new Set(["JPY", "KRW", "ISK"]);

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    addCurrency: "+ Add currency",
    updated: "Updated",
    refresh: "Refresh",
    loading: "Loading rates…",
    error: "Could not load rates",
    retry: "Retry",
  },
  ja: {
    addCurrency: "＋ 通貨を追加",
    updated: "更新",
    refresh: "更新する",
    loading: "レート取得中…",
    error: "レートを取得できません",
    retry: "再試行",
  },
  zh: {
    addCurrency: "＋ 添加货币",
    updated: "更新时间",
    refresh: "刷新",
    loading: "汇率加载中…",
    error: "汇率获取失败",
    retry: "重试",
  },
};

function readValues(comp: Record<string, unknown> | undefined): CompValues {
  const baseCode = typeof comp?.baseCode === "string" && CURRENCY_MAP[comp.baseCode] ? comp.baseCode : DEFAULTS.baseCode;
  const amount = typeof comp?.amount === "number" && Number.isFinite(comp.amount) ? comp.amount : DEFAULTS.amount;
  const rawCurrencies = Array.isArray(comp?.currencies)
    ? (comp.currencies as unknown[]).filter((c): c is string => typeof c === "string" && !!CURRENCY_MAP[c])
    : [];
  const currencies = rawCurrencies.length > 0 ? Array.from(new Set(rawCurrencies)) : [...DEFAULT_CURRENCIES];
  if (!currencies.includes(baseCode)) currencies.unshift(baseCode);
  return { baseCode, amount, currencies };
}

function decimalsFor(code: string) {
  return ZERO_DECIMAL.has(code) ? 0 : 2;
}

function fmt(v: number, code: string): string {
  const d = decimalsFor(code);
  return v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d });
}

export default function CurrencyCalc({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const lang: Lang = (["en", "ja", "zh"] as Lang[]).includes(i18n.language as Lang) ? (i18n.language as Lang) : "en";
  const t = LABELS[lang];

  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((comp: Record<string, unknown>) => void) | undefined;

  const values = readValues(comp);

  // Rates the card already carries in its own config. Read once, on mount: fresh ones render
  // immediately and ask the API for nothing.
  const [storedRates] = useState(() => readStoredRates(comp?.rates, values.currencies));
  const [rates, setRates] = useState<RatesData | null>(storedRates);
  const [ratesLoading, setRatesLoading] = useState(!storedRates);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [addCode, setAddCode] = useState("");

  function loadRates() {
    setRatesLoading(true);
    setRatesError(null);
    fetchRates()
      .then((data) => setRates(data))
      .catch((err) => setRatesError(err instanceof Error ? err.message : String(err)))
      .finally(() => setRatesLoading(false));
  }

  // Initial load, skipped when the config already had rates: ratesLoading is set from that same
  // decision above, so there is no synchronous setState here.
  useEffect(() => {
    if (storedRates) return;
    fetchRates()
      .then((data) => setRates(data))
      .catch((err) => setRatesError(err instanceof Error ? err.message : String(err)))
      .finally(() => setRatesLoading(false));
  }, [storedRates]);

  // Keep the config's copy in step with what is on screen. The only writer of comp.rates, and it
  // writes nothing when the config already matches — which is the case for a card that just
  // restored from it. Deliberately not keyed on comp: this effect is what changes comp, and running
  // again on its own write is exactly what the equality check exists to make pointless.
  const currencyKey = values.currencies.join(",");
  useEffect(() => {
    if (!rates) return;
    const next = trimRates(rates, values.currencies);
    if (!sameStoredRates(comp?.rates, next)) save?.({ ...comp, rates: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates, currencyKey]);

  function computedValue(code: string): number | null {
    if (code === values.baseCode) return values.amount;
    if (!rates) return null;
    return convert(values.amount, values.baseCode, code, rates.rates);
  }

  function displayValue(code: string): string {
    if (code === focusedCode) return rawInput;
    const v = computedValue(code);
    return v == null ? "" : fmt(v, code);
  }

  function handleFocus(code: string, el: HTMLInputElement) {
    setFocusedCode(code);
    const v = computedValue(code);
    const next = v == null ? "" : v.toFixed(decimalsFor(code));
    setRawInput(next);
    // Swapping the formatted value ("10,000") for the raw one ("10000") drops the caret to the
    // start, which makes the first Backspace after a click do nothing - put it back at the end.
    requestAnimationFrame(() => el.setSelectionRange(next.length, next.length));
  }

  function handleChange(code: string, raw: string) {
    // Keep the box literally empty while editing (backspacing to nothing must stay nothing);
    // an empty box counts as 0 in the conversion, and the placeholder shows that 0.
    setRawInput(raw);
    const num = raw.trim() === "" ? 0 : Number(raw);
    if (!Number.isFinite(num)) return;
    save?.({ ...comp, baseCode: code, amount: num });
  }

  function handleAdd(code: string) {
    if (!code || values.currencies.includes(code)) return;
    save?.({ ...comp, currencies: [...values.currencies, code] });
    setAddCode("");
    // Rates restored from the config only cover the currencies that were on screen when they were
    // stored, so a row added afterwards may have nothing to convert with.
    if (rates && !(code in rates.rates)) loadRates();
  }

  function handleRemove(code: string) {
    if (values.currencies.length <= 1) return;
    const nextCurrencies = values.currencies.filter((c) => c !== code);
    let nextBase = values.baseCode;
    let nextAmount = values.amount;
    if (code === values.baseCode) {
      nextBase = nextCurrencies[0];
      const converted = rates ? convert(values.amount, values.baseCode, nextBase, rates.rates) : null;
      nextAmount = converted ?? values.amount;
    }
    save?.({ ...comp, currencies: nextCurrencies, baseCode: nextBase, amount: nextAmount });
  }

  const availableToAdd = CURRENCIES.filter((c) => !values.currencies.includes(c.code));

  return (
    <div className={styles.container}>
      <div className={styles.rows}>
        {values.currencies.map((code) => {
          const info = CURRENCY_MAP[code];
          return (
            <div key={code} className={styles.row}>
              <div className={styles.codeCol}>
                <span className={styles.code}>{code}</span>
                <span className={styles.name}>{info?.name[lang] ?? code}</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                className={styles.input}
                placeholder="0"
                value={displayValue(code)}
                onFocus={(e) => handleFocus(code, e.currentTarget)}
                onBlur={() => setFocusedCode(null)}
                onChange={(e) => handleChange(code, e.target.value)}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => handleRemove(code)}
                disabled={values.currencies.length <= 1}
                aria-label="remove"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {availableToAdd.length > 0 && (
        <select className={styles.addSelect} value={addCode} onChange={(e) => handleAdd(e.target.value)}>
          <option value="">{t.addCurrency}</option>
          {availableToAdd.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name[lang]}
            </option>
          ))}
        </select>
      )}

      <div className={styles.footer}>
        {ratesLoading ? (
          <span className={styles.status}>{t.loading}</span>
        ) : ratesError ? (
          <span className={styles.statusError}>
            {t.error}
            <button type="button" className={styles.retryBtn} onClick={() => loadRates()}>
              {t.retry}
            </button>
          </span>
        ) : (
          <span className={styles.status}>
            {t.updated} {rates?.date}
          </span>
        )}
        <button type="button" className={styles.refreshBtn} onClick={() => loadRates()} disabled={ratesLoading}>
          {t.refresh}
        </button>
      </div>
    </div>
  );
}
