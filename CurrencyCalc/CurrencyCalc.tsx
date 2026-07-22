import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CURRENCIES, CURRENCY_MAP, DEFAULT_CURRENCIES, convert, type Lang } from "./calc";
import { fetchRates, type RatesData } from "./rates";
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
  return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function CurrencyCalc({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const lang: Lang = (["en", "ja", "zh"] as Lang[]).includes(i18n.language as Lang) ? (i18n.language as Lang) : "en";
  const t = LABELS[lang];

  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((comp: Record<string, unknown>) => void) | undefined;

  const values = readValues(comp);

  const [rates, setRates] = useState<RatesData | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [addCode, setAddCode] = useState("");

  function loadRates(force: boolean) {
    setRatesLoading(true);
    setRatesError(null);
    fetchRates(force)
      .then((data) => setRates(data))
      .catch((err) => setRatesError(err instanceof Error ? err.message : String(err)))
      .finally(() => setRatesLoading(false));
  }

  // Initial load: ratesLoading already starts true, so no synchronous setState here.
  useEffect(() => {
    fetchRates(false)
      .then((data) => setRates(data))
      .catch((err) => setRatesError(err instanceof Error ? err.message : String(err)))
      .finally(() => setRatesLoading(false));
  }, []);

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

  function handleFocus(code: string) {
    setFocusedCode(code);
    const v = computedValue(code);
    setRawInput(v == null ? "" : v.toFixed(decimalsFor(code)));
  }

  function handleChange(code: string, raw: string) {
    setRawInput(raw);
    const num = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(num)) return;
    save?.({ ...comp, baseCode: code, amount: num });
  }

  function handleAdd(code: string) {
    if (!code || values.currencies.includes(code)) return;
    save?.({ ...comp, currencies: [...values.currencies, code] });
    setAddCode("");
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
                value={displayValue(code)}
                onFocus={() => handleFocus(code)}
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
            <button type="button" className={styles.retryBtn} onClick={() => loadRates(true)}>
              {t.retry}
            </button>
          </span>
        ) : (
          <span className={styles.status}>
            {t.updated} {rates?.date}
          </span>
        )}
        <button type="button" className={styles.refreshBtn} onClick={() => loadRates(true)} disabled={ratesLoading}>
          {t.refresh}
        </button>
      </div>
    </div>
  );
}
