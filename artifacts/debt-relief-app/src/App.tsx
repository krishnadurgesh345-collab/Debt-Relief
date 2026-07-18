import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/layout/AuthGuard';

import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Loans from '@/pages/Loans';
import Analysis from '@/pages/Analysis';
import Settlement from '@/pages/Settlement';
import Letter from '@/pages/Letter';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AuthGuard requireAuth={false}><Home /></AuthGuard>
      </Route>
      <Route path="/login">
        <AuthGuard requireAuth={false}><Login /></AuthGuard>
      </Route>
      <Route path="/register">
        <AuthGuard requireAuth={false}><Register /></AuthGuard>
      </Route>

      <Route path="/dashboard">
        <AuthGuard><Dashboard /></AuthGuard>
      </Route>
      <Route path="/loans">
        <AuthGuard><Loans /></AuthGuard>
      </Route>
      <Route path="/analysis">
        <AuthGuard><Analysis /></AuthGuard>
      </Route>
      <Route path="/settlement">
        <AuthGuard><Settlement /></AuthGuard>
      </Route>
      <Route path="/letter">
        <AuthGuard><Letter /></AuthGuard>
      </Route>
      <Route path="/history">
        <AuthGuard><History /></AuthGuard>
      </Route>
      <Route path="/profile">
        <AuthGuard><Profile /></AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard><Settings /></AuthGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
