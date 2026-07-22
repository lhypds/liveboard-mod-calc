export const config = {
  i: "CurrencyCalc",
  title: { en: "Currency Calc", ja: "通貨換算", zh: "汇率换算" },
  refreshAgeMinutes: 60,
  info: [
    {
      title: { en: "About", ja: "概要", zh: "说明" },
      items: [
        {
          key: { en: "Purpose", ja: "用途", zh: "用途" },
          value: {
            en: "Convert an amount across multiple currencies at once",
            ja: "入力した金額を複数通貨に同時換算",
            zh: "将输入金额同时换算为多种货币",
          },
        },
        {
          key: { en: "Data source", ja: "データ元", zh: "数据来源" },
          value: {
            en: "Frankfurter (ECB reference rates), no API key required",
            ja: "Frankfurter（ECB参照レート）、APIキー不要",
            zh: "Frankfurter（ECB 参考汇率），无需 API key",
          },
        },
      ],
    },
  ],
  x: 0,
  y: 0,
  w: 19,
  h: 16,
  minW: 16,
  minH: 14,
  comp: {
    // Currency of the amount currently being edited
    baseCode: "JPY",
    amount: 10000,
    // Currency rows displayed, in order
    currencies: ["JPY", "USD", "CNY", "AUD"],
  },
};
