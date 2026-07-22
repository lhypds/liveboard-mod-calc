export type Lang = "en" | "ja" | "zh";

export type CurrencyInfo = {
  code: string;
  name: Record<Lang, string>;
};

// Currencies supported by the Frankfurter API (ECB reference rates)
export const CURRENCIES: CurrencyInfo[] = [
  { code: "AUD", name: { en: "Australian Dollar", ja: "豪ドル", zh: "澳元" } },
  { code: "BGN", name: { en: "Bulgarian Lev", ja: "ブルガリア・レフ", zh: "保加利亚列弗" } },
  { code: "BRL", name: { en: "Brazilian Real", ja: "ブラジルレアル", zh: "巴西雷亚尔" } },
  { code: "CAD", name: { en: "Canadian Dollar", ja: "カナダドル", zh: "加元" } },
  { code: "CHF", name: { en: "Swiss Franc", ja: "スイスフラン", zh: "瑞士法郎" } },
  { code: "CNY", name: { en: "Chinese Yuan", ja: "人民元", zh: "人民币" } },
  { code: "CZK", name: { en: "Czech Koruna", ja: "チェココルナ", zh: "捷克克朗" } },
  { code: "DKK", name: { en: "Danish Krone", ja: "デンマーククローネ", zh: "丹麦克朗" } },
  { code: "EUR", name: { en: "Euro", ja: "ユーロ", zh: "欧元" } },
  { code: "GBP", name: { en: "British Pound", ja: "英ポンド", zh: "英镑" } },
  { code: "HKD", name: { en: "Hong Kong Dollar", ja: "香港ドル", zh: "港币" } },
  { code: "HUF", name: { en: "Hungarian Forint", ja: "ハンガリーフォリント", zh: "匈牙利福林" } },
  { code: "IDR", name: { en: "Indonesian Rupiah", ja: "インドネシアルピア", zh: "印尼盾" } },
  { code: "ILS", name: { en: "Israeli Shekel", ja: "イスラエルシェケル", zh: "以色列谢克尔" } },
  { code: "INR", name: { en: "Indian Rupee", ja: "インドルピー", zh: "印度卢比" } },
  { code: "ISK", name: { en: "Icelandic Krona", ja: "アイスランドクローナ", zh: "冰岛克朗" } },
  { code: "JPY", name: { en: "Japanese Yen", ja: "日本円", zh: "日元" } },
  { code: "KRW", name: { en: "South Korean Won", ja: "韓国ウォン", zh: "韩元" } },
  { code: "MXN", name: { en: "Mexican Peso", ja: "メキシコペソ", zh: "墨西哥比索" } },
  { code: "MYR", name: { en: "Malaysian Ringgit", ja: "マレーシアリンギット", zh: "马来西亚林吉特" } },
  { code: "NOK", name: { en: "Norwegian Krone", ja: "ノルウェークローネ", zh: "挪威克朗" } },
  { code: "NZD", name: { en: "New Zealand Dollar", ja: "ニュージーランドドル", zh: "新西兰元" } },
  { code: "PHP", name: { en: "Philippine Peso", ja: "フィリピンペソ", zh: "菲律宾比索" } },
  { code: "PLN", name: { en: "Polish Zloty", ja: "ポーランドズウォティ", zh: "波兰兹罗提" } },
  { code: "RON", name: { en: "Romanian Leu", ja: "ルーマニアレウ", zh: "罗马尼亚列伊" } },
  { code: "SEK", name: { en: "Swedish Krona", ja: "スウェーデンクローナ", zh: "瑞典克朗" } },
  { code: "SGD", name: { en: "Singapore Dollar", ja: "シンガポールドル", zh: "新加坡元" } },
  { code: "THB", name: { en: "Thai Baht", ja: "タイバーツ", zh: "泰铢" } },
  { code: "TRY", name: { en: "Turkish Lira", ja: "トルコリラ", zh: "土耳其里拉" } },
  { code: "USD", name: { en: "US Dollar", ja: "米ドル", zh: "美元" } },
  { code: "ZAR", name: { en: "South African Rand", ja: "南アフリカランド", zh: "南非兰特" } },
];

export const CURRENCY_MAP: Record<string, CurrencyInfo> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
);

export const DEFAULT_CURRENCIES = ["JPY", "USD", "CNY", "AUD"];

// rates: 1 unit of `base` currency = rates[code] units of `code`
export function convert(amount: number, fromCode: string, toCode: string, rates: Record<string, number>): number | null {
  const fromRate = rates[fromCode];
  const toRate = rates[toCode];
  if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate === 0) return null;
  return (amount / fromRate) * toRate;
}
