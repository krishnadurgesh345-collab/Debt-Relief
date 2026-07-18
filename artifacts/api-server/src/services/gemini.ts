import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../lib/logger";
import { generateFallbackRecommendations } from "./financial";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!genAI && process.env["GEMINI_API_KEY"]) {
    genAI = new GoogleGenerativeAI(process.env["GEMINI_API_KEY"]);
  }
  return genAI;
}

export function isGeminiAvailable(): boolean {
  return !!process.env["GEMINI_API_KEY"];
}

async function safeGenerate(prompt: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Gemini API call failed");
    return null;
  }
}

export async function generateFinancialRecommendations(params: {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  debtRatio: number;
  financialScore: number;
  riskLevel: string;
  disposableIncome: number;
  totalMonthlyDebt: number;
}): Promise<string[]> {
  const prompt = `You are a certified financial advisor specializing in debt relief and financial recovery.
Analyze this financial situation and provide 6 specific, actionable recommendations.

Financial Profile:
- Monthly Income: $${params.monthlyIncome.toLocaleString()}
- Monthly Expenses: $${params.monthlyExpenses.toLocaleString()}
- Monthly Savings: $${params.monthlySavings.toLocaleString()}
- Monthly Debt Payments: $${params.totalMonthlyDebt.toLocaleString()}
- Disposable Income: $${params.disposableIncome.toLocaleString()}
- Debt-to-Income Ratio: ${params.debtRatio}%
- Financial Health Score: ${params.financialScore}/100
- Risk Level: ${params.riskLevel}

Respond ONLY with valid JSON in this exact format:
{"recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5", "recommendation 6"]}

Each recommendation must be specific, actionable, and relevant to the financial data provided. Be direct and concrete — no vague advice.`;

  const text = await safeGenerate(prompt);

  if (text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { recommendations?: unknown };
        if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
          return parsed.recommendations as string[];
        }
      }
    } catch {
      // fall through to fallback
    }
  }

  return generateFallbackRecommendations({
    financialScore: params.financialScore,
    debtRatio: params.debtRatio,
    riskLevel: params.riskLevel,
    disposableIncome: params.disposableIncome,
    monthlyIncome: params.monthlyIncome,
    totalMonthlyDebt: params.totalMonthlyDebt,
  });
}

export async function generateSettlementReasoning(params: {
  outstandingAmount: number;
  monthlyIncome: number;
  creditScore: number;
  monthsOverdue: number;
  probability: number;
  recommendedPercentage: number;
  estimatedPayment: number;
  loanType?: string;
}): Promise<string> {
  const fallback = `Based on ${params.monthsOverdue} months overdue with a credit score of ${params.creditScore} and an outstanding balance of $${params.outstandingAmount.toLocaleString()}, there is a ${params.probability}% likelihood that the lender will accept a settlement. Lenders typically prefer recovering a portion of the debt over the cost and uncertainty of prolonged collections. The recommended settlement of ${params.recommendedPercentage}% ($${params.estimatedPayment.toLocaleString()}) reflects standard industry norms for accounts with this delinquency profile and credit score range.`;

  const prompt = `You are a debt settlement specialist with 20 years of experience.
Write a clear, professional 2-paragraph explanation of this settlement prediction for a client.

Settlement Details:
- Outstanding Amount: $${params.outstandingAmount.toLocaleString()}
- Monthly Income: $${params.monthlyIncome.toLocaleString()}
- Credit Score: ${params.creditScore}
- Months Overdue: ${params.monthsOverdue}
${params.loanType ? `- Loan Type: ${params.loanType}` : ""}
- Settlement Probability: ${params.probability}%
- Recommended Settlement: ${params.recommendedPercentage}% ($${params.estimatedPayment.toLocaleString()})

Paragraph 1: Explain WHY this probability makes sense — what specific factors (credit score, delinquency duration, income) drive it.
Paragraph 2: Explain WHY this settlement percentage is recommended and what the client should realistically expect in negotiations.

Be professional, empathetic, and specific. Do not use bullet points. Plain paragraphs only.`;

  const text = await safeGenerate(prompt);
  return text?.trim() || fallback;
}

