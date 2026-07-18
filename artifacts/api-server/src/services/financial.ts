export function calculateDebtToIncomeRatio(
  totalMonthlyDebt: number,
  monthlyIncome: number,
): number {
  if (monthlyIncome <= 0) return 100;
  return Math.round((totalMonthlyDebt / monthlyIncome) * 100 * 100) / 100;
}

export function calculateFinancialScore(params: {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  totalMonthlyDebt: number;
}): number {
  const { monthlyIncome, monthlyExpenses, monthlySavings, totalMonthlyDebt } = params;

  let score = 0;

  // Income stability score (30 pts) — normalized, capped at $10k/mo
  const incomeStability = Math.min(30, Math.round((monthlyIncome / 10000) * 30));
  score += incomeStability;

  // Debt ratio score (30 pts)
  const dti =
    monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) * 100 : 100;
  if (dti < 15) score += 30;
  else if (dti < 25) score += 24;
  else if (dti < 35) score += 18;
  else if (dti < 50) score += 10;
  else score += 0;

  // Savings ratio (20 pts)
  const savingsRatio = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  if (savingsRatio >= 20) score += 20;
  else if (savingsRatio >= 15) score += 17;
  else if (savingsRatio >= 10) score += 14;
  else if (savingsRatio >= 5) score += 10;
  else score += 4;

  // Disposable income ratio (20 pts)
  const disposable = monthlyIncome - monthlyExpenses - totalMonthlyDebt;
  const disposableRatio = monthlyIncome > 0 ? (disposable / monthlyIncome) * 100 : 0;
  if (disposableRatio >= 30) score += 20;
  else if (disposableRatio >= 20) score += 16;
  else if (disposableRatio >= 10) score += 12;
  else if (disposableRatio >= 0) score += 6;
  else score += 0;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getRiskLevel(score: number): string {
  if (score >= 80) return "Low";
  if (score >= 60) return "Medium";
  if (score >= 40) return "High";
  return "Critical";
}

export interface SettlementCalcResult {
  probability: number;
  recommendedPercentage: number;
  estimatedPayment: number;
  nextSteps: string[];
}

export function calculateSettlementProbability(params: {
  outstandingAmount: number;
  monthlyIncome: number;
  creditScore: number;
  monthsOverdue: number;
  disposableIncome?: number;
  loanType?: string;
}): SettlementCalcResult {
  const {
    outstandingAmount,
    monthlyIncome,
    creditScore,
    monthsOverdue,
    disposableIncome = 0,
  } = params;

  // Base probability from months overdue
  let probability: number;
  if (monthsOverdue >= 24) probability = 88;
  else if (monthsOverdue >= 18) probability = 82;
  else if (monthsOverdue >= 12) probability = 75;
  else if (monthsOverdue >= 9) probability = 65;
  else if (monthsOverdue >= 6) probability = 55;
  else if (monthsOverdue >= 3) probability = 40;
  else if (monthsOverdue >= 1) probability = 22;
  else probability = 8;

  // Adjust for credit score — lower score means higher likelihood of needing settlement
  if (creditScore < 500) probability += 12;
  else if (creditScore < 580) probability += 8;
  else if (creditScore < 620) probability += 4;
  else if (creditScore >= 700) probability -= 8;
  else if (creditScore >= 650) probability -= 4;

  // Adjust for debt-to-annual-income ratio
  const debtToAnnual = monthlyIncome > 0 ? outstandingAmount / (monthlyIncome * 12) : 5;
  if (debtToAnnual > 2) probability += 8;
  else if (debtToAnnual > 1) probability += 4;

  // Adjust for disposable income
  if (disposableIncome < 0) probability += 6;
  else if (disposableIncome < monthlyIncome * 0.1) probability += 3;

  probability = Math.min(95, Math.max(5, Math.round(probability)));

  // Recommended settlement percentage
  let recommendedPercentage: number;
  if (monthsOverdue >= 18) recommendedPercentage = 30;
  else if (monthsOverdue >= 12) recommendedPercentage = 38;
  else if (monthsOverdue >= 6) recommendedPercentage = 48;
  else if (monthsOverdue >= 3) recommendedPercentage = 58;
  else recommendedPercentage = 70;

  if (creditScore < 500) recommendedPercentage -= 8;
  else if (creditScore < 580) recommendedPercentage -= 4;

  recommendedPercentage = Math.min(80, Math.max(20, Math.round(recommendedPercentage)));

  const estimatedPayment = Math.round((outstandingAmount * recommendedPercentage) / 100);

  const nextSteps: string[] = [
    "Contact your lender's hardship or collections department directly",
    "Request all settlement discussions in writing — never rely on verbal agreements",
    "Prepare a hardship letter documenting your financial situation",
    `Open with an offer of ${Math.max(20, recommendedPercentage - 10)}% and negotiate toward ${recommendedPercentage}%`,
    "Get any accepted offer in writing before making payment",
    "Consider consulting a nonprofit credit counseling agency (free services available)",
    "Review the tax implications — forgiven debt over $600 may be reported as income",
  ];

  return {
    probability,
    recommendedPercentage,
    estimatedPayment,
    nextSteps,
  };
}

