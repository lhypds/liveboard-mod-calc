export type Lang = "en" | "ja" | "zh";
export type I18n = Record<Lang, string>;

export type Provider = "anthropic" | "openai" | "kimi" | "deepseek";
// Currency a provider publishes its per-token prices in. Kimi prices in CNY on its
// China platform, so a cross-provider comparison has to convert.
export type PriceCurrency = "USD" | "CNY";
export type DisplayCurrency = "USD" | "CNY" | "JPY";
export type Modality = "text" | "image" | "video" | "audio";
export type Latency = "fastest" | "fast" | "moderate" | "slower";
// current: the provider's recommended line. legacy: still callable but superseded.
// limited: no self-serve access. retired: past its published retirement date.
export type Status = "current" | "legacy" | "limited" | "retired";

export type CapKey =
  | "thinking"
  | "effort"
  | "vision"
  | "video"
  | "audio"
  | "tools"
  | "agentic"
  | "computerUse"
  | "caching"
  | "batch"
  | "structured"
  | "webSearch"
  | "longContext"
  | "fastMode"
  | "openWeights"
  | "fim"
  | "anthropicApi";

/** One published price point, per million tokens, in the model's `currency`. */
export type PriceTier = {
  key: string;
  label: I18n;
  input: number;
  output: number;
  // Reading a cache hit, and (where the provider charges for it) writing the cache.
  cacheRead?: number;
  cacheWrite?: number;
};

export type ModelInfo = {
  /** API model id where the provider publishes one, else a slug. */
  id: string;
  name: string;
  provider: Provider;
  /** Extra search terms — nicknames, code names, alternate spellings. */
  aliases?: string[];
  /** First public availability, YYYY-MM-DD. */
  released?: string;
  status: Status;
  currency: PriceCurrency;
  /** Empty when the provider publishes no per-token price for this model. */
  tiers: PriceTier[];
  /** Multiplier on a batch-tier request, where the provider offers one. */
  batchFactor?: number;
  contextWindow?: number;
  maxOutput?: number;
  /** Only where the provider discloses it — most closed models don't. */
  params?: string;
  input: Modality[];
  output: Modality[];
  caps: CapKey[];
  latency?: Latency;
  note?: I18n;
};

export const PROVIDER_LABELS: Record<Provider, I18n> = {
  anthropic: { en: "Anthropic", ja: "Anthropic", zh: "Anthropic" },
  openai: { en: "OpenAI", ja: "OpenAI", zh: "OpenAI" },
  kimi: { en: "Kimi", ja: "Kimi", zh: "Kimi" },
  deepseek: { en: "DeepSeek", ja: "DeepSeek", zh: "DeepSeek" },
};

/** Order the Add dropdown and the model list follow: the order the card documents. */
export const PROVIDER_ORDER: Provider[] = ["anthropic", "openai", "deepseek", "kimi"];

export const STATUS_LABELS: Record<Status, I18n> = {
  current: { en: "Current", ja: "現行", zh: "现行" },
  legacy: { en: "Legacy", ja: "旧世代", zh: "旧世代" },
  limited: { en: "Limited access", ja: "限定提供", zh: "限定提供" },
  retired: { en: "Retired", ja: "提供終了", zh: "已下线" },
};

export const LATENCY_LABELS: Record<Latency, I18n> = {
  fastest: { en: "Fastest", ja: "最速", zh: "最快" },
  fast: { en: "Fast", ja: "高速", zh: "快" },
  moderate: { en: "Moderate", ja: "中程度", zh: "中等" },
  slower: { en: "Slower", ja: "低速", zh: "较慢" },
};

export const MODALITY_LABELS: Record<Modality, I18n> = {
  text: { en: "text", ja: "テキスト", zh: "文本" },
  image: { en: "image", ja: "画像", zh: "图像" },
  video: { en: "video", ja: "動画", zh: "视频" },
  audio: { en: "audio", ja: "音声", zh: "音频" },
};

