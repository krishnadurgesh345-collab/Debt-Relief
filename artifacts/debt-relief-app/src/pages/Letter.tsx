import { useState } from "react";
import { useGenerateLetter } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FileText, Copy, Download, RefreshCw, PenTool } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

const letterSchema = z.object({
  lenderName: z.string().min(1, "Lender name is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
  reason: z.string().min(10, "Please provide more detail about the reason"),
  letterType: z.enum(["settlement_request", "hardship_letter", "restructuring_request"]),
  additionalInfo: z.string().optional(),
});

export default function Letter() {
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const generateLetter = useGenerateLetter();

  const form = useForm<z.infer<typeof letterSchema>>({
    resolver: zodResolver(letterSchema),
    defaultValues: {
      lenderName: "",
      amount: 0,
      reason: "",
      letterType: "settlement_request",
      additionalInfo: "",
    },
  });

  const onSubmit = (values: z.infer<typeof letterSchema>) => {
    generateLetter.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setGeneratedLetter(data.letter);
          setIsEditing(false);
          toast.success("Letter generated successfully");
        }
      }
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = pageWidth - margin * 2;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(generatedLetter, textWidth);
    doc.text(splitText, margin, margin);
    
    const filename = `${form.getValues("lenderName").replace(/\s+/g, '_')}_${form.getValues("letterType")}.pdf`;
    doc.save(filename);
    toast.success("PDF downloaded");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Letter Generator</h1>
        <p className="text-muted-foreground mt-1">Draft professional negotiation and hardship letters instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-5 h-fit">
          <CardHeader>
            <CardTitle>Letter Details</CardTitle>
            <CardDescription>Provide context for the AI to draft a tailored letter.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="letterType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Letter</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="settlement_request">Settlement Request</SelectItem>
                          <SelectItem value="hardship_letter">Hardship Letter</SelectItem>
                          <SelectItem value="restructuring_request">Restructuring Request</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lenderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lender Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Chase Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Request</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Job loss, medical emergency, reduced income..." 
                          className="resize-none h-24" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific terms, account numbers, or details to include..." 
                          className="resize-none h-20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-12 mt-2" disabled={generateLetter.isPending}>
                  {generateLetter.isPending ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><PenTool className="mr-2 h-4 w-4" /> Draft Letter</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {generatedLetter ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="h-full flex flex-col"
              >
                <Card className="flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="border-b border-border bg-muted/20 pb-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Generated Letter</CardTitle>
                      <CardDescription>Review and edit before sending.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={handleCopy} title="Copy to clipboard">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleDownload} title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 relative">
                    <Textarea 
                      value={generatedLetter}
                      onChange={(e) => setGeneratedLetter(e.target.value)}
                      className="min-h-[500px] h-full w-full border-0 focus-visible:ring-0 rounded-none p-8 font-serif leading-relaxed text-[15px] resize-none bg-card"
                      placeholder="Letter content..."
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="h-full min-h-[500px] border-dashed bg-card/50 flex flex-col items-center justify-center text-center p-12">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Ready to Draft</h3>
                <p className="text-muted-foreground max-w-sm">
                  Fill out the details on the left. Vault's AI will generate a professional, legally-sound letter formatted for the highest chance of success.
                </p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
