import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { calcStock, type StockInputs } from "./calc";
import { config as defaultConfig } from "./config";
import styles from "./calc.module.css";

type Lang = "en" | "ja" | "zh";
type I18n = Record<Lang, string>;

const DEFAULTS = defaultConfig.comp as StockInputs;

type NumberKey = Exclude<keyof StockInputs, "account">;

const FIELDS: Array<{ key: NumberKey; label: I18n; unit: I18n; step: number }> = [
  {
    key: "initial",
    label: { en: "Initial amount", ja: "初期投資額", zh: "初始投资" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
    step: 10,
  },
  {
    key: "monthly",
    label: { en: "Monthly amount", ja: "毎月積立額", zh: "每月定投" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
    step: 1,
  },
  {
    key: "contribYears",
    label: { en: "Contribution years", ja: "積立年数", zh: "定投年数" },
    unit: { en: "yr", ja: "年", zh: "年" },
    step: 1,
  },
  {
    key: "annualReturn",
    label: { en: "Expected return", ja: "期待利回り", zh: "预期收益率" },
    unit: { en: "%/yr", ja: "%/年", zh: "%/年" },
    step: 0.1,
  },
  {
    key: "annualFee",
    label: { en: "Fund fee", ja: "信託報酬", zh: "管理费率" },
    unit: { en: "%/yr", ja: "%/年", zh: "%/年" },
    step: 0.1,
  },
  {
    key: "years",
    label: { en: "Total years", ja: "総運用年数", zh: "总运用年数" },
    unit: { en: "yr", ja: "年", zh: "年" },
    step: 1,
  },
];

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    inputs: "Inputs",
    account: "Account",
    nisa: "NISA (tax-free)",
    taxable: "Taxable (20.315%)",
    results: "Estimate after investment period",
    finalValue: "Final value",
    principal: "Principal",
    gain: "Gain",
    tax: "Tax",
    afterTax: "Value after tax",
    year: "Yr",
    value: "Value",
  },
  ja: {
    inputs: "入力",
    account: "口座",
    nisa: "NISA（非課税）",
    taxable: "課税口座（20.315%）",
    results: "運用期間後の試算",
    finalValue: "評価額",
    principal: "元本",
    gain: "運用益",
    tax: "税金",
    afterTax: "税引後残高",
    year: "年",
    value: "評価額",
  },
  zh: {
    inputs: "输入",
    account: "账户",
    nisa: "NISA（免税）",
    taxable: "应税账户（20.315%）",
    results: "投资期后估算",
    finalValue: "总市值",
    principal: "本金",
    gain: "收益",
    tax: "税金",
    afterTax: "税后剩余价值",
    year: "年",
    value: "市值",
  },
};

function capWarningText(lang: Lang, overflow: number): string {
  const amt = `${fmt(overflow)}${lang === "en" ? " man-yen" : "万円"}`;
  if (lang === "ja") return `NISA枠（年間360万円・生涯1800万円）を${amt}超過しています。超過分は課税口座として計算しています。`;
  if (lang === "zh") return `投入金额已超出NISA额度（年360万円/终身1800万円）${amt}，超出部分按应税账户计算。`;
  return `Contributions exceed the NISA cap (¥3.6M/yr, ¥18M lifetime) by ${amt}; the excess is taxed as a regular account.`;
}

function readInputs(comp: Record<string, unknown> | undefined): StockInputs {
  const result = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as Array<keyof StockInputs>) {
    const v = comp?.[key];
    if (key === "account") {
      if (v === "nisa" || v === "taxable") result.account = v;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      result[key] = v;
    }
  }
  return result;
}

function toDraft(values: StockInputs): Record<string, string> {
  return Object.fromEntries(FIELDS.map((f) => [f.key, String(values[f.key])]));
}