export const CAP_LABELS: Record<CapKey, I18n> = {
  thinking: { en: "Reasoning / thinking", ja: "推論・思考", zh: "推理 / 思考" },
  effort: { en: "Effort levels", ja: "エフォート段階", zh: "推理强度档" },
  vision: { en: "Image input", ja: "画像入力", zh: "图像输入" },
  video: { en: "Video input", ja: "動画入力", zh: "视频输入" },
  audio: { en: "Audio", ja: "音声", zh: "音频" },
  tools: { en: "Tool calling", ja: "ツール呼び出し", zh: "工具调用" },
  agentic: { en: "Agentic coding", ja: "エージェント型コーディング", zh: "Agent 编码" },
  computerUse: { en: "Computer use", ja: "コンピュータ操作", zh: "计算机操作" },
  caching: { en: "Prompt caching", ja: "プロンプトキャッシュ", zh: "提示缓存" },
  batch: { en: "Batch API", ja: "バッチAPI", zh: "批量 API" },
  structured: { en: "Structured output", ja: "構造化出力", zh: "结构化输出" },
  webSearch: { en: "Web search tool", ja: "Web検索ツール", zh: "网页搜索工具" },
  longContext: { en: "1M context", ja: "100万トークン文脈", zh: "百万上下文" },
  fastMode: { en: "Fast mode tier", ja: "高速モード枠", zh: "快速模式档" },
  openWeights: { en: "Open weights", ja: "オープンウェイト", zh: "开放权重" },
  fim: { en: "Fill-in-the-middle", ja: "FIM補完", zh: "FIM 补全" },
  anthropicApi: { en: "Anthropic-compatible API", ja: "Anthropic互換API", zh: "Anthropic 兼容 API" },
};

/* How each provider prices a cache hit, stated once here rather than per model — the
   Info panel shows it beside the derived numbers so they can be checked. */
export const CACHE_NOTES: Record<Provider, I18n> = {
  anthropic: {
    en: "Cache rates are multipliers on input: 0.1× to read, 1.25× to write (5-minute TTL; 2× for the 1-hour TTL).",
    ja: "キャッシュ料金は入力単価の倍率：読み取り0.1倍、書き込み1.25倍（TTL5分。1時間TTLは2倍）。",
    zh: "缓存价格为输入单价的倍数：命中读取 0.1×，写入 1.25×（5 分钟 TTL；1 小时 TTL 为 2×）。",
  },
  openai: {
    en: "Cached input is billed at 0.1× the input rate on the GPT-5 family; there is no separate cache-write charge.",
    ja: "GPT-5系ではキャッシュ入力は入力単価の0.1倍。キャッシュ書き込みの別料金はなし。",
    zh: "GPT-5 系列缓存输入按输入单价 0.1× 计费；不单独收取写入费用。",
  },
  kimi: {
    en: "Cache-hit input is a separately published rate, not a multiplier.",
    ja: "キャッシュヒット入力は倍率ではなく個別に公開された単価。",
    zh: "缓存命中输入为单独公布的价格，而非倍率。",
  },
  deepseek: {
    en: "Cache-hit and cache-miss input are separately published rates, not multipliers.",
    ja: "キャッシュヒット／ミスの入力単価は倍率ではなく個別に公開された値。",
    zh: "缓存命中与未命中的输入单价均为单独公布的价格，而非倍率。",
  },
};

const STD: I18n = { en: "Standard", ja: "標準", zh: "标准" };
const LONG: I18n = { en: "Long context", ja: "長文脈", zh: "长上下文" };
const FAST: I18n = { en: "Fast mode", ja: "高速モード", zh: "快速模式" };

/* Anthropic publishes cache pricing as multipliers on the model's own input rate, so the
   two cache numbers are derived here rather than transcribed — one place to fix if the
   multipliers change. 5-minute TTL, the default. */
function anthropic(input: number, output: number, key = "standard", label = STD): PriceTier {
  return { key, label, input, output, cacheRead: input * 0.1, cacheWrite: input * 1.25 };
}

/* OpenAI bills a cached input token at 0.1× input on the GPT-5 family and charges nothing
   to write the cache, so there is no cacheWrite here. */
function openai(input: number, output: number, key = "standard", label = STD): PriceTier {
  return { key, label, input, output, cacheRead: input * 0.1 };
}

