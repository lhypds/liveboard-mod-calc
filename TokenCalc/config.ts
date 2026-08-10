export const config = {
  i: "TokenCalc",
  title: { en: "Token Calc", ja: "トークン計算", zh: "Token 计算" },
  refreshAgeMinutes: 0,
  info: [
    {
      title: { en: "About", ja: "概要", zh: "说明" },
      items: [
        {
          key: { en: "Purpose", ja: "用途", zh: "用途" },
          value: {
            en: "Price one token workload across LLMs from Anthropic, OpenAI, DeepSeek and Kimi, and look up each model's capabilities",
            ja: "同一のトークン使用量をAnthropic・OpenAI・DeepSeek・Kimiのモデル間で比較し、各モデルの仕様も参照",
            zh: "以同一 token 用量比较 Anthropic、OpenAI、DeepSeek、Kimi 各模型的价格，并查看模型能力",
          },
        },
        {
          key: { en: "Prices", ja: "価格", zh: "价格" },
          value: {
            en: "Per million tokens, from each provider's public price page; verified 2026-08-10",
            ja: "各社の公開価格ページに基づく百万トークン単価。2026-08-10時点で確認",
            zh: "每百万 token，来自各厂商公开价格页；2026-08-10 核验",
          },
        },
        {
          key: { en: "Cache rates", ja: "キャッシュ単価", zh: "缓存价格" },
          value: {
            en: "Anthropic and OpenAI publish multipliers on the input rate, so those are derived; DeepSeek and Kimi publish cache-hit prices directly",
            ja: "AnthropicとOpenAIは入力単価の倍率を公開しているため算出値。DeepSeekとKimiはキャッシュヒット単価を直接公開",
            zh: "Anthropic 与 OpenAI 公布的是输入单价的倍率，故为推算值；DeepSeek 与 Kimi 直接公布缓存命中价",
          },
        },
        {
          key: { en: "Exchange rates", ja: "為替レート", zh: "汇率" },
          value: {
            en: "DeepSeek and Kimi price in CNY, so cross-provider totals convert via Frankfurter (ECB reference rates), no API key required",
            ja: "DeepSeekとKimiは人民元建てのため、他社との比較はFrankfurter（ECB参照レート）で換算。APIキー不要",
            zh: "DeepSeek 与 Kimi 以人民币计价，跨厂商比较通过 Frankfurter（ECB 参考汇率）换算，无需 API key",
          },
        },
        {
          key: { en: "Not covered", ja: "対象外", zh: "不含" },
          value: {
            en: "Text models only — image, video, audio and embedding endpoints are priced per second or per image and are out of scope",
            ja: "テキストモデルのみ。画像・動画・音声・埋め込みは秒単位や枚数単位の課金のため対象外",
            zh: "仅文本模型；图像、视频、音频与向量端点按秒或按张计费，不在范围内",
          },
        },
      ],
    },
  ],
  x: 0,
  y: 0,
  w: 26,
  // Tall enough for a handful of models plus the whole Info panel below them without
  // scrolling; the card scrolls its own body, so a shorter one still works.
  h: 32,
  minW: 18,
  minH: 16,
  comp: {
    // Model ids on screen, in order. First one is the Info panel's default subject.
    models: ["claude-opus-5", "gpt-5.6-terra", "kimi-k3"],
    // Which model the Info panel describes
    focus: "claude-opus-5",
    // Price tier per model id, for the models that publish more than one (long context,
    // fast mode, introductory pricing). Absent means the model's first tier.
    tiers: {} as Record<string, string>,
    currency: "USD",
    batch: false,
    // Off by default: the card opens showing input + output at each model's default rate.
    // Turning it on brings back the tier, cache and batch controls. The settings those
    // control stay here either way, so the switch is lossless in both directions.
    full: false,
    // Tokens per call
    inputTokens: 1_000_000,
    cachedTokens: 0,
    cacheWriteTokens: 0,
    outputTokens: 100_000,
    calls: 1,
  },
};
