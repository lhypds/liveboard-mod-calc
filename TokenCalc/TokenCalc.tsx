import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CAP_LABELS,
  LATENCY_LABELS,
  MODALITY_LABELS,
  MODEL_MAP,
  PROVIDER_LABELS,
  STATUS_LABELS,
  CACHE_NOTES,
} from "./models";
import type { DisplayCurrency, I18n, Lang, ModelInfo } from "./models";
import {
  convert,
  costOf,
  formatMoney,
  formatRate,
  formatTokens,
  formatWindow,
  neededCurrencies,
  parseTokens,
  searchModels,
  tierOf,
} from "./calc";
import type { Workload } from "./calc";
import { fetchRates, readStoredRates, sameStoredRates } from "./rates";
import type { RatesData } from "./rates";
import { config as defaultConfig } from "./config";
import styles from "./token.module.css";

type CompValues = {
  models: string[];
  focus: string;
  tiers: Record<string, string>;
  currency: DisplayCurrency;
  batch: boolean;
  /** Off (the default) means input and output at the default rate only — no tier, cache
      or batch controls. On brings all three back. */
  full: boolean;
  workload: Workload;
};

type WorkloadKey = keyof Workload;

const DEFAULTS = defaultConfig.comp;
const CURRENCIES: DisplayCurrency[] = ["USD", "CNY", "JPY"];

const FIELDS: Array<{ key: WorkloadKey; label: I18n; advanced?: true }> = [
  { key: "input", label: { en: "Input", ja: "入力", zh: "输入" } },
  { key: "output", label: { en: "Output", ja: "出力", zh: "输出" } },
  { key: "cached", label: { en: "Cache read", ja: "キャッシュ読取", zh: "缓存命中" }, advanced: true },
  { key: "cacheWrite", label: { en: "Cache write", ja: "キャッシュ書込", zh: "缓存写入" }, advanced: true },
  { key: "calls", label: { en: "Calls", ja: "リクエスト数", zh: "调用次数" } },
];

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    search: "Search a model…",
    noMatches: "No matching model",
    tokensPerCall: "Tokens per call",
    model: "Model",
    tier: "Tier",
    currency: "Currency",
    in: "In",
    cache: "Cache",
    out: "Out",
    total: "Total",
    empty: "Search above to add a model",
    batch: "Batch tier (50%)",
    full: "Full mode",
    noBatch: "no batch tier published",
    fxLoading: "Loading exchange rates…",
    fxError: "Exchange rate unavailable",
    retry: "Retry",
    fxAt: "FX",
    provider: "Provider",
    released: "First available",
    status: "Status",
    context: "Context",
    maxOutput: "Max output",
    params: "Parameters",
    undisclosed: "Not disclosed",
    modalities: "Modalities",
    latency: "Latency",
    caps: "Capabilities",
    pricing: "Price / MTok",
    cacheRead: "cache read",
    cacheWriteRate: "cache write",
    pricedIn: "Priced in",
    noPrice: "No public per-token price",
    remove: "remove",
  },
  ja: {
    search: "モデルを検索…",
    noMatches: "該当するモデルなし",
    tokensPerCall: "1リクエストあたりのトークン",
    model: "モデル",
    tier: "価格帯",
    currency: "通貨",
    in: "入力",
    cache: "キャッシュ",
    out: "出力",
    total: "合計",
    empty: "上の検索からモデルを追加",
    batch: "バッチ枠（50%）",
    full: "詳細モード",
    noBatch: "バッチ枠の公開価格なし",
    fxLoading: "為替レート取得中…",
    fxError: "為替レートを取得できません",
    retry: "再試行",
    fxAt: "為替",
    provider: "提供元",
    released: "初公開",
    status: "提供状況",
    context: "文脈長",
    maxOutput: "最大出力",
    params: "パラメータ数",
    undisclosed: "非公開",
    modalities: "モダリティ",
    latency: "レイテンシ",
    caps: "機能",
    pricing: "百万トークン単価",
    cacheRead: "キャッシュ読取",
    cacheWriteRate: "キャッシュ書込",
    pricedIn: "建値通貨",
    noPrice: "公開されたトークン単価なし",
    remove: "削除",
  },
  zh: {
    search: "搜索模型…",
    noMatches: "没有匹配的模型",
    tokensPerCall: "每次调用的词元数",
    model: "模型",
    tier: "价格档",
    currency: "货币",
    in: "输入",
    cache: "缓存",
    out: "输出",
    total: "合计",
    empty: "在上方搜索以添加模型",
    batch: "批量档（50%）",
    full: "完整模式",
    noBatch: "未公布批量档价格",
    fxLoading: "汇率加载中…",
    fxError: "汇率获取失败",
    retry: "重试",
    fxAt: "汇率",
    provider: "厂商",
    released: "首次公开",
    status: "提供状态",
    context: "上下文",
    maxOutput: "最大输出",
    params: "参数量",
    undisclosed: "未公开",
    modalities: "模态",
    latency: "延迟",
    caps: "能力",
    pricing: "每百万词元单价",
    cacheRead: "缓存读取",
    cacheWriteRate: "缓存写入",
    pricedIn: "计价货币",
    noPrice: "无公开词元单价",
    remove: "移除",
  },
};