const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    provider: "anthropic",
    aliases: ["fable"],
    released: "2026-06-09",
    status: "current",
    currency: "USD",
    tiers: [anthropic(10, 50)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "caching", "batch", "structured", "webSearch", "longContext"],
    latency: "slower",
    note: {
      en: "Highest-capability tier. Adaptive thinking is always on and cannot be disabled; the raw chain of thought is never returned. Requires 30-day data retention (not available under ZDR).",
      ja: "最高能力帯。アダプティブ思考は常時オンで無効化不可、生の思考過程は返らない。30日間のデータ保持が必須（ZDRでは利用不可）。",
      zh: "最高能力档。自适应思考始终开启且无法关闭，原始思维链不会返回。需 30 天数据保留（ZDR 组织不可用）。",
    },
  },
  {
    id: "claude-mythos-5",
    name: "Claude Mythos 5",
    provider: "anthropic",
    aliases: ["mythos", "glasswing"],
    released: "2026-06-09",
    status: "limited",
    currency: "USD",
    tiers: [anthropic(10, 50)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "caching", "batch", "structured", "longContext"],
    latency: "slower",
    note: {
      en: "Same specs and pricing as Fable 5, aimed at defensive cybersecurity work. Project Glasswing only — no self-serve signup.",
      ja: "Fable 5と同スペック・同価格。防御的セキュリティ用途向け。Project Glasswing限定でセルフサーブ登録は不可。",
      zh: "规格与定价同 Fable 5，面向防御性网络安全工作。仅限 Project Glasswing，无自助注册。",
    },
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "anthropic",
    aliases: ["opus"],
    released: "2026-07-24",
    status: "current",
    currency: "USD",
    tiers: [anthropic(5, 25), anthropic(10, 50, "fast", FAST)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "computerUse", "caching", "batch", "structured", "webSearch", "longContext", "fastMode"],
    latency: "moderate",
    note: {
      en: "Default recommendation for complex agentic coding. Thinking is on by default. Fast mode gives ~2.5× output speed at the higher rate, on the Claude API only. Prompt-cache minimum is 512 tokens.",
      ja: "複雑なエージェント型コーディングの標準推奨。思考はデフォルトでオン。高速モードは約2.5倍の出力速度で高価格、Claude APIのみ。プロンプトキャッシュ下限は512トークン。",
      zh: "复杂 Agent 编码的默认推荐。思考默认开启。快速模式约 2.5× 输出速度、价格更高，仅 Claude API 提供。提示缓存最小 512 token。",
    },
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    aliases: ["sonnet"],
    released: "2026-06-30",
    status: "current",
    currency: "USD",
    tiers: [
      anthropic(3, 15),
      anthropic(2, 10, "intro", { en: "Intro (to 2026-08-31)", ja: "導入価格（〜2026-08-31）", zh: "导入价（至 2026-08-31）" }),
    ],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "computerUse", "caching", "batch", "structured", "webSearch", "longContext"],
    latency: "fast",
    note: {
      en: "Balanced capability and speed. Introductory pricing of $2/$10 runs through 2026-08-31; the standard rate is $3/$15.",
      ja: "能力と速度のバランス型。導入価格$2/$10は2026-08-31まで、標準は$3/$15。",
      zh: "能力与速度均衡。导入价 $2/$10 至 2026-08-31，标准价 $3/$15。",
    },
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    aliases: ["haiku", "claude-haiku-4-5-20251001"],
    released: "2025-10-15",
    status: "current",
    currency: "USD",
    tiers: [anthropic(1, 5)],
    batchFactor: 0.5,
    contextWindow: 200_000,
    maxOutput: 64_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching", "batch", "structured"],
    latency: "fastest",
    note: {
      en: "The fastest Claude. Uses the older fixed-budget extended thinking rather than adaptive thinking.",
      ja: "最速のClaude。アダプティブ思考ではなく従来の固定バジェット拡張思考。",
      zh: "最快的 Claude。使用传统固定预算扩展思考，而非自适应思考。",
    },
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    released: "2026-05-28",
    status: "legacy",
    currency: "USD",
    tiers: [anthropic(5, 25), anthropic(10, 50, "fast", FAST)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "caching", "batch", "structured", "longContext", "fastMode"],
    latency: "moderate",
  },
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
    provider: "anthropic",
    released: "2026-04-16",
    status: "legacy",
    currency: "USD",
    tiers: [anthropic(5, 25)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "caching", "batch", "structured", "longContext"],
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "anthropic",
    released: "2026-02-05",
    status: "legacy",
    currency: "USD",
    tiers: [anthropic(5, 25)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "caching", "batch", "structured", "longContext"],
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    released: "2026-02-17",
    status: "legacy",
    currency: "USD",
    tiers: [anthropic(3, 15)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "caching", "batch", "structured", "longContext"],
    latency: "fast",
  },
  {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    aliases: ["claude-opus-4-5-20251101"],
    released: "2025-11-24",
    status: "legacy",
    currency: "USD",
    tiers: [anthropic(5, 25)],
    batchFactor: 0.5,
    maxOutput: 64_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "tools", "agentic", "caching", "batch", "structured"],
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    aliases: ["claude-sonnet-4-5-20250929"],
    released: "2025-09-29",
    status: "legacy",
    currency: "USD",
    tiers: [anthropic(3, 15)],
    batchFactor: 0.5,
    maxOutput: 64_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "agentic", "caching", "batch", "structured"],
  },
  {
    id: "claude-opus-4-1",
    name: "Claude Opus 4.1",
    provider: "anthropic",
    aliases: ["claude-opus-4-1-20250805"],
    released: "2025-08-05",
    status: "retired",
    currency: "USD",
    tiers: [anthropic(15, 75)],
    batchFactor: 0.5,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching", "batch"],
    note: {
      en: "Published retirement date was 2026-08-05 — check the deprecations page before assuming it still answers.",
      ja: "公表された提供終了日は2026-08-05。まだ応答するかは廃止予定ページで確認のこと。",
      zh: "公布的下线日期为 2026-08-05，是否仍可调用请查阅弃用页面。",
    },
  },
];

