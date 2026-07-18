import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { DollarSign, Percent, TrendingDown, Target, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))', 'hsl(var(--chart-3))'];

export default function Dashboard() {
  const { data, isLoading } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pieData = [
    { name: 'Active', value: data.loansByStatus.active },
    { name: 'Settled', value: data.loansByStatus.settled },
    { name: 'Defaulted', value: data.loansByStatus.defaulted },
    { name: 'Negotiating', value: data.loansByStatus.negotiating },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your financial overview and recovery progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debt</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(data.totalDebt)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {data.loanCount} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Debt Ratio</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPercentage(data.debtRatio || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly debt vs income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Financial Score</CardTitle>
            <TrendingDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.financialScore || 0}<span className="text-base font-normal text-muted-foreground">/100</span></div>
            <p className="text-xs text-muted-foreground mt-1">Vault proprietary metric</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Settlement Prob.</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPercentage(data.settlementProbability || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average likelihood</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Debt Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <PieChart className="h-8 w-8 opacity-20" />
                  No loan data available
                </div>
              )}
            </div>
            {pieData.length > 0 && (
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-medium text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debt Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data.monthlyTrend && data.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `$${val/1000}k`}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                    />
                    <RechartsTooltip 
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    />
                    <Area type="monotone" dataKey="totalDebt" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorDebt)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Insufficient data for trend analysis
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Loans</CardTitle>
            <Link href="/loans" className="text-sm text-primary hover:underline flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentLoans.length > 0 ? (
              <div className="space-y-4">
                {data.recentLoans.map(loan => (
                  <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                    <div>
                      <p className="font-medium text-foreground">{loan.lenderName}</p>
                      <p className="text-xs text-muted-foreground">{loan.loanType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(loan.remainingAmount)}</p>
                      <p className={`text-xs capitalize font-medium ${
                        loan.status === 'active' ? 'text-blue-500' :
                        loan.status === 'settled' ? 'text-emerald-500' :
                        loan.status === 'defaulted' ? 'text-rose-500' : 'text-amber-500'
                      }`}>
                        {loan.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                No active loans found. Add a loan to get started.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Analyses</CardTitle>
            <Link href="/analysis" className="text-sm text-primary hover:underline flex items-center">
              New analysis <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentAnalyses.length > 0 ? (
              <div className="space-y-4">
                {data.recentAnalyses.map(analysis => (
                  <div key={analysis.id} className="flex flex-col p-4 rounded-lg border border-border bg-muted/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">{new Date(analysis.createdAt).toLocaleDateString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        analysis.riskLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-500' :
                        analysis.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {analysis.riskLevel} Risk
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-lg font-bold text-foreground">{analysis.financialScore}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Disposable</p>
                        <p className="text-lg font-bold text-foreground">{formatCurrency(analysis.disposableIncome)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                No analyses run yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
