import { useAuth } from "@/contexts/AuthContext";
import { useGetLoansSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Mail, Phone, Calendar, ShieldCheck, Wallet, ArrowUpRight } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetLoansSummary();

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-6 p-6 rounded-2xl bg-card border border-border shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
          <AvatarFallback className="text-3xl bg-primary/10 text-primary font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">Verified Account</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{user.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="font-medium text-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : summary ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-primary/5 text-primary">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5" />
                    <span className="font-medium">Total Debt</span>
                  </div>
                  <span className="font-bold text-lg">{formatCurrency(summary.totalDebt)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1">Active Accounts</p>
                    <p className="font-semibold text-foreground text-lg">{summary.activeLoans}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1">Settled Accounts</p>
                    <p className="font-semibold text-emerald-500 text-lg">{summary.settledLoans}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1">Avg. Interest Rate</p>
                    <p className="font-semibold text-foreground text-lg">{formatPercentage(summary.averageInterestRate)}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Payments</p>
                    <p className="font-semibold text-foreground text-lg">{formatCurrency(summary.totalMonthlyPayment)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                No portfolio data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
