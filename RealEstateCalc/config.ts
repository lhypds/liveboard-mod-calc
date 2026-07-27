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
        {
          key: { en: "Sell fee", ja: "売却手数料", zh: "卖出手续费" },
          value: {
            en: "Net-if-sold subtracts a fixed selling broker fee you enter directly",
            ja: "売却時損益には直接入力した仲介手数料を差し引いて計算",
            zh: "出售时损益已扣除直接输入的卖出中介费",
          },
        },
        {
          key: { en: "Property type", ja: "物件種別", zh: "房产类型" },
          value: {
            en: "New: no buy-side broker fee. Used: no repair reserve fund (still pays ongoing maintenance).",
            ja: "新築: 仲介手数料なし。中古: 修繕積立基金なし（管理・修繕は引き続き発生）。",
            zh: "新房：不计购入中介费。存量房：不计修缮积立基金（仍需支付日常修缮费）。",
          },
        },
        {
          key: { en: "Loan tax credit", ja: "住宅ローン控除", zh: "住宅贷款抵扣" },
          value: {
            en: "Theoretical estimate only (year-end loan balance × 0.7%, capped by housing category; new-build runs 13 yrs, used runs 10 yrs). Does not check against actual income/resident tax owed since annual income isn't part of this calculator.",
            ja: "理論値の試算です（年末残高×0.7%、住宅区分により上限あり。新築13年・中古10年）。年収を入力しないため、実際の所得税・住民税額による上限は考慮していません。",
            zh: "仅为理论估算（年末贷款余额×0.7%，按住宅区分设上限；新房13年、存量房10年）。由于本工具未采集年收入，未考虑实际所得税・住民税额度上限。",
          },
        },
      ],
    },
  ],
  x: 0,
  y: 0,
  w: 36,
  h: 52,
  minW: 20,
  minH: 20,
  comp: {
    // All money values are in man-yen (万円)
    price: 5000, // 物件価格
    loanAmount: 4500, // 借入額
    interestRate: 0.7, // 金利 (%/年)
    loanYears: 35, // 返済期間 (年)
    loanFeeRate: 2.2, // 融資事務手数料率 (%、借入額に対して)
    loanOtherFees: 3, // 融資関連その他費用（印紙代・登記関連など）
    brokerFee: 172, // 仲介手数料
    registrationFee: 50, // 登記費用
    acquisitionTax: 50, // 不動産取得税
    otherFees: 30, // 印紙税など
    repairReserveFund: 20, // 修繕積立基金（新築時のみ）
    propertyTaxYearly: 15, // 固定資産税・都市計画税 (万円/年)
    maintenanceMonthly: 3, // 管理費・修繕積立金 (万円/月)
    otherFeesYearly: 0, // その他諸費用 (万円/年)
    appreciationRate: 0, // 価格変動率 (%/年)
    sellFee: 171.6, // 売却時仲介手数料 = (物件価格 x 3% + 6万円) x 1.1
    sellTax: 0, // 譲渡所得税など
    sellOtherFees: 0, // 売却時その他諸費用
    years: 10, // 保有年数
    // "new" (新築) | "used" (中古)
    propertyType: "used",
    // "certified" (認定住宅等) | "zeh" (ZEH水準省エネ住宅) | "energySaving" (省エネ基準適合住宅) | "other" (その他の住宅)
    housingCategory: "energySaving",
  },
};