export async function generateProfessionalLetter(params: {
  lenderName: string;
  amount: number;
  reason: string;
  letterType: "settlement_request" | "hardship_letter" | "restructuring_request";
  additionalInfo?: string;
  userName?: string;
}): Promise<string> {
  const { lenderName, amount, reason, letterType, additionalInfo, userName } = params;
  const name = userName || "[Your Name]";

  const letterTypeDescriptions: Record<string, string> = {
    settlement_request: "debt settlement request letter",
    hardship_letter: "financial hardship letter",
    restructuring_request: "loan restructuring request letter",
  };

  const specificInstructions: Record<string, string> = {
    settlement_request: `- Propose a settlement of approximately ${Math.round((amount * 0.45) / 100) * 100} (45% of the outstanding balance)
- State clearly that this is a lump-sum offer contingent on written confirmation
- Request the debt be marked as "settled in full" and reported accurately to credit bureaus
- Give a 30-day response deadline`,
    hardship_letter: `- Describe the hardship clearly and factually
- Request specific relief: temporary payment reduction, deferral, or modified payment plan
- Express genuine commitment to resolving the debt when circumstances improve
- Request written confirmation of any agreed terms`,
    restructuring_request: `- Request specific restructuring terms: extended loan term, reduced interest rate, or lower monthly payments
- Propose a specific new monthly payment amount that is realistic given current income
- Demonstrate that the restructured payment is sustainable
- Ask for a response within 30 days`,
  };

  const prompt = `Write a professional ${letterTypeDescriptions[letterType]} to "${lenderName}".

Client Details:
- Name: ${name}
- Debt/Loan Amount: $${amount.toLocaleString()}
- Reason for Request: ${reason}
${additionalInfo ? `- Additional Context: ${additionalInfo}` : ""}

Requirements for this letter:
${specificInstructions[letterType]}
- Use professional formal business letter format
- Include [Date] as the date placeholder
- Include [Your Address], [City, State ZIP] as address placeholders
- Include [Account Number] where relevant
- Be respectful, factual, and solution-focused
- Length: 3-4 paragraphs (not counting header/footer)

Write ONLY the letter content. Do not add any preamble or explanation outside the letter.`;

  const text = await safeGenerate(prompt);
  return text?.trim() || generateFallbackLetter(params);
}

function generateFallbackLetter(params: {
  lenderName: string;
  amount: number;
  reason: string;
  letterType: "settlement_request" | "hardship_letter" | "restructuring_request";
  additionalInfo?: string;
  userName?: string;
}): string {
  const { lenderName, amount, reason, letterType, userName } = params;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const name = userName || "[Your Name]";
  const settledAmount = Math.round((amount * 0.45) / 100) * 100;

  if (letterType === "settlement_request") {
    return `[Date]

${lenderName}
Debt Resolution Department
[Lender Address]

Re: Debt Settlement Proposal — Account Number: [Account Number]

Dear ${lenderName} Resolution Team,

I am writing to formally propose a one-time settlement of my outstanding balance of $${amount.toLocaleString()} (Account No. [Account Number]). Due to ${reason}, I am unable to fulfill my original payment obligations in their entirety, and I am seeking a mutually beneficial resolution.

After careful assessment of my current financial situation, I am able to offer a lump-sum settlement payment of $${settledAmount.toLocaleString()} — representing 45% of the total outstanding balance — in full and final satisfaction of this account. This represents the maximum I am financially capable of providing at this time.

I respectfully request your written confirmation of acceptance of this offer, along with confirmation that upon receipt of payment, the account will be reported to all three major credit bureaus as "settled in full." I am prepared to remit payment within 14 business days of receiving written acceptance.

Please respond to this proposal within 30 days. I genuinely wish to resolve this matter and appreciate your consideration.

Sincerely,

${name}
[Your Address]
[City, State ZIP]
[Phone Number]
[Email Address]`;
  }

  if (letterType === "hardship_letter") {
    return `[Date]

${lenderName}
Customer Hardship Assistance Department
[Lender Address]

Re: Financial Hardship Assistance Request — Account Number: [Account Number]

Dear ${lenderName} Hardship Assistance Team,

I am writing to formally request financial hardship assistance regarding my account (Account No. [Account Number]) with an outstanding balance of $${amount.toLocaleString()}. I have historically been a responsible customer; however, ${reason} has created a significant and unexpected financial burden that has compromised my ability to maintain my regular payment schedule.

I am requesting the following temporary assistance to allow me time to stabilize my situation: (1) a temporary reduction or suspension of monthly payments for a period of [X] months, (2) waiver of any late fees and penalties that have accrued during this hardship period, and (3) a modified payment plan based on my current verified income upon resumption of payments.

I remain fully committed to honoring my financial obligations and intend to resume regular payments as soon as my circumstances allow. I am willing to provide supporting documentation — including bank statements, income verification, and hardship documentation — upon your request.

I would appreciate the opportunity to discuss available hardship options at your earliest convenience. Please contact me at [Phone Number] or [Email Address].

Sincerely,

${name}
[Your Address]
[City, State ZIP]
[Phone Number]
[Email Address]`;
  }

  return `[Date]

${lenderName}
Loan Modification Department
[Lender Address]

Re: Loan Restructuring Request — Account Number: [Account Number]

Dear ${lenderName} Loan Modification Team,

I am writing to respectfully request a restructuring of my existing loan obligation of $${amount.toLocaleString()} (Account No. [Account Number]). Due to ${reason}, maintaining my current payment schedule has become financially untenable, and I am proactively seeking a modified arrangement that allows me to meet my obligations.

I am requesting the following restructuring: an extension of the remaining loan term by [X] months to reduce my monthly obligation to approximately $[Proposed Monthly Payment], and if possible, a reduction in the applicable interest rate to [X]%. I have reviewed my current budget carefully and am confident I can sustain the proposed restructured payment on a consistent basis.

I want to emphasize that I have every intention of repaying this debt in full. Restructuring would allow me to do so reliably rather than risk default, which serves neither party's interests. I am prepared to provide income documentation, a current budget statement, and any other information required to process this request.

Please respond within 30 days so we can formalize the restructured terms. I am available at [Phone Number] or [Email Address] to discuss further.

Sincerely,

${name}
[Your Address]
[City, State ZIP]
[Phone Number]
[Email Address]`;
}
