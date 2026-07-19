export const JAPAN_CAPITAL_GAINS_TAX = 0.20315;

export type StockInputs = {
  initial: number;
  monthly: number;
  annualReturn: number;
  annualFee: number;
  years: number;
  account: "nisa" | "taxable";
};

export type StockYearRow = {
  year: number;
  principal: number;
  value: number;
  gain: number;
  afterTax: number;
};

export type StockResult = {
  rows: StockYearRow[];
  final: StockYearRow;
  tax: number;
};

export function calcStock(input: StockInputs): StockResult {
  const years = Math.max(1, Math.round(input.years));
  const netAnnual = (input.annualReturn - input.annualFee) / 100;
  // Guard against total-loss rates below -100%/yr
  const monthlyRate = Math.pow(1 + Math.max(netAnnual, -0.99), 1 / 12) - 1;
  const taxRate = input.account === "taxable" ? JAPAN_CAPITAL_GAINS_TAX : 0;

  const rows: StockYearRow[] = [];
  let value = input.initial;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      value = value * (1 + monthlyRate) + input.monthly;
    }
    const principal = input.initial + input.monthly * 12 * y;
    const gain = value - principal;
    const afterTax = value - (gain > 0 ? gain * taxRate : 0);
    rows.push({ year: y, principal, value, gain, afterTax });
  }

  const final = rows[rows.length - 1];
  return { rows, final, tax: final.value - final.afterTax };
}