function fmt(v: number, digits = 0): string {
  return v.toLocaleString("ja-JP", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function StockCalc({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const lang: Lang = (["en", "ja", "zh"] as Lang[]).includes(i18n.language as Lang) ? (i18n.language as Lang) : "en";
  const t = LABELS[lang];

  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((comp: Record<string, unknown>) => void) | undefined;

  const values = readInputs(comp);
  const [draft, setDraft] = useState<Record<string, string>>(() => toDraft(values));

  // Sync when comp changes from outside (e.g. import/restore, edit modal)
  const lastSavedRef = useRef(JSON.stringify(values));
  useEffect(() => {
    const incoming = JSON.stringify(readInputs(comp));
    if (incoming !== lastSavedRef.current) {
      lastSavedRef.current = incoming;
      setDraft(toDraft(readInputs(comp)));
    }
  }, [comp]);

  function saveComp(next: Record<string, unknown>) {
    lastSavedRef.current = JSON.stringify(readInputs(next));
    save?.(next);
  }

  function handleChange(key: NumberKey, raw: string) {
    setDraft((prev) => ({ ...prev, [key]: raw }));
    const num = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(num)) return;
    saveComp({ ...comp, [key]: num });
  }

  function handleStep(key: NumberKey, step: number) {
    const current = Number(draft[key]);
    const base = Number.isFinite(current) ? current : values[key];
    const next = Math.round((base + step) * 100) / 100;
    handleChange(key, String(next));
  }

  const result = calcStock(values);

  const summary: Array<{ label: string; value: string; tone?: "pos" | "neg" }> = [
    { label: t.principal, value: fmt(result.final.principal) },
    { label: t.finalValue, value: fmt(result.final.value) },
    { label: t.gain, value: fmt(result.final.gain), tone: result.final.gain >= 0 ? "pos" : "neg" },
    { label: t.tax, value: fmt(result.tax) },
    {
      label: t.afterTax,
      value: fmt(result.final.afterTax),
      tone: result.final.afterTax >= result.final.principal ? "pos" : "neg",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.sectionTitle}>{t.inputs}</div>
      <div className={styles.inputGrid}>
        {FIELDS.map((f) => (
          <label key={f.key} className={styles.field}>
            <span className={styles.fieldLabel}>{f.label[lang]}</span>
            <span className={styles.inputWrap}>
              <input
                type="number"
                className={styles.input}
                value={draft[f.key] ?? ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
              <span className={styles.unit}>{f.unit[lang]}</span>
              <span className={styles.stepper}>
                <button type="button" tabIndex={-1} className={styles.stepBtn} onClick={() => handleStep(f.key, f.step)}>
                  ▲
                </button>
                <button type="button" tabIndex={-1} className={styles.stepBtn} onClick={() => handleStep(f.key, -f.step)}>
                  ▼
                </button>
              </span>
            </span>
          </label>
        ))}
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t.account}</span>
          <span className={styles.inputWrap}>
            <select
              className={styles.input}
              value={values.account}
              onChange={(e) => saveComp({ ...comp, account: e.target.value })}
            >
              <option value="nisa">{t.nisa}</option>
              <option value="taxable">{t.taxable}</option>
            </select>
          </span>
        </label>
      </div>

      {values.account === "nisa" && result.nisaCapExceeded && (
        <div className={styles.capWarning}>{capWarningText(lang, result.nisaOverflow)}</div>
      )}

      <div className={styles.sectionTitle}>
        {t.results}（{values.years}
        {lang === "en" ? " yr" : "年"}）
      </div>
      <div className={styles.summaryGrid}>
        {summary.map((s) => (
          <div key={s.label} className={styles.tile}>
            <span className={styles.tileLabel}>{s.label}</span>
            <span className={`${styles.tileValue} ${s.tone === "pos" ? styles.pos : ""} ${s.tone === "neg" ? styles.neg : ""}`}>
              {s.value}
              <span className={styles.tileUnit}>{lang === "en" ? "" : "万円"}</span>
            </span>
          </div>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t.year}</th>
              <th>{t.principal}</th>
              <th>{t.value}</th>
              <th>{t.gain}</th>
              <th>{t.afterTax}</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.year}>
                <td>{r.year}</td>
                <td>{fmt(r.principal)}</td>
                <td>{fmt(r.value)}</td>
                <td className={r.gain >= 0 ? styles.pos : styles.neg}>{fmt(r.gain)}</td>
                <td>{fmt(r.afterTax)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
