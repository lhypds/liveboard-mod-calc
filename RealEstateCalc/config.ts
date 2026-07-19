export const config = {
  i: "RealEstateCalc",
  title: { en: "Real Estate Calc", ja: "不動産計算", zh: "房产计算" },
  refreshAgeMinutes: 0,
  info: [
    {
      title: { en: "About", ja: "概要", zh: "说明" },
      items: [
        {
          key: { en: "Purpose", ja: "用途", zh: "用途" },
          value: {
            en: "Estimate net value of a Japan property purchase after X years",
            ja: "日本の不動産購入のX年後の資産価値を試算",
            zh: "估算日本房产持有X年后的净值",
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
    price: 5000, // 物件価格
    loanAmount: 4500, // 借入額
    interestRate: 0.7, // 金利 (%/年)
    loanYears: 35, // 返済期間 (年)
    brokerFee: 172, // 仲介手数料
    registrationFee: 50, // 登記費用
    acquisitionTax: 50, // 不動産取得税
    otherFees: 30, // 印紙税・融資手数料など
    propertyTaxYearly: 15, // 固定資産税・都市計画税 (万円/年)
    maintenanceYearly: 36, // 管理費・修繕積立金 (万円/年)
    appreciationRate: 0, // 価格変動率 (%/年)
    years: 10, // 保有年数
  },
};