const OPENAI_MODELS: ModelInfo[] = [
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    aliases: ["sol"],
    released: "2026-07-09",
    status: "current",
    currency: "USD",
    tiers: [openai(5, 30), openai(10, 45, "long", LONG)],
    batchFactor: 0.5,
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "agentic", "computerUse", "caching", "batch", "structured", "webSearch", "longContext"],
    note: {
      en: "Top of the GPT-5.6 line, for the most complex tasks. Data-residency endpoints add 10%.",
      ja: "GPT-5.6系の最上位、最も複雑なタスク向け。データレジデンシー対応エンドポイントは+10%。",
      zh: "GPT-5.6 系列最高档，面向最复杂任务。数据驻留端点 +10%。",
    },
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    aliases: ["terra"],
    released: "2026-07-09",
    status: "current",
    currency: "USD",
    tiers: [openai(2, 12), openai(4, 18, "long", LONG)],
    batchFactor: 0.5,
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "agentic", "caching", "batch", "structured", "webSearch", "longContext"],
    note: {
      en: "Balances capability and price in the 5.6 line. Prices were adjusted 2026-07-30.",
      ja: "5.6系で能力と価格のバランス型。価格は2026-07-30に改定。",
      zh: "5.6 系列中能力与价格的平衡档。价格于 2026-07-30 调整。",
    },
  },
  {
    id: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "openai",
    aliases: ["luna"],
    released: "2026-07-09",
    status: "current",
    currency: "USD",
    tiers: [openai(0.2, 1.2), openai(0.4, 1.8, "long", LONG)],
    batchFactor: 0.5,
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["vision", "tools", "caching", "batch", "structured", "longContext"],
    note: {
      en: "High-throughput tier of the 5.6 line. Prices were adjusted 2026-07-30.",
      ja: "5.6系の高スループット枠。価格は2026-07-30に改定。",
      zh: "5.6 系列的高吞吐档。价格于 2026-07-30 调整。",
    },
  },
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    provider: "openai",
    released: "2026-04-23",
    status: "legacy",
    currency: "USD",
    tiers: [openai(5, 30), openai(10, 45, "long", LONG)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "agentic", "caching", "batch", "structured", "longContext"],
  },
  {
    id: "gpt-5.5-pro",
    name: "GPT-5.5 Pro",
    provider: "openai",
    released: "2026-04-23",
    status: "legacy",
    currency: "USD",
    tiers: [openai(30, 180), openai(60, 270, "long", LONG)],
    batchFactor: 0.5,
    contextWindow: 1_000_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching", "batch", "structured", "longContext"],
    note: {
      en: "Higher compute tier of GPT-5.5, with correspondingly higher latency.",
      ja: "GPT-5.5の高計算量枠。その分レイテンシも高い。",
      zh: "GPT-5.5 的更高算力档，延迟相应更高。",
    },
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "openai",
    released: "2026-03-05",
    status: "legacy",
    currency: "USD",
    tiers: [openai(2.5, 15)],
    batchFactor: 0.5,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "agentic", "computerUse", "caching", "batch", "structured"],
    note: {
      en: "Eligible-region processing adds 10% across the 5.4 series.",
      ja: "5.4系では対象地域での処理は+10%。",
      zh: "5.4 系列在符合条件的区域处理 +10%。",
    },
  },
  {
    id: "gpt-5.4-pro",
    name: "GPT-5.4 Pro",
    provider: "openai",
    released: "2026-03-05",
    status: "legacy",
    currency: "USD",
    tiers: [openai(30, 180)],
    batchFactor: 0.5,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching", "batch", "structured"],
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 mini",
    provider: "openai",
    released: "2026-03-17",
    status: "legacy",
    currency: "USD",
    tiers: [openai(0.75, 4.5)],
    batchFactor: 0.5,
    contextWindow: 400_000,
    input: ["text", "image"],
    output: ["text"],
    caps: ["vision", "tools", "caching", "batch", "structured", "webSearch"],
  },
  {
    id: "gpt-5.4-nano",
    name: "GPT-5.4 nano",
    provider: "openai",
    released: "2026-03-17",
    status: "legacy",
    currency: "USD",
    tiers: [openai(0.2, 1.25)],
    batchFactor: 0.5,
    input: ["text"],
    output: ["text"],
    caps: ["tools", "caching", "batch", "structured"],
    note: {
      en: "Lowest-cost, highest-throughput member of the 5.4 series.",
      ja: "5.4系で最も低コスト・高スループット。",
      zh: "5.4 系列中成本最低、吞吐最高。",
    },
  },
  {
    id: "gpt-5.3-codex",
    name: "GPT-5.3-Codex",
    provider: "openai",
    aliases: ["codex"],
    released: "2026-02-05",
    status: "legacy",
    currency: "USD",
    tiers: [openai(1.75, 14), openai(3.5, 28, "fast", FAST)],
    batchFactor: 0.5,
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "tools", "agentic", "caching", "structured"],
    note: {
      en: "Built for agentic coding and long-running software engineering. Tools and containers are billed separately.",
      ja: "エージェント型コーディングと長時間のソフトウェア開発向け。ツールやコンテナは別課金。",
      zh: "面向 Agent 编码与长程软件工程任务。工具与容器另行计费。",
    },
  },
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    released: "2025-12-11",
    status: "legacy",
    currency: "USD",
    tiers: [],
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching", "batch", "structured"],
  },
  {
    id: "gpt-5.2-pro",
    name: "GPT-5.2 Pro",
    provider: "openai",
    released: "2025-12-11",
    status: "legacy",
    currency: "USD",
    tiers: [],
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching", "batch"],
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    status: "legacy",
    currency: "USD",
    tiers: [],
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching", "structured"],
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    released: "2025-08-07",
    status: "legacy",
    currency: "USD",
    tiers: [],
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching", "batch", "structured"],
  },
  {
    id: "gpt-5-pro",
    name: "GPT-5 Pro",
    provider: "openai",
    released: "2025-08-07",
    status: "legacy",
    currency: "USD",
    tiers: [],
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools", "caching"],
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 mini",
    provider: "openai",
    released: "2025-08-07",
    status: "legacy",
    currency: "USD",
    tiers: [],
    input: ["text", "image"],
    output: ["text"],
    caps: ["tools", "caching", "batch", "structured"],
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 nano",
    provider: "openai",
    released: "2025-08-07",
    status: "legacy",
    currency: "USD",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["tools", "caching", "batch"],
  },
  {
    id: "gpt-oss-120b",
    name: "gpt-oss-120b",
    provider: "openai",
    aliases: ["oss"],
    status: "current",
    currency: "USD",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "tools", "openWeights"],
    note: {
      en: "Open-weight model under Apache 2.0. No OpenAI per-token charge — you pay for the compute you run it on.",
      ja: "Apache 2.0のオープンウェイトモデル。OpenAIのトークン課金はなく、自前の計算資源コストのみ。",
      zh: "Apache 2.0 开放权重模型。无 OpenAI 按 token 计费，自行承担部署算力成本。",
    },
  },
  {
    id: "gpt-oss-20b",
    name: "gpt-oss-20b",
    provider: "openai",
    aliases: ["oss"],
    status: "current",
    currency: "USD",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "tools", "openWeights"],
    note: {
      en: "Open-weight model under Apache 2.0, sized for local deployment.",
      ja: "Apache 2.0のオープンウェイトモデル。ローカル配備向けサイズ。",
      zh: "Apache 2.0 开放权重模型，适合本地部署的规模。",
    },
  },
];

