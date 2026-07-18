import { useState } from "react";
import { usePredictSettlement } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Target, Sparkles, AlertCircle, ArrowRightCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const settlementSchema = z.object({
  outstandingAmount: z.coerce.number().min(1, "Amount is required"),
  monthlyIncome: z.coerce.number().min(0, "Income cannot be negative"),
  creditScore: z.coerce.number().min(300).max(850),
  monthsOverdue: z.coerce.number().min(0),
  disposableIncome: z.coerce.number().optional(),
  loanType: z.string().optional(),
});

export default function Settlement() {
  const [result, setResult] = useState<any>(null);
  const predictSettlement = usePredictSettlement();

  const form = useForm<z.infer<typeof settlementSchema>>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      outstandingAmount: 0,
      monthlyIncome: 0,
      creditScore: 650,
      monthsOverdue: 0,
      disposableIncome: 0,
      loanType: "credit_card",
    },
  });

  const onSubmit = (values: z.infer<typeof settlementSchema>) => {
    predictSettlement.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setResult(data);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settlement Predictor</h1>
        <p className="text-muted-foreground mt-1">Predict the likelihood of settlement and get target amounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <CardTitle>Debt Details</CardTitle>
            <CardDescription>Enter details about the specific debt you want to settle.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="outstandingAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outstanding Amount $</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="15000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="loanType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Debt Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="personal_loan">Personal Loan</SelectItem>
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income $</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="disposableIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disposable Income (Optional) $</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="monthsOverdue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Months Overdue: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={60}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creditScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Score: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={300}
                          max={850}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>300 (Poor)</span>
                        <span>850 (Excellent)</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-12 text-base mt-4" disabled={predictSettlement.isPending}>
                  {predictSettlement.isPending ? "Calculating..." : "Predict Settlement"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="order-1 lg:order-2">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col"
              >
                <Card className="flex-1 border-primary/20 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  
                  <CardHeader className="text-center pb-2 relative z-10">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Settlement Projection</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-8 relative z-10">
                    <div className="flex justify-center my-6">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-48 h-48 transform -rotate-90">
                          <circle cx="96" cy="96" r="88" className="stroke-muted" strokeWidth="12" fill="none" />
                          <motion.circle 
                            initial={{ strokeDasharray: "0 553" }}
                            animate={{ strokeDasharray: `${(result.probability / 100) * 553} 553` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="96" cy="96" r="88" 
                            className="stroke-primary" 
                            strokeWidth="12" 
                            fill="none" 
                            strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-5xl font-bold text-foreground">{formatPercentage(result.probability)}</span>
                          <span className="text-sm font-medium text-muted-foreground mt-1">Probability</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card border border-border p-4 rounded-xl text-center">
                        <span className="text-sm text-muted-foreground block mb-1">Target Rate</span>
                        <span className="text-2xl font-bold text-emerald-500">{formatPercentage(result.recommendedPercentage)}</span>
                      </div>
                      <div className="bg-card border border-border p-4 rounded-xl text-center">
                        <span className="text-sm text-muted-foreground block mb-1">Est. Payment</span>
                        <span className="text-2xl font-bold text-foreground">{formatCurrency(result.estimatedPayment)}</span>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 p-5 rounded-xl">
                      <h4 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                        <Sparkles className="h-4 w-4" /> AI Reasoning
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground">{result.reasoning}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Recommended Next Steps</h4>
                      <div className="space-y-3">
                        {result.nextSteps.map((step: string, idx: number) => (
                          <div key={idx} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-foreground font-medium text-xs">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="h-full border-dashed bg-card/50 flex flex-col items-center justify-center text-center p-12 min-h-[500px]">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No Prediction Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Enter the details of the debt you wish to settle. Our AI models will calculate the probability of success and suggest an optimal settlement target.
                </p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
