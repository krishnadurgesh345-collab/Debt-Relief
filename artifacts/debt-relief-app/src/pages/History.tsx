import { useState } from "react";
import { useGetHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History as HistoryIcon, Target, PieChart, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function History() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: history, isLoading } = useGetHistory({ limit: 50 });

  const getIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <PieChart className="h-5 w-5 text-blue-500" />;
      case 'settlement': return <Target className="h-5 w-5 text-emerald-500" />;
      case 'letter': return <FileText className="h-5 w-5 text-amber-500" />;
      default: return <HistoryIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'analysis': return 'Financial Analysis';
      case 'settlement': return 'Settlement Prediction';
      case 'letter': return 'Letter Generation';
      default: return 'Interaction';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI History</h1>
        <p className="text-muted-foreground mt-1">Review your past interactions, predictions, and generated documents.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {!history || history.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <HistoryIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">No history yet</p>
              <p className="text-sm">Your AI interactions will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((item) => (
                <div key={item.id} className="flex flex-col">
                  <button 
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-start gap-4"
                  >
                    <div className="mt-1 shrink-0 p-2 rounded-lg bg-background border border-border">
                      {getIcon(item.historyType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-foreground">{getTypeLabel(item.historyType)}</span>
                        <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{item.prompt}</p>
                    </div>
                    <div className="shrink-0 mt-2">
                      {expandedId === item.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 pl-[4.25rem]">
                          <div className="bg-muted/50 p-4 rounded-lg border border-border">
                            <p className="text-sm font-medium mb-2 text-foreground">AI Response:</p>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono">
                              {item.response}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
