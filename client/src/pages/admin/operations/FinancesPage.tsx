import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, TrendingUp, DollarSign, TrendingDown, Calculator, Pencil } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertMonthlyFinancialSchema, type MonthlyFinancial, type InsertMonthlyFinancial } from "@shared/schema";
import { z } from "zod";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 7 }, (_, i) => currentYear - 4 + i);

const formSchema = insertMonthlyFinancialSchema.extend({
  year: z.number().min(2020).max(2100),
  month: z.number().min(1).max(12),
});

type FormData = z.infer<typeof formSchema>;

export default function FinancesPage() {
  const { toast } = useToast();
  const [editingFinancial, setEditingFinancial] = useState<MonthlyFinancial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data: financials, isLoading } = useQuery<MonthlyFinancial[]>({
    queryKey: ["/api/monthly-financials", selectedYear],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: currentYear,
      month: new Date().getMonth() + 1,
      adIncome: 0,
      sponsorIncome: 0,
      otherIncome: 0,
      payrollExpenses: 0,
      billsExpenses: 0,
      softwareExpenses: 0,
      otherExpenses: 0,
      episodesReleased: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertMonthlyFinancial) => {
      return apiRequest("/api/monthly-financials", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-financials"] });
      toast({ title: "Financial data saved successfully" });
      setIsDialogOpen(false);
      setEditingFinancial(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (data: FormData) => {
    const totalIncome = Number(data.adIncome || 0) + Number(data.sponsorIncome || 0) + Number(data.otherIncome || 0);
    const totalExpenses = Number(data.payrollExpenses || 0) + Number(data.billsExpenses || 0) + 
                         Number(data.softwareExpenses || 0) + Number(data.otherExpenses || 0);
    const netProfit = totalIncome - totalExpenses;
    
    saveMutation.mutate({
      ...data,
      totalIncome,
      totalExpenses,
      netProfit,
    });
  };

  const handleEdit = (financial: MonthlyFinancial) => {
    setEditingFinancial(financial);
    form.reset({
      year: financial.year,
      month: financial.month,
      adIncome: Number(financial.adIncome || 0),
      sponsorIncome: Number(financial.sponsorIncome || 0),
      otherIncome: Number(financial.otherIncome || 0),
      payrollExpenses: Number(financial.payrollExpenses || 0),
      billsExpenses: Number(financial.billsExpenses || 0),
      softwareExpenses: Number(financial.softwareExpenses || 0),
      otherExpenses: Number(financial.otherExpenses || 0),
      episodesReleased: Number(financial.episodesReleased || 0),
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingFinancial(null);
    form.reset({
      year: currentYear,
      month: new Date().getMonth() + 1,
      adIncome: 0,
      sponsorIncome: 0,
      otherIncome: 0,
      payrollExpenses: 0,
      billsExpenses: 0,
      softwareExpenses: 0,
      otherExpenses: 0,
      episodesReleased: 0,
    });
    setIsDialogOpen(true);
  };

  const yearlyTotals = {
    income: financials?.reduce((sum, f) => sum + Number(f.totalIncome || 0), 0) || 0,
    expenses: financials?.reduce((sum, f) => sum + Number(f.totalExpenses || 0), 0) || 0,
    profit: financials?.reduce((sum, f) => sum + Number(f.netProfit || 0), 0) || 0,
    adIncome: financials?.reduce((sum, f) => sum + Number(f.adIncome || 0), 0) || 0,
  };

  const sortedFinancials = [...(financials || [])].sort((a, b) => a.month - b.month);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-finances-title">
              <TrendingUp className="h-6 w-6" />
              Financial Reports
            </h1>
            <p className="text-muted-foreground">Track monthly revenue, expenses, and profit/loss</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} data-testid="button-add-financial">
                <Plus className="h-4 w-4 mr-2" />
                Add Monthly Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFinancial ? "Edit Monthly Data" : "Add Monthly Financial Data"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                            <FormControl>
                              <SelectTrigger data-testid="select-financial-year">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map(year => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                            <FormControl>
                              <SelectTrigger data-testid="select-financial-month">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>{month}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Income
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="adIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Income ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                data-testid="input-ad-income"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sponsorIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sponsor Income ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                data-testid="input-sponsor-income"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="otherIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Other Income ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                data-testid="input-other-income"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-red-600 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Expenses
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="payrollExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payroll ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                data-testid="input-payroll-expenses"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="billsExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bills & Rent ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                data-testid="input-bills-expenses"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="softwareExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Software ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                data-testid="input-software-expenses"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="otherExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Other Expenses ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                data-testid="input-other-expenses"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="episodesReleased"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Episodes Released This Month</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                            data-testid="input-episodes-released"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={saveMutation.isPending} data-testid="button-submit-financial">
                    Save Financial Data
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <Label>Year:</Label>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32" data-testid="select-year-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-income">
                ${yearlyTotals.income.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-total-expenses">
                ${yearlyTotals.expenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-500" />
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${yearlyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-profit">
                ${yearlyTotals.profit.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-500" />
                Ad Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="text-ad-income">
                ${yearlyTotals.adIncome.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedFinancials.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No financial data for {selectedYear}. Add monthly data to start tracking.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-center">Episodes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFinancials.map((financial) => (
                    <TableRow key={financial.id} data-testid={`row-financial-${financial.id}`}>
                      <TableCell className="font-medium">{months[financial.month - 1]}</TableCell>
                      <TableCell className="text-right text-green-600">
                        ${Number(financial.totalIncome || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ${Number(financial.totalExpenses || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${Number(financial.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Number(financial.netProfit || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {financial.episodesReleased || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(financial)} data-testid={`button-edit-financial-${financial.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
