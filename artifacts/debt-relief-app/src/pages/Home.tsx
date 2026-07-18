import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shield, ArrowRight, LineChart, MessageSquare, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col selection:bg-primary/20">
      <header className="px-6 py-6 md:px-12 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-xl">V</span>
          </div>
          <span className="font-bold text-2xl tracking-tight text-foreground">Vault</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block">
            Sign In
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 px-6 md:px-12 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_40%)] opacity-[0.03] dark:opacity-10 pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="z-10 max-w-4xl mx-auto flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-8">
              <Shield className="h-4 w-4" />
              Private & Secure Financial Recovery
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]">
              Take control of your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">financial future.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mb-10">
              Vault is a premium debt resolution platform that provides precise analysis, AI-powered negotiation strategies, and a clear path to zero debt.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] h-14 px-8">
                Start Your Recovery <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-14 px-8">
                Client Login
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card/50 border-y border-border px-6 md:px-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Precision tools for debt resolution</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">We combine institutional-grade financial modeling with advanced AI to help you negotiate and settle debts effectively.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: LineChart,
                  title: "Financial Analysis",
                  description: "Comprehensive breakdown of your debt-to-income ratio, risk levels, and disposable income.",
                },
                {
                  icon: TrendingDown,
                  title: "Settlement Predictor",
                  description: "AI models estimate the probability of settlement success and recommend optimal target percentages.",
                },
                {
                  icon: MessageSquare,
                  title: "AI Letter Generator",
                  description: "Instantly draft professional, legally-sound settlement and hardship letters tailored to your lenders.",
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 md:px-12 border-t border-border bg-background text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Vault Financial Platform. All rights reserved.</p>
        <p className="mt-2 text-xs">For informational purposes only. Not financial or legal advice.</p>
      </footer>
    </div>
  );
}
