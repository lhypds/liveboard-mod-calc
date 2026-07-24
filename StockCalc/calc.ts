export const JAPAN_CAPITAL_GAINS_TAX = 0.20315;
// New NISA (2024-): annual cap = tsumitate 120万円 + growth 240万円; lifetime cap 1800万円.
// The growth-frame sub-cap (max 1200万円 of the 1800万円 lifetime total) isn't modeled here.
export const NISA_ANNUAL_CAP = 360;
export const NISA_LIFETIME_CAP = 1800;

export type StockInputs = {
  initial: number;
  monthly: number;
  annualReturn: number;
  annualFee: number;
  years: number;
  // number of years the monthly contribution runs; the rest of `years` just holds and grows
  contribYears: number;
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
  // true once contributions have overflowed the NISA annual/lifetime cap into a taxable bucket
  nisaCapExceeded: boolean;
  // total principal (man-yen) that spilled into the taxable bucket because of the NISA cap
  nisaOverflow: number;
};

export function calcStock(input: StockInputs): StockResult {
  const years = Math.max(1, Math.round(input.years));
  const contribYears = Math.min(years, Math.max(0, Math.round(input.contribYears)));
  const netAnnual = (input.annualReturn - input.annualFee) / 100;
  // Guard against total-loss rates below -100%/yr
  const monthlyRate = Math.pow(1 + Math.max(netAnnual, -0.99), 1 / 12) - 1;

  const rows: StockYearRow[] = [];

  if (input.account === "taxable") {
    let value = input.initial;
    let principal = input.initial;
    for (let y = 1; y <= years; y++) {
      const monthly = y <= contribYears ? input.monthly : 0;
      for (let m = 0; m < 12; m++) {
        value = value * (1 + monthlyRate) + monthly;
      }
      principal += monthly * 12;
      const gain = value - principal;
      const afterTax = value - (gain > 0 ? gain * JAPAN_CAPITAL_GAINS_TAX : 0);
      rows.push({ year: y, principal, value, gain, afterTax });
    }
    const final = rows[rows.length - 1];
    return { rows, final, tax: final.value - final.afterTax, nisaCapExceeded: false, nisaOverflow: 0 };
  }

  // NISA: contributions beyond the annual/lifetime cap spill into a taxable bucket instead.
  let nisaValue = 0;
  let taxableValue = 0;
  let nisaPrincipal = 0;
  let taxablePrincipal = 0;
  let nisaCapExceeded = false;

  const invest = (amount: number, annualRemaining: { v: number }) => {
    if (amount <= 0) return { toNisa: 0, toTaxable: 0 };
    const room = Math.max(0, Math.min(annualRemaining.v, NISA_LIFETIME_CAP - nisaPrincipal));
    const toNisa = Math.min(amount, room);
    const toTaxable = amount - toNisa;
    annualRemaining.v -= toNisa;
    nisaPrincipal += toNisa;
    taxablePrincipal += toTaxable;
    if (toTaxable > 1e-9) nisaCapExceeded = true;
    return { toNisa, toTaxable };
  };

  for (let y = 1; y <= years; y++) {
    const annualRemaining = { v: NISA_ANNUAL_CAP };
    if (y === 1) {
      const { toNisa, toTaxable } = invest(input.initial, annualRemaining);
      nisaValue += toNisa;
      taxableValue += toTaxable;
    }
    const monthly = y <= contribYears ? input.monthly : 0;
    for (let m = 0; m < 12; m++) {
      const { toNisa, toTaxable } = invest(monthly, annualRemaining);
      nisaValue = nisaValue * (1 + monthlyRate) + toNisa;
      taxableValue = taxableValue * (1 + monthlyRate) + toTaxable;
    }
    const principal = nisaPrincipal + taxablePrincipal;
    const value = nisaValue + taxableValue;
    const gain = value - principal;
    const taxableGain = taxableValue - taxablePrincipal;
    const tax = taxableGain > 0 ? taxableGain * JAPAN_CAPITAL_GAINS_TAX : 0;
    const afterTax = value - tax;
    rows.push({ year: y, principal, value, gain, afterTax });
  }

  const final = rows[rows.length - 1];
  return { rows, final, tax: final.value - final.afterTax, nisaCapExceeded, nisaOverflow: taxablePrincipal };
}