/* Kimi prices in CNY per million tokens on the China open platform. Its cache-hit rate is
   published directly rather than as a multiplier, so these are transcribed, not derived. */
function kimi(cacheRead: number, input: number, output: number): PriceTier {
  return { key: "standard", label: STD, input, output, cacheRead };
}

/* DeepSeek prices in CNY per million tokens, publishing a cache-hit and a cache-miss input
   rate side by side — both transcribed, neither derived. */
function deepseek(cacheRead: number, input: number, output: number): PriceTier {
  return { key: "standard", label: STD, input, output, cacheRead };
}

const DEEPSEEK_MODELS: ModelInfo[] = [
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek-V4-Flash",
    provider: "deepseek",
    aliases: ["v4 flash", "v4-flash", "0731"],
    released: "2026-04-24",
    status: "current",
    currency: "CNY",
    tiers: [deepseek(0.02, 1, 2)],
    contextWindow: 1_000_000,
    maxOutput: 384_000,
    params: "≈284B total / 13B active",
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "tools", "structured", "caching", "longContext", "fim", "anthropicApi"],
    note: {
      en: "Current Flash revision is dated 2026-07-31; the V4 line opened in preview 2026-04-24. Thinking mode is the default and can be switched off. Published concurrency ceiling is 2500. FIM works in non-thinking mode only. DeepSeek has pre-announced a substantial price rise.",
      ja: "現行Flashリビジョンは2026-07-31付。V4系は2026-04-24にプレビュー開始。思考モードが既定で、オフにも切替可能。公開された同時実行上限は2500。FIMは非思考モードのみ。DeepSeekは近い将来の大幅値上げを予告済み。",
      zh: "当前 Flash 修订版为 2026-07-31；V4 系列于 2026-04-24 开始预览。默认思考模式，可切换为非思考。公开并发上限 2500。FIM 仅支持非思考模式。DeepSeek 已预告近期大幅涨价。",
    },
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek-V4-Pro",
    provider: "deepseek",
    aliases: ["v4 pro", "v4-pro"],
    released: "2026-04-24",
    status: "current",
    currency: "CNY",
    tiers: [deepseek(0.025, 3, 6)],
    contextWindow: 1_000_000,
    maxOutput: 384_000,
    params: "≈1.6T total / 49B active",
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "tools", "structured", "caching", "longContext", "anthropicApi"],
    note: {
      en: "Stronger high-end reasoning and agent tier of V4. Published concurrency ceiling is 500. The docs still say the Responses API is unsupported while announcing it for early August 2026, so treat that field as lagging reality. DeepSeek has pre-announced a substantial price rise.",
      ja: "V4系の高性能推論・エージェント枠。公開された同時実行上限は500。ドキュメントはResponses API未対応と記載しつつ2026年8月初旬の対応を予告しており、記述が実態に遅れている可能性あり。DeepSeekは大幅値上げを予告済み。",
      zh: "V4 系列中更强的高端推理 / Agent 档。公开并发上限 500。文档仍写 Responses API 暂不支持，同时称计划 2026 年 8 月初加入，说明文档滞后于实际状态。DeepSeek 已预告近期大幅涨价。",
    },
  },
  {
    id: "deepseek-v3.2",
    name: "DeepSeek-V3.2",
    provider: "deepseek",
    released: "2025-12-01",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "tools", "openWeights"],
    note: {
      en: "The hosted V4 API no longer quotes a V3.2 rate; weights and the historical release stay publicly available, so self-deployment cost is your own.",
      ja: "現行のV4 APIではV3.2の単価は提示されない。重みと過去のリリースは公開されており、自前配備のコストは自己負担。",
      zh: "当前 V4 托管 API 不再给出 V3.2 的单价；权重与历史发布仍可公开获取，自部署成本自理。",
    },
  },
  {
    id: "deepseek-v3.2-exp",
    name: "DeepSeek-V3.2-Exp",
    provider: "deepseek",
    released: "2025-09-29",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "tools", "openWeights"],
  },
  {
    id: "deepseek-v3.1",
    name: "DeepSeek-V3.1",
    provider: "deepseek",
    released: "2025-08-21",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "tools", "openWeights"],
    note: {
      en: "Mid-generation V3 release that strengthened reasoning and tool use. The old API alias has been migrated.",
      ja: "推論とツール利用を強化したV3系の中間リリース。旧APIエイリアスは移行済み。",
      zh: "强化推理与工具调用的 V3 中间代版本。旧 API alias 已迁移。",
    },
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek-R1",
    provider: "deepseek",
    aliases: ["r1"],
    released: "2025-01-20",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "openWeights"],
    note: {
      en: "Open reasoning model released under MIT. No DeepSeek per-token charge on the weights themselves — compute cost is yours. The hosted alias is no longer part of the current V4 line.",
      ja: "MITライセンスで公開された推論モデル。重み自体にDeepSeekのトークン課金はなく、計算資源コストは自己負担。ホスト版エイリアスは現行V4系には含まれない。",
      zh: "以 MIT 许可开放的推理模型。权重本身无 DeepSeek 按 token 计费，算力成本自理。托管 alias 已不属于当前 V4 主线。",
    },
  },
  {
    id: "deepseek-r1-distill",
    name: "DeepSeek-R1-Distill",
    provider: "deepseek",
    aliases: ["distill", "qwen", "llama"],
    released: "2025-01-20",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    params: "1.5B / 7B / 8B / 14B / 32B / 70B",
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "openWeights"],
    note: {
      en: "R1's reasoning distilled into Qwen and Llama checkpoints at six sizes, for local deployment. No hosted per-token rate; each checkpoint carries both DeepSeek's release terms and its base model's licence.",
      ja: "R1の推論をQwen／Llamaの6サイズに蒸留したもの。ローカル配備向け。ホスト版のトークン単価はなく、各チェックポイントはDeepSeekの公開条件と基盤モデルのライセンス双方に従う。",
      zh: "将 R1 推理蒸馏到 Qwen / Llama 六种尺寸，适合本地部署。无托管 token 单价；各 checkpoint 需同时遵守 DeepSeek 发布许可与对应基础模型许可。",
    },
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    provider: "deepseek",
    released: "2024-12-26",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["tools", "openWeights"],
    note: {
      en: "Third-generation MoE general model — the flagship base before R1.",
      ja: "第3世代のMoE汎用モデル。R1以前のフラッグシップ基盤。",
      zh: "第三代 MoE 通用模型，R1 之前的旗舰基座。",
    },
  },
];

