import { useState } from "react";
import { useCreateAnalysis, useGetAnalyses, useGetLoans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { ShieldAlert, TrendingDown, CheckCircle2, ChevronRight, Activity, Wallet } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const analysisSchema = z.object({
  monthlyIncome: z.coerce.number().min(1, "Income is required"),
  monthlyExpenses: z.coerce.number().min(0, "Expenses cannot be negative"),
  monthlySavings: z.coerce.number().min(0, "Savings cannot be negative"),
  loanIds: z.array(z.number()).optional(),
});

export default function Analysis() {
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);
  const { data: history, isLoading: historyLoading } = useGetAnalyses();
  const { data: loansData, isLoading: loansLoading } = useGetLoans({ limit: 100 });
  const createAnalysis = useCreateAnalysis();

  const form = useForm<z.infer<typeof analysisSchema>>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      loanIds: [],
    },
  });

  const onSubmit = (values: z.infer<typeof analysisSchema>) => {
    createAnalysis.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setActiveAnalysis(data);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-emerald-500';
      case 'Medium': return 'text-amber-500';
      case 'High': return 'text-orange-500';
      case 'Critical': return 'text-rose-500';
      default: return 'text-primary';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Financial Analysis</h1>
        <p className="text-muted-foreground mt-1">AI-powered assessment of your financial health.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Run New Analysis</CardTitle>
              <CardDescription>Enter your current financials to get updated insights.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="monthlyIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Income (Net) $</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monthlyExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Expenses (Excluding debt) $</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="3000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monthlySavings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Savings Contribution $</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {!loansLoading && loansData?.loans && loansData.loans.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <FormLabel className="mb-3 block">Include Loans in Analysis</FormLabel>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        <FormField
                          control={form.control}
                          name="loanIds"
                          render={() => (
                            <FormItem>
                              {loansData.loans.map((loan) => (
                                <FormField
                                  key={loan.id}
                                  control={form.control}
                                  name="loanIds"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={loan.id}
                                        className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(loan.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), loan.id])
                                                : field.onChange(
                                                    field.value?.filter((value) => value !== loan.id)
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none w-full">
                                          <FormLabel className="flex justify-between w-full cursor-pointer">
                                            <span>{loan.lenderName}</span>
                                            <span className="text-muted-foreground">{formatCurrency(loan.remainingAmount)}</span>
                                          </FormLabel>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12 text-base" disabled={createAnalysis.isPending}>
                    {createAnalysis.isPending ? "Analyzing..." : "Generate Analysis"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {activeAnalysis ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <Card className="overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/5">
                  <div className="h-2 bg-gradient-to-r from-primary to-accent w-full" />
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">Analysis Results</CardTitle>
                        <CardDescription>Generated {new Date(activeAnalysis.createdAt).toLocaleString()}</CardDescription>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                        activeAnalysis.riskLevel === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        activeAnalysis.riskLevel === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}>
                        {activeAnalysis.riskLevel} Risk
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-muted-foreground mb-1">Financial Score</span>
                        <span className="text-3xl font-bold text-foreground">{activeAnalysis.financialScore}</span>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-muted-foreground mb-1">Debt Ratio</span>
                        <span className="text-2xl font-bold text-foreground">{formatPercentage(activeAnalysis.debtRatio)}</span>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-muted-foreground mb-1">Disposable</span>
                        <span className="text-xl font-bold text-foreground">{formatCurrency(activeAnalysis.disposableIncome)}</span>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-muted-foreground mb-1">Total Debt</span>
                        <span className="text-xl font-bold text-foreground">{formatCurrency(activeAnalysis.totalMonthlyDebt)}/mo</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-primary" /> 
                        AI Recommendations
                      </h3>
                      <div className="space-y-3">
                        {activeAnalysis.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed text-foreground">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-2xl bg-card/50"
              >
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Activity className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Awaiting Data</h2>
                <p className="text-muted-foreground max-w-md">
                  Fill out the form to run a comprehensive financial analysis. The AI will assess your debt-to-income ratio, risk levels, and provide actionable recommendations.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {history && history.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Past Analyses</h3>
              <div className="space-y-3">
                {history.slice(0, 5).map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setActiveAnalysis(item);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${
                        item.riskLevel === 'Low' ? 'bg-emerald-500' :
                        item.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <div>
                        <p className="font-medium text-foreground">{new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium'})}</p>
                        <p className="text-sm text-muted-foreground">Score: {item.financialScore} • Ratio: {formatPercentage(item.debtRatio)}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
