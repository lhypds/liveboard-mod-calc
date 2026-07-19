export type RealEstateInputs = {
  price: number;
  loanAmount: number;
  interestRate: number;
  loanYears: number;
  brokerFee: number;
  registrationFee: number;
  acquisitionTax: number;
  otherFees: number;
  propertyTaxYearly: number;
  maintenanceYearly: number;
  appreciationRate: number;
  years: number;
};

export type YearRow = {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  totalCashOut: number;
  net: number;
};

export type RealEstateResult = {
  monthlyPayment: number;
  purchaseFees: number;
  rows: YearRow[];
  final: YearRow;
  interestPaid: number;
  runningCost: number;
};

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
  const purchaseFees = input.brokerFee + input.registrationFee + input.acquisitionTax + input.otherFees;
  const downPayment = Math.max(0, input.price - input.loanAmount);
  const payment = monthlyLoanPayment(input.loanAmount, input.interestRate, input.loanYears);
  const totalMonths = Math.max(1, Math.round(input.loanYears * 12));
  const years = Math.max(1, Math.round(input.years));

  const rows: YearRow[] = [];
  for (let y = 1; y <= years; y++) {
    const monthsPaid = Math.min(y * 12, totalMonths);
    const loanBalance = loanBalanceAfter(input.loanAmount, input.interestRate, input.loanYears, monthsPaid, payment);
    const propertyValue = input.price * Math.pow(1 + input.appreciationRate / 100, y);
    const paymentsMade = payment * monthsPaid;
    const runningCost = (input.propertyTaxYearly + input.maintenanceYearly) * y;
    const totalCashOut = downPayment + purchaseFees + paymentsMade + runningCost;
    const equity = propertyValue - loanBalance;
    // Net position if sold at end of year y (sale costs not included)
    const net = propertyValue - loanBalance - totalCashOut;
    rows.push({ year: y, propertyValue, loanBalance, equity, totalCashOut, net });
  }

  const final = rows[rows.length - 1];
  const monthsPaid = Math.min(years * 12, totalMonths);
  const principalRepaid = input.loanAmount - final.loanBalance;
  const interestPaid = payment * monthsPaid - principalRepaid;
  const runningCost = (input.propertyTaxYearly + input.maintenanceYearly) * years;

  return { monthlyPayment: payment, purchaseFees, rows, final, interestPaid, runningCost };
}
