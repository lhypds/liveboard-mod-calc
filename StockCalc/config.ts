export const config = {
  i: "StockCalc",
  title: { en: "Stock Calc", ja: "株式計算", zh: "股票计算" },
  refreshAgeMinutes: 0,
  info: [
    {
      title: { en: "About", ja: "概要", zh: "说明" },
      items: [
        {
          key: { en: "Purpose", ja: "用途", zh: "用途" },
          value: {
            en: "Estimate remaining investment value after X years for a Japan resident",
            ja: "日本在住者向けのX年後の投資残高を試算",
            zh: "估算日本居住者X年后的投资剩余价值",
          },
        },
        {
          key: { en: "Tax", ja: "税金", zh: "税金" },
          value: {
            en: "Taxable account applies 20.315% on gains; NISA is tax-free",
            ja: "課税口座は利益に20.315%課税、NISAは非課税",
            zh: "应税账户对收益征收20.315%，NISA免税",
          },
        },
        {
          key: { en: "Unit", ja: "単位", zh: "单位" },
          value: { en: "Man-yen (10,000 JPY)", ja: "万円", zh: "万日元" },
        },
      ],
    },
  ],
  x: 0,
  y: 0,
  w: 40,
  h: 36,
  minW: 20,
  minH: 20,
  comp: {
    // All money values are in man-yen (万円)
    initial: 100, // 初期投資額
    monthly: 5, // 毎月積立額
    annualReturn: 5, // 期待利回り (%/年)
    annualFee: 0.1, // 信託報酬など (%/年)
    years: 20, // 運用年数
    // "nisa" (非課税) | "taxable" (課税口座 20.315%)
    account: "nisa",
  },
};