const KIMI_MODELS: ModelInfo[] = [
  {
    id: "kimi-k3",
    name: "Kimi K3",
    provider: "kimi",
    aliases: ["k3", "moonshot"],
    released: "2026-07-16",
    status: "current",
    currency: "CNY",
    tiers: [kimi(2, 20, 100)],
    contextWindow: 1_000_000,
    params: "≈2.8T",
    input: ["text", "image", "video"],
    output: ["text"],
    caps: ["thinking", "effort", "vision", "video", "tools", "agentic", "caching", "structured", "longContext"],
    note: {
      en: "Kimi's flagship. Rate limits scale with account balance and tier; enterprises can request elastic limits and an SLA.",
      ja: "Kimiのフラッグシップ。レート制限は残高・アカウント等級に応じて変動。法人は弾力的な制限とSLAを申請可能。",
      zh: "Kimi 旗舰模型。速率限制随充值与账户等级变化；企业可申请弹性限速与 SLA。",
    },
  },
  {
    id: "kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    provider: "kimi",
    aliases: ["k2.7", "kimi code"],
    released: "2026-07-22",
    status: "current",
    currency: "CNY",
    tiers: [kimi(1.3, 6.5, 27)],
    contextWindow: 256_000,
    input: ["text", "image", "video"],
    output: ["text"],
    caps: ["thinking", "vision", "video", "tools", "agentic", "caching", "structured"],
    note: {
      en: "Coding-specialised model for agentic software engineering. The English resource pages quote roughly $0.19 / $0.95 / $4 per MTok (cache / input / output), so the effective rate depends on region and channel.",
      ja: "エージェント型ソフトウェア開発向けのコーディング専用モデル。英語版資料では約$0.19/$0.95/$4（キャッシュ/入力/出力、百万トークン）と提示され、地域・チャネルで実効単価が異なる。",
      zh: "面向 Agent 软件工程的编码专用模型。英文资源页给出约 $0.19 / $0.95 / $4（缓存 / 输入 / 输出，每百万 token），实际单价随地区与渠道不同。",
    },
  },
  {
    id: "kimi-k2.6",
    name: "Kimi K2.6",
    provider: "kimi",
    aliases: ["k2.6"],
    released: "2026-04-20",
    status: "current",
    currency: "CNY",
    tiers: [kimi(1.1, 6.5, 27)],
    contextWindow: 256_000,
    input: ["text", "image", "video"],
    output: ["text"],
    caps: ["thinking", "vision", "video", "tools", "agentic", "caching", "webSearch", "structured"],
    note: {
      en: "General multimodal model with thinking and non-thinking modes. Some tool parameters are restricted while thinking is on.",
      ja: "思考／非思考モードを持つ汎用マルチモーダル。思考モード時は一部ツールパラメータに制限あり。",
      zh: "通用多模态模型，支持思考 / 非思考模式。思考模式下部分工具参数有限制。",
    },
  },
  {
    id: "kimi-k2.5",
    name: "Kimi K2.5",
    provider: "kimi",
    aliases: ["k2.5"],
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text", "image"],
    output: ["text"],
    caps: ["thinking", "vision", "tools"],
    note: {
      en: "Closed to new API users; existing integrations may continue.",
      ja: "新規APIユーザーへの提供は終了。既存の連携は継続可能。",
      zh: "已停止对新用户开放；存量集成可继续使用。",
    },
  },
  {
    id: "kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    provider: "kimi",
    released: "2025-11-06",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["thinking", "tools", "agentic"],
    note: {
      en: "Long-horizon reasoning with interleaved thinking; documented for up to roughly 300 tool-call steps.",
      ja: "交互式思考による長時間推論。約300ステップのツール呼び出しまで対応と記載。",
      zh: "交错式思考的长程推理，官方称可支持约 300 步工具调用。",
    },
  },
  {
    id: "kimi-k2-0905",
    name: "Kimi K2-0905",
    provider: "kimi",
    aliases: ["highspeed"],
    released: "2025-09-05",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    contextWindow: 256_000,
    input: ["text"],
    output: ["text"],
    caps: ["tools", "agentic"],
    note: {
      en: "K2 refresh that widened context to about 256K. The Highspeed variant was quoted at roughly 60–100 tokens/s.",
      ja: "文脈を約256Kに拡張したK2更新版。Highspeed版は約60〜100トークン/秒と提示されていた。",
      zh: "将上下文扩至约 256K 的 K2 更新版。Highspeed 版曾给出约 60–100 token/s。",
    },
  },
  {
    id: "kimi-k2-turbo",
    name: "Kimi K2 Turbo",
    provider: "kimi",
    released: "2025-08-01",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["tools"],
    note: {
      en: "High-speed K2 variant, quoted at about 40 tokens/s against roughly 10 for the base model.",
      ja: "K2の高速版。基本版の約10トークン/秒に対し約40トークン/秒と提示。",
      zh: "K2 高速版本，官方约 40 token/s，基础版约 10 token/s。",
    },
  },
  {
    id: "kimi-k2",
    name: "Kimi K2",
    provider: "kimi",
    released: "2025-07-11",
    status: "legacy",
    currency: "CNY",
    tiers: [],
    input: ["text"],
    output: ["text"],
    caps: ["tools", "agentic", "openWeights"],
    note: {
      en: "The base K2 model the later K2 Thinking and K2.x releases build on.",
      ja: "後のK2 ThinkingやK2.x系の土台となる基本モデル。",
      zh: "后续 K2 Thinking 与 K2.x 系列的基础模型。",
    },
  },
];

export const MODELS: ModelInfo[] = [...ANTHROPIC_MODELS, ...OPENAI_MODELS, ...DEEPSEEK_MODELS, ...KIMI_MODELS];

export const MODEL_MAP: Record<string, ModelInfo> = Object.fromEntries(MODELS.map((m) => [m.id, m]));
