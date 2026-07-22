import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { calcRealEstate, type RealEstateInputs } from "./calc";
import { config as defaultConfig } from "./config";
import styles from "./calc.module.css";

type Lang = "en" | "ja" | "zh";
type I18n = Record<Lang, string>;

const DEFAULTS = defaultConfig.comp as RealEstateInputs;

const FIELDS: Array<{ key: keyof RealEstateInputs; label: I18n; unit: I18n }> = [
  {
    key: "price",
    label: { en: "Property price", ja: "物件価格", zh: "房产价格" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
  },
  {
    key: "loanAmount",
    label: { en: "Loan amount", ja: "借入額", zh: "贷款金额" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
  },
  { key: "interestRate", label: { en: "Interest rate", ja: "金利", zh: "利率" }, unit: { en: "%/yr", ja: "%/年", zh: "%/年" } },
  { key: "loanYears", label: { en: "Loan term", ja: "返済期間", zh: "还款年限" }, unit: { en: "yr", ja: "年", zh: "年" } },
  {
    key: "brokerFee",
    label: { en: "Broker fee", ja: "仲介手数料", zh: "中介费" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
  },
  {
    key: "registrationFee",
    label: { en: "Registration fee", ja: "登記費用", zh: "登记费用" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
  },
  {
    key: "acquisitionTax",
    label: { en: "Acquisition tax", ja: "不動産取得税", zh: "不动产取得税" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
  },
  {
    key: "otherFees",
    label: { en: "Other fees", ja: "その他諸費用", zh: "其他费用" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
  },
  {
    key: "propertyTaxYearly",
    label: { en: "Property tax / yr", ja: "固定資産税等（年）", zh: "固定资产税（年）" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
  },
  {
    key: "maintenanceYearly",
    label: { en: "Maintenance / yr", ja: "管理・修繕（年）", zh: "管理・修缮（年）" },
    unit: { en: "man-yen", ja: "万円", zh: "万円" },
  },
  {
    key: "appreciationRate",
    label: { en: "Value change", ja: "価格変動率", zh: "价格变动率" },
    unit: { en: "%/yr", ja: "%/年", zh: "%/年" },
  },
  { key: "years", label: { en: "Holding years", ja: "保有年数", zh: "持有年数" }, unit: { en: "yr", ja: "年", zh: "年" } },
];

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    inputs: "Inputs",
    results: "Estimate after holding period",
    monthlyPayment: "Monthly payment",
    downPayment: "Down payment",
    purchaseFees: "Purchase fees",
    propertyValue: "Est. property value",
    loanBalance: "Loan balance",
    equity: "Equity",
    interestPaid: "Interest paid",
    runningCost: "Running cost",
    net: "Net if sold",
    year: "Yr",
    value: "Value",
    loan: "Loan",
    cashOut: "Cash out",
  },
  ja: {
    inputs: "入力",
    results: "保有期間後の試算",
    monthlyPayment: "月々返済額",
    downPayment: "頭金",
    purchaseFees: "諸費用合計",
    propertyValue: "推定物件価値",
    loanBalance: "ローン残高",
    equity: "純資産",
    interestPaid: "支払利息",
    runningCost: "維持費累計",
    net: "売却時損益",
    year: "年",
    value: "物件価値",
    loan: "残債",
    cashOut: "累計支出",
  },
  zh: {
    inputs: "输入",
    results: "持有期后估算",
    monthlyPayment: "月供",
    downPayment: "首付",
    purchaseFees: "购房费用",
    propertyValue: "预估房产价值",
    loanBalance: "贷款余额",
    equity: "净资产",
    interestPaid: "已付利息",
    runningCost: "持有成本",
    net: "出售时损益",
    year: "年",
    value: "房产价值",
    loan: "余额",
    cashOut: "累计支出",
  },
};

function readInputs(comp: Record<string, unknown> | undefined): RealEstateInputs {
  const result = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as Array<keyof RealEstateInputs>) {
    const v = comp?.[key];
    if (typeof v === "number" && Number.isFinite(v)) result[key] = v;
  }
  return result;
}

function toDraft(values: RealEstateInputs): Record<string, string> {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)]));
}

function fmt(v: number, digits = 0): string {
  return v.toLocaleString("ja-JP", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function RealEstateCalc({ config }: { config: Record<string, unknown> }) {
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

  function handleChange(key: keyof RealEstateInputs, raw: string) {
    setDraft((prev) => ({ ...prev, [key]: raw }));
    const num = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(num)) return;
    const next = { ...comp, [key]: num };
    lastSavedRef.current = JSON.stringify(readInputs(next));
    save?.(next);
  }

  const result = calcRealEstate(values);
  const downPayment = Math.max(0, values.price - values.loanAmount);

  const summary: Array<{ label: string; value: string; tone?: "pos" | "neg" }> = [
    { label: t.monthlyPayment, value: `${fmt(result.monthlyPayment, 2)}` },
    { label: t.downPayment, value: fmt(downPayment) },
    { label: t.purchaseFees, value: fmt(result.purchaseFees) },
    { label: t.propertyValue, value: fmt(result.final.propertyValue) },
    { label: t.loanBalance, value: fmt(result.final.loanBalance) },
    { label: t.equity, value: fmt(result.final.equity) },
    { label: t.interestPaid, value: fmt(result.interestPaid) },
    { label: t.runningCost, value: fmt(result.runningCost) },
    { label: t.net, value: fmt(result.final.net), tone: result.final.net >= 0 ? "pos" : "neg" },
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
            </span>
          </label>
        ))}
      </div>

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
              <th>{t.value}</th>
              <th>{t.loan}</th>
              <th>{t.equity}</th>
              <th>{t.cashOut}</th>
              <th>{t.net}</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.year}>
                <td>{r.year}</td>
                <td>{fmt(r.propertyValue)}</td>
                <td>{fmt(r.loanBalance)}</td>
                <td>{fmt(r.equity)}</td>
                <td>{fmt(r.totalCashOut)}</td>
                <td className={r.net >= 0 ? styles.pos : styles.neg}>{fmt(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
