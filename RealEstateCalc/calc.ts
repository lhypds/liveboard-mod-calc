export type RealEstateInputs = {
  price: number;
  loanAmount: number;
  interestRate: number;
  loanYears: number;
  loanFeeRate: number;
  loanOtherFees: number;
  brokerFee: number;
  registrationFee: number;
  acquisitionTax: number;
  otherFees: number;
  repairReserveFund: number;
  propertyTaxYearly: number;
  maintenanceMonthly: number;
  otherFeesYearly: number;
  appreciationRate: number;
  sellFee: number;
  years: number;
  // "new" (新築、仲介手数料なし) | "used" (中古、修繕積立基金なし)
  propertyType: "new" | "used";
  // 住宅ローン控除の対象区分 (借入限度額の判定に使用)
  housingCategory: "certified" | "zeh" | "energySaving" | "other";
};

export type YearRow = {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  totalCashOut: number;
  sellFee: number;
  loanTaxCredit: number;
  net: number;
};

export type RealEstateResult = {
  monthlyPayment: number;
  purchaseFees: number;
  rows: YearRow[];
  final: YearRow;
  interestPaid: number;
  runningCost: number;
  totalLoanTaxCredit: number;
};

// 住宅ローン控除の借入限度額 (万円、現行制度)。既存住宅はいずれの区分も控除期間10年。
const LOAN_TAX_CREDIT_CAPS: Record<RealEstateInputs["propertyType"], Record<RealEstateInputs["housingCategory"], number>> = {
  new: { certified: 4500, zeh: 3500, energySaving: 3000, other: 0 },
  used: { certified: 3000, zeh: 3000, energySaving: 3000, other: 2000 },
};

const LOAN_TAX_CREDIT_RATE = 0.007; // 控除率 0.7%

export function loanTaxCreditCap(propertyType: RealEstateInputs["propertyType"], category: RealEstateInputs["housingCategory"]): number {
  return LOAN_TAX_CREDIT_CAPS[propertyType][category];
}

export function loanTaxCreditPeriod(propertyType: RealEstateInputs["propertyType"]): number {
  return propertyType === "new" ? 13 : 10;
}

// Standard Japan real estate agent fee: (price × 3% + 6万円) × 1.1 (10% consumption tax)
export function estimateBrokerFee(price: number): number {
  return Math.round((price * 0.03 + 6) * 1.1 * 100) / 100;
}

export function loanFeeAmount(loanAmount: number, ratePct: number): number {
  return Math.round(((loanAmount * ratePct) / 100) * 100) / 100;
}

export function monthlyLoanPayment(loan: number, annualRatePct: number, years: number): number {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRatePct / 100 / 12;
  if (loan <= 0) return 0;
  if (r === 0) return loan / n;
  const k = Math.pow(1 + r, n);
  return (loan * r * k) / (k - 1);
}

function loanBalanceAfter(loan: number, annualRatePct: number, years: number, monthsPaid: number, payment: number): number {
  const n = Math.max(1, Math.round(years * 12));
  const m = Math.min(monthsPaid, n);
  const r = annualRatePct / 100 / 12;
  if (loan <= 0) return 0;
  if (r === 0) return Math.max(0, loan - payment * m);
  const k = Math.pow(1 + r, m);
  return Math.max(0, loan * k - (payment * (k - 1)) / r);
}

export function calcRealEstate(input: RealEstateInputs): RealEstateResult {
  // New-build purchases go direct from the developer (no buy-side broker fee).
  // The repair reserve fund (修繕積立基金) is a one-time founding contribution
  // collected only from first (new-build) buyers; used-home buyers don't pay it,
  // but still pay the ongoing monthly maintenance/repair reserve (maintenanceMonthly).
  const brokerFee = input.propertyType === "new" ? 0 : input.brokerFee;
  const repairReserveFund = input.propertyType === "used" ? 0 : input.repairReserveFund;
  const maintenanceYearly = input.maintenanceMonthly * 12;

  const purchaseFees =
    brokerFee +
    input.registrationFee +
    input.acquisitionTax +
    input.otherFees +
    repairReserveFund +
    loanFeeAmount(input.loanAmount, input.loanFeeRate) +
    input.loanOtherFees;
  const downPayment = Math.max(0, input.price - input.loanAmount);
  const payment = monthlyLoanPayment(input.loanAmount, input.interestRate, input.loanYears);
  const totalMonths = Math.max(1, Math.round(input.loanYears * 12));
  const years = Math.max(1, Math.round(input.years));
  const creditCap = loanTaxCreditCap(input.propertyType, input.housingCategory);
  const creditPeriod = loanTaxCreditPeriod(input.propertyType);

  const rows: YearRow[] = [];
  let cumulativeLoanTaxCredit = 0;
  for (let y = 1; y <= years; y++) {
    const monthsPaid = Math.min(y * 12, totalMonths);
    const loanBalance = loanBalanceAfter(input.loanAmount, input.interestRate, input.loanYears, monthsPaid, payment);
    const propertyValue = input.price * Math.pow(1 + input.appreciationRate / 100, y);
    const paymentsMade = payment * monthsPaid;
    const runningCost = (input.propertyTaxYearly + maintenanceYearly + input.otherFeesYearly) * y;
    const loanTaxCredit = y <= creditPeriod ? Math.min(loanBalance, creditCap) * LOAN_TAX_CREDIT_RATE : 0;
    cumulativeLoanTaxCredit += loanTaxCredit;
    // Cash out net of the loan tax credit received back over the years so far
    const totalCashOut = downPayment + purchaseFees + paymentsMade + runningCost - cumulativeLoanTaxCredit;
    const equity = propertyValue - loanBalance;
    // Net position if sold at end of year y, after the selling broker fee
    const net = propertyValue - loanBalance - totalCashOut - input.sellFee;
    rows.push({ year: y, propertyValue, loanBalance, equity, totalCashOut, sellFee: input.sellFee, loanTaxCredit, net });
  }

  const final = rows[rows.length - 1];
  const monthsPaid = Math.min(years * 12, totalMonths);
  const principalRepaid = input.loanAmount - final.loanBalance;
  const interestPaid = payment * monthsPaid - principalRepaid;
  const runningCost = (input.propertyTaxYearly + maintenanceYearly + input.otherFeesYearly) * years;
  const totalLoanTaxCredit = rows.reduce((sum, r) => sum + r.loanTaxCredit, 0);

  return { monthlyPayment: payment, purchaseFees, rows, final, interestPaid, runningCost, totalLoanTaxCredit };
}