export function generateFallbackRecommendations(params: {
  financialScore: number;
  debtRatio: number;
  riskLevel: string;
  disposableIncome: number;
  monthlyIncome: number;
  totalMonthlyDebt: number;
}): string[] {
  const { financialScore, debtRatio, riskLevel, disposableIncome, monthlyIncome, totalMonthlyDebt } =
    params;
  const recs: string[] = [];

  if (debtRatio > 50) {
    recs.push(
      `Your debt-to-income ratio is ${debtRatio}% — critically above the 50% danger threshold. Immediately stop all non-essential spending and redirect every available dollar to your highest-interest debt.`,
    );
    recs.push(
      "Explore debt consolidation loans or a debt management plan through a nonprofit credit counseling agency to reduce your effective interest rate.",
    );
  } else if (debtRatio > 35) {
    recs.push(
      `Your debt-to-income ratio of ${debtRatio}% is above the recommended 35%. Focus on the avalanche method: pay minimums on all debts, then throw extra payments at the highest-interest account.`,
    );
    recs.push(
      "Review subscriptions and recurring expenses — cutting $200/month adds $2,400/year to debt payoff.",
    );
  } else if (debtRatio > 20) {
    recs.push(
      `Your debt-to-income ratio of ${debtRatio}% is manageable. Continue paying more than the minimum on all accounts to build momentum.`,
    );
  } else {
    recs.push(
      `Excellent! Your debt-to-income ratio of ${debtRatio}% is well below the 20% benchmark. Maintain this discipline.`,
    );
  }

  if (riskLevel === "Critical") {
    recs.push(
      "Seek a certified nonprofit credit counselor (NFCC member) immediately — most offer free initial consultations.",
    );
    recs.push(
      "Contact each lender's hardship department before missing the next payment — proactive communication often unlocks reduced payment programs.",
    );
    recs.push(
      "Consider a temporary side income stream (gig work, selling unused items) to bridge the gap while negotiating with creditors.",
    );
  } else if (riskLevel === "High") {
    recs.push(
      "Build a $1,000 starter emergency fund before aggressively paying debt — this prevents new debt when unexpected expenses arise.",
    );
    recs.push(
      "Contact lenders to request interest rate reductions — a simple call succeeds roughly 70% of the time for long-standing customers.",
    );
  } else if (riskLevel === "Medium") {
    recs.push(
      "Increase your savings rate by 3–5% by automating transfers on payday before you can spend the money.",
    );
    recs.push(
      "Consider refinancing high-interest debt if your credit score qualifies — even a 2% reduction in rate can save thousands.",
    );
  } else {
    recs.push(
      "You're in a strong position. Redirect surplus income to a diversified investment portfolio — index funds or retirement accounts — to build long-term wealth.",
    );
    recs.push(
      "Maintain a 6-month emergency fund (not tied to investments) to protect your financial stability from future shocks.",
    );
  }

  if (disposableIncome < 0) {
    recs.push(
      `Warning: Your monthly expenses exceed your income by $${Math.abs(disposableIncome).toLocaleString()}. This deficit is unsustainable — immediate action is required to cut costs or increase income.`,
    );
  } else if (disposableIncome < monthlyIncome * 0.05) {
    recs.push(
      "Your disposable income margin is critically thin. Any unexpected expense could force you into high-interest debt. Prioritize creating even a small buffer.",
    );
  }

  recs.push(
    `Your financial health score is ${financialScore}/100 (${riskLevel} Risk). ${riskLevel === "Low" ? "Excellent work — you are ahead of most people your age." : "Each positive step — paying on time, reducing debt, increasing savings — improves this score and your overall financial trajectory."}`,
  );

  return recs;
}