/**
 * A `<select>` can be styled shut but never open — the option list is drawn by the OS. This
 * is the same box plus a list built from the card's own idiom, so both states match the rest
 * of the card. Closing on an outside pointerdown follows the board's other dropdowns.
 */
function Dropdown({
  value,
  options,
  onChange,
  variant,
  ariaLabel,
}: {
  value: string;
  options: Array<{ key: string; label: string }>;
  onChange: (key: string) => void;
  variant: "currency" | "tier";
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open]);

  const current = options.find((o) => o.key === value) ?? options[0];

  return (
    // A tier dropdown sits inside a row whose click selects the model — its clicks are its own.
    <div ref={wrapRef} className={styles.selectWrap} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={ariaLabel}
        className={`${styles.selectBtn} ${variant === "tier" ? styles.selectBtnTier : styles.selectBtnCurrency}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <span className={styles.selectLabel}>{current?.label ?? ""}</span>
        <svg className={styles.selectArrow} viewBox="0 0 8 8" aria-hidden="true">
          <path d="M1 2l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <ul className={`${styles.options} ${variant === "currency" ? styles.optionsRight : ""}`} role="listbox">
          {options.map((o) => (
            <li
              key={o.key}
              role="option"
              aria-selected={o.key === value}
              className={`${styles.option} ${o.key === value ? styles.optionActive : ""}`}
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function readValues(comp: Record<string, unknown> | undefined): CompValues {
  // An empty list is a real state, not a broken one: removing the last model leaves the card
  // empty until something is searched for. Only a card that never stored a list — an older
  // board, or one whose value isn't an array — starts from the defaults.
  const models = Array.isArray(comp?.models)
    ? Array.from(
        new Set((comp.models as unknown[]).filter((id): id is string => typeof id === "string" && !!MODEL_MAP[id])),
      )
    : [...DEFAULTS.models];

  const focus = typeof comp?.focus === "string" && models.includes(comp.focus) ? comp.focus : (models[0] ?? "");

  const tiers: Record<string, string> = {};
  const rawTiers = comp?.tiers;
  if (rawTiers && typeof rawTiers === "object") {
    for (const [id, key] of Object.entries(rawTiers as Record<string, unknown>)) {
      if (typeof key === "string" && MODEL_MAP[id]?.tiers.some((t) => t.key === key)) tiers[id] = key;
    }
  }

  const currency = CURRENCIES.includes(comp?.currency as DisplayCurrency)
    ? (comp!.currency as DisplayCurrency)
    : (DEFAULTS.currency as DisplayCurrency);

  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;

  return {
    models,
    focus,
    tiers,
    currency,
    batch: comp?.batch === true,
    full: comp?.full === true,
    workload: {
      input: num(comp?.inputTokens, DEFAULTS.inputTokens),
      cached: num(comp?.cachedTokens, DEFAULTS.cachedTokens),
      cacheWrite: num(comp?.cacheWriteTokens, DEFAULTS.cacheWriteTokens),
      output: num(comp?.outputTokens, DEFAULTS.outputTokens),
      calls: num(comp?.calls, DEFAULTS.calls),
    },
  };
}

// comp stores each token count under its own key; the calculator groups them as one workload.
const COMP_KEYS: Record<WorkloadKey, string> = {
  input: "inputTokens",
  cached: "cachedTokens",
  cacheWrite: "cacheWriteTokens",
  output: "outputTokens",
  calls: "calls",
};

export default function TokenCalc({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const lang: Lang = (["en", "ja", "zh"] as Lang[]).includes(i18n.language as Lang) ? (i18n.language as Lang) : "en";
  const t = LABELS[lang];

  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((comp: Record<string, unknown>) => void) | undefined;

  const values = readValues(comp);
  const rows = values.models.map((id) => MODEL_MAP[id]).filter((m): m is ModelInfo => !!m);
  const needed = neededCurrencies(rows, values.currency);

  // Rates the card already carries in its own config. Read once, on mount: fresh ones render
  // immediately and ask the API for nothing.
  const [storedRates] = useState(() => readStoredRates(comp?.rates, needed));
  const [rates, setRates] = useState<RatesData | null>(storedRates);
  // The set of currencies a failed fetch was for, so switching the display currency retries
  // instead of staying stuck on the old failure.
  const [fxErrorKey, setFxErrorKey] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [focusedField, setFocusedField] = useState<WorkloadKey | null>(null);
  const [draft, setDraft] = useState("");

  // A board that only shows USD-priced models never needs a rate at all, so the fetch is keyed on
  // what is actually on screen rather than run on mount.
  const neededKey = needed.join(",");
  const haveNeeded = needed.every((code) => typeof rates?.rates[code] === "number");
  const fxError = fxErrorKey === neededKey;
  // Both statuses are derived rather than stored: a rate is either on hand, being fetched, or
  // known to have failed for this exact set of currencies.
  const fxLoading = needed.length > 0 && !haveNeeded && !fxError;
  useEffect(() => {
    if (needed.length === 0 || haveNeeded || fxError) return;
    let alive = true;
    fetchRates()
      .then((data) => alive && setRates(data))
      .catch(() => alive && setFxErrorKey(neededKey));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neededKey, haveNeeded, fxError]);

  // Keep the config's copy in step with what was fetched. The only writer of comp.rates, and it
  // writes nothing when the config already matches — which is the case for a card that just
  // restored from it. Deliberately not keyed on comp: this effect is what changes comp.
  useEffect(() => {
    if (!rates) return;
    if (!sameStoredRates(comp?.rates, rates)) save?.({ ...comp, rates });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates]);

  const suggestions = searchModels(query, values.models, lang);
  const activeIndex = highlight >= 0 && highlight < suggestions.length ? highlight : -1;
  const searchRef = useRef<HTMLInputElement>(null);

  function addModel(id: string) {
    if (!MODEL_MAP[id]) return;
    setQuery("");
    setOpen(false);
    setHighlight(-1);
    // Searching for a model already on screen is a request to look at it, not to add it twice.
    if (values.models.includes(id)) {
      save?.({ ...comp, focus: id });
      return;
    }
    save?.({ ...comp, models: [...values.models, id], focus: id });
  }

  function removeModel(id: string) {
    const nextModels = values.models.filter((m) => m !== id);
    const nextTiers = { ...values.tiers };
    delete nextTiers[id];
    save?.({
      ...comp,
      models: nextModels,
      tiers: nextTiers,
      focus: values.focus === id ? (nextModels[0] ?? "") : values.focus,
    });
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (suggestions.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      const base = activeIndex === -1 ? (step === 1 ? -1 : 0) : activeIndex;
      setHighlight((base + step + suggestions.length) % suggestions.length);
      return;
    }
    if (e.key === "Enter") {
      const pick = suggestions[activeIndex === -1 ? 0 : activeIndex];
      if (pick) {
        e.preventDefault();
        addModel(pick.id);
        searchRef.current?.blur();
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  function fieldValue(key: WorkloadKey): string {
    if (key === focusedField) return draft;
    return formatTokens(values.workload[key]);
  }

  function handleFieldChange(key: WorkloadKey, raw: string) {
    // A leading zero never carries meaning in a token count, so typing 0 then 1 reads as 1.
    const text = raw.replace(/^0+(?=\d)/, "");
    setDraft(text);
    const n = parseTokens(text);
    if (n === null) return;
    save?.({ ...comp, [COMP_KEYS[key]]: n });
  }

  const workload = values.full ? values.workload : { ...values.workload, cached: 0, cacheWrite: 0 };
  const batch = values.full && values.batch;

  // Every row is priced in its own currency and then converted, so a mixed-provider comparison
  // stays comparable. A missing rate leaves the row's numbers null rather than guessing.
  const priced = rows.map((model) => {
    // Nothing may affect the total that isn't on screen: outside full mode a row is priced
    // at the model's default tier with no cache tokens and no batch discount, whatever comp
    // still holds from the last time those controls were visible.
    const tier = values.full ? tierOf(model, values.tiers[model.id]) : (model.tiers[0] ?? null);
    const batchFactor = batch ? model.batchFactor : undefined;
    const raw = tier ? costOf(tier, workload, batchFactor) : null;
    const to = (v: number | undefined) =>
      v === undefined ? null : convert(v, model.currency, values.currency, rates?.rates ?? null);
    return {
      model,
      tier,
      batchMissing: batch && model.batchFactor === undefined,
      input: to(raw?.input),
      cache: to(raw?.cache),
      output: to(raw?.output),
      total: to(raw?.total),
    };
  });

  const totals = priced.map((p) => p.total).filter((v): v is number => v !== null);
  // Only worth marking once there is something to be cheaper than.
  const cheapest = totals.length > 1 ? Math.min(...totals) : null;
  const anyBatchMissing = priced.some((p) => p.batchMissing);
  const focused = MODEL_MAP[values.focus] ?? rows[0];

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.searchWrap}>
          <input
            ref={searchRef}
            type="text"
            className={styles.search}
            placeholder={t.search}
            value={query}
            autoComplete="off"
            size={1}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(-1);
            }}
            onFocus={() => setOpen(true)}
            // Leaving the box without picking anything isn't a change — drop what was typed.
            onBlur={() => {
              setQuery("");
              setOpen(false);
              setHighlight(-1);
            }}
            onKeyDown={handleSearchKeyDown}
          />
          {open && (
            <ul className={styles.suggestions} role="listbox">
              {suggestions.map((m, i) => {
                const tier = m.tiers[0];
                return (
                  <li
                    key={m.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`${styles.suggestion} ${i === activeIndex ? styles.suggestionActive : ""}`}
                    // Keep the focus in the input, so onBlur can't clear the query before the click lands.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => addModel(m.id)}
                  >
                    <span className={styles.suggestionName}>{m.name}</span>
                    <span className={styles.suggestionMeta}>
                      {PROVIDER_LABELS[m.provider][lang]}
                      {tier
                        ? ` · ${formatRate(tier.input, m.currency)}/${formatRate(tier.output, m.currency)}`
                        : ` · ${t.noPrice}`}
                    </span>
                  </li>
                );
              })}
              {suggestions.length === 0 && <li className={styles.suggestionEmpty}>{t.noMatches}</li>}
            </ul>
          )}
        </div>
        <Dropdown
          variant="currency"
          ariaLabel={t.currency}
          value={values.currency}
          options={CURRENCIES.map((code) => ({ key: code, label: code }))}
          onChange={(code) => save?.({ ...comp, currency: code })}
        />
      </div>

      <div className={styles.sectionTitle}>{t.tokensPerCall}</div>
      <div className={styles.inputGrid}>
        {FIELDS.filter((f) => !f.advanced || values.full).map((f) => (
          <label key={f.key} className={styles.field}>
            <span className={styles.fieldLabel}>{f.label[lang]}</span>
            <input
              type="text"
              inputMode="numeric"
              className={`${styles.input} ${values.workload[f.key] === 0 ? styles.inputZero : ""}`}
              placeholder="0"
              value={fieldValue(f.key)}
              onFocus={() => {
                setFocusedField(f.key);
                // Zero is this field's empty state — the grey placeholder says so — so the box
                // opens empty and the first digit typed is the whole number, not "01" or "10".
                setDraft(values.workload[f.key] === 0 ? "" : String(values.workload[f.key]));
              }}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      {priced.length === 0 ? (
        <div className={styles.emptyHint}>{t.empty}</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.labelCol}>{t.model}</th>
                {values.full && <th className={styles.labelCol}>{t.tier}</th>}
                <th className={styles.numCol}>{t.in}</th>
                <th className={styles.numCol}>{t.out}</th>
                {values.full && <th className={styles.numCol}>{t.cache}</th>}
                <th className={styles.numCol}>{t.total}</th>
                <th className={styles.actionCol} />
              </tr>
            </thead>
            <tbody>
              {priced.map((p) => (
                <tr
                  key={p.model.id}
                  className={p.model.id === values.focus ? styles.rowFocused : ""}
                  onClick={() => save?.({ ...comp, focus: p.model.id })}
                >
                  {/* The flex row lives in a wrapper, not the cell: a `display: flex` cell stops
                      being a table-cell and sits at the top of the row instead of centring. */}
                  <td className={`${styles.labelCol} ${styles.modelCol}`}>
                    <div className={styles.modelCell}>
                      <span className={styles.modelName} title={p.model.name}>
                        {p.model.name}
                      </span>
                      {p.batchMissing && (
                        <span className={styles.flag} title={t.noBatch}>
                          †
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Its own column so every dropdown lines up, whatever the model name's length.
                      A model with one tier states it as text rather than a one-option dropdown. */}
                  {values.full && (
                    <td className={styles.labelCol}>
                      {p.model.tiers.length > 1 ? (
                        <Dropdown
                          variant="tier"
                          ariaLabel={t.tier}
                          value={p.tier?.key ?? ""}
                          options={p.model.tiers.map((tier) => ({ key: tier.key, label: tier.label[lang] }))}
                          onChange={(key) => save?.({ ...comp, tiers: { ...values.tiers, [p.model.id]: key } })}
                        />
                      ) : (
                        <span className={styles.tierStatic}>{p.tier ? p.tier.label[lang] : "—"}</span>
                      )}
                    </td>
                  )}
                  <td className={styles.numCol}>
                    {p.input === null ? "—" : formatMoney(p.input, values.currency)}
                  </td>
                  <td className={styles.numCol}>
                    {p.output === null ? "—" : formatMoney(p.output, values.currency)}
                  </td>
                  {values.full && (
                    <td className={styles.numCol}>
                      {p.cache === null ? "—" : formatMoney(p.cache, values.currency)}
                    </td>
                  )}
                  <td
                    className={`${styles.numCol} ${
                      p.total !== null && p.total === cheapest ? styles.best : styles.totalCell
                    }`}
                  >
                    {p.total === null ? "—" : formatMoney(p.total, values.currency)}
                  </td>
                  <td className={styles.actionCol}>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      aria-label={t.remove}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeModel(p.model.id);
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.checks}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={values.full}
              onChange={(e) => save?.({ ...comp, full: e.target.checked })}
            />
            {t.full}
          </label>
          {values.full && (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={values.batch}
                onChange={(e) => save?.({ ...comp, batch: e.target.checked })}
              />
              {t.batch}
            </label>
          )}
        </div>
        {fxError ? (
          // The rate source answers 5xx often enough that a dead end here would strand the
          // card's cross-currency totals until the display currency happened to change.
          <span className={styles.statusError}>
            {t.fxError}
            <button type="button" className={styles.retryBtn} onClick={() => setFxErrorKey(null)}>
              {t.retry}
            </button>
          </span>
        ) : (
          <span className={styles.status}>
            {fxLoading ? t.fxLoading : rates && needed.length > 0 ? `${t.fxAt} ${rates.date}` : ""}
          </span>
        )}
      </div>
      {anyBatchMissing && <div className={styles.flagNote}>† {t.noBatch}</div>}

      {focused && <ModelPanel model={focused} lang={lang} display={values.currency} rates={rates} t={t} />}
    </div>
  );
}

function ModelPanel({
  model,
  lang,
  display,
  rates,
  t,
}: {
  model: ModelInfo;
  lang: Lang;
  display: DisplayCurrency;
  rates: RatesData | null;
  t: Record<string, string>;
}) {
  // Rates are shown in the display currency so they line up with the table above; the model's own
  // pricing currency is stated below when the two differ.
  const rate = (v: number) => {
    const converted = convert(v, model.currency, display, rates?.rates ?? null);
    return converted === null ? "—" : formatRate(converted, display);
  };

  const facts: Array<{ key: string; value: string }> = [
    { key: t.provider, value: `${PROVIDER_LABELS[model.provider][lang]} · ${STATUS_LABELS[model.status][lang]}` },
    { key: t.released, value: model.released ?? "—" },
    { key: t.context, value: model.contextWindow ? formatWindow(model.contextWindow) : "—" },
    { key: t.maxOutput, value: model.maxOutput ? formatWindow(model.maxOutput) : "—" },
    { key: t.params, value: model.params ?? t.undisclosed },
    {
      key: t.modalities,
      value: `${model.input.map((m) => MODALITY_LABELS[m][lang]).join(" / ")} → ${model.output
        .map((m) => MODALITY_LABELS[m][lang])
        .join(" / ")}`,
    },
    { key: t.latency, value: model.latency ? LATENCY_LABELS[model.latency][lang] : "—" },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span className={styles.panelName}>{model.name}</span>
        <span className={styles.panelId}>{model.id}</span>
      </div>

      <div className={styles.facts}>
        {facts.map((f) => (
          <div key={f.key} className={styles.fact}>
            <span className={styles.factKey}>{f.key}</span>
            {/* Two columns in a card this narrow means a long value ellipsises — keep it hoverable */}
            <span className={styles.factValue} title={f.value}>
              {f.value}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.chips}>
        {model.caps.map((cap) => (
          <span key={cap} className={styles.chip}>
            {CAP_LABELS[cap][lang]}
          </span>
        ))}
      </div>

      <div className={styles.panelSection}>{t.pricing}</div>
      {model.tiers.length === 0 ? (
        <div className={styles.panelNote}>{t.noPrice}</div>
      ) : (
        <div className={styles.priceList}>
          {model.tiers.map((tier) => (
            <div key={tier.key} className={styles.priceRow}>
              <span className={styles.priceLabel}>{tier.label[lang]}</span>
              <span className={styles.priceValue}>
                {rate(tier.input)} / {rate(tier.output)}
                {tier.cacheRead !== undefined && ` · ${t.cacheRead} ${rate(tier.cacheRead)}`}
                {tier.cacheWrite !== undefined && ` · ${t.cacheWriteRate} ${rate(tier.cacheWrite)}`}
              </span>
            </div>
          ))}
          {model.currency !== display && (
            <div className={styles.panelNote}>
              {t.pricedIn} {model.currency}
            </div>
          )}
          <div className={styles.panelNote}>{CACHE_NOTES[model.provider][lang]}</div>
        </div>
      )}

      {model.note && <div className={styles.panelNote}>{model.note[lang]}</div>}
    </div>
  );
}
