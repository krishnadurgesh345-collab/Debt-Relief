import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export function AuthGuard({ children, requireAuth = true }: { children: React.ReactNode, requireAuth?: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return requireAuth ? <AppLayout>{children}</AppLayout> : <>{children}</>;
}
