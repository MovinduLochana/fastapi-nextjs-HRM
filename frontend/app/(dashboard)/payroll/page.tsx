"use client";

import { useEffect, useState } from "react";
import { payrollApi, employeesApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Payroll, PayrollFormData } from "@/types/payroll";
import type { Employee } from "@/types/employee";
import { payrollSchema } from "@/lib/validations";
import { getApiErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField, FormErrorBanner } from "@/components/ui/form-field";
import { Plus, Pencil, Trash2, Wallet, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function PayrollPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState<Payroll | null>(null);
  const [deleting, setDeleting] = useState<Payroll | null>(null);
  const [paying, setPaying] = useState<Payroll | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PayrollFormData>({
    employee_id: 0, month: new Date().getMonth() + 1, year: currentYear,
    basic_salary: 0, allowances: 0, deductions: 0, payment_status: "PENDING",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const netSalary = (form.basic_salary || 0) + (form.allowances || 0) - (form.deductions || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params: Record<string, number | string> = {};
        if (filterMonth !== "all") params.month = Number(filterMonth);
        if (filterYear !== "all") params.year = Number(filterYear);
        if (filterStatus !== "all") params.payment_status = filterStatus;
        const [payData, empData] = await Promise.all([
          payrollApi.getAll(params as { month?: number; year?: number; payment_status?: string }),
          employeesApi.getAll(),
        ]);
        setPayrolls(payData);
        setEmployees(empData);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterMonth, filterYear, filterStatus, refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);
  const clearErrors = () => { setFieldErrors({}); setServerError(""); };

  const getEmpLabel = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name} (${emp.employee_code})` : "";
  };

  const handleFieldChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
    if (serverError) setServerError("");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const openCreate = () => {
    setEditing(null);
    setForm({ employee_id: 0, month: new Date().getMonth() + 1, year: currentYear, basic_salary: 0, allowances: 0, deductions: 0, payment_status: "PENDING" });
    clearErrors();
    setDialogOpen(true);
  };

  const openEdit = (p: Payroll) => {
    setEditing(p);
    setForm({ employee_id: p.employee_id, month: p.month, year: p.year, basic_salary: p.basic_salary, allowances: p.allowances, deductions: p.deductions, payment_status: p.payment_status });
    clearErrors();
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const result = payrollSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setServerError("");
    setSubmitting(true);
    try {
      if (editing) {
        await payrollApi.update(editing.id, form);
        toast.success("Payroll updated");
      } else {
        await payrollApi.create(form);
        toast.success("Payroll created");
      }
      setDialogOpen(false);
      reload();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await payrollApi.delete(deleting.id);
      toast.success("Payroll deleted");
      setDeleteOpen(false);
      setDeleting(null);
      reload();
    } catch (err: unknown) { toast.error(getApiErrorMessage(err)); }
  };

  const handleMarkAsPaid = async () => {
    if (!paying) return;
    try {
      await payrollApi.markAsPaid(paying.id);
      toast.success("Payroll marked as paid");
      setPayOpen(false);
      setPaying(null);
      reload();
    } catch (err: unknown) { toast.error(getApiErrorMessage(err)); }
  };

  const fe = fieldErrors;
  const errCls = (field: string) => fe[field] ? "border-hrm-red focus-visible:ring-hrm-red/20" : "";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll</h2>
          <p className="text-sm text-muted-foreground">Manage employee payroll records</p>
        </div>
        <Button onClick={openCreate} size="lg"><Plus className="mr-2 h-4 w-4" /> Create Payroll</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterMonth} onValueChange={(v) => setFilterMonth(v ?? "all")}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Month">{filterMonth === "all" ? "All Months" : MONTHS[Number(filterMonth) - 1]}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={(v) => setFilterYear(v ?? "all")}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Year">{filterYear === "all" ? "All Years" : filterYear}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status">{filterStatus === "all" ? "All Statuses" : filterStatus}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : payrolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Wallet className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No payroll records found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead><TableHead>Period</TableHead>
                  <TableHead className="text-right">Basic</TableHead><TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Deductions</TableHead><TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employee_name || `Employee #${p.employee_id}`}</TableCell>
                    <TableCell>{MONTHS[p.month - 1]?.slice(0, 3)} {p.year}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.basic_salary)}</TableCell>
                    <TableCell className="text-right text-hrm-green">{formatCurrency(p.allowances)}</TableCell>
                    <TableCell className="text-right text-hrm-red">{formatCurrency(p.deductions)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(p.net_salary)}</TableCell>
                    <TableCell><StatusBadge status={p.payment_status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isAdmin && p.payment_status === "PENDING" && (
                          <Button variant="ghost" size="icon" onClick={() => { setPaying(p); setPayOpen(true); }} title="Mark as paid" className="text-hrm-green hover:text-hrm-green">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleting(p); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Payroll" : "Create Payroll"}</DialogTitle></DialogHeader>

          <FormErrorBanner message={serverError} />

          <div className="space-y-4 py-2">
            <FormField label="Employee" required error={fe.employee_id}>
              <Select value={form.employee_id ? String(form.employee_id) : ""} onValueChange={(v) => v && handleFieldChange("employee_id", Number(v))}>
                <SelectTrigger className={errCls("employee_id")}>
                  <SelectValue placeholder="Select employee">{form.employee_id ? getEmpLabel(form.employee_id) : "Select employee"}</SelectValue>
                </SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name} ({e.employee_code})</SelectItem>)}</SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Month">
                <Select value={String(form.month)} onValueChange={(v) => v && handleFieldChange("month", Number(v))}>
                  <SelectTrigger><SelectValue>{MONTHS[form.month - 1]}</SelectValue></SelectTrigger>
                  <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Year">
                <Select value={String(form.year)} onValueChange={(v) => v && handleFieldChange("year", Number(v))}>
                  <SelectTrigger><SelectValue>{String(form.year)}</SelectValue></SelectTrigger>
                  <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Basic Salary" required error={fe.basic_salary}>
                <Input type="number" value={form.basic_salary} onChange={(e) => handleFieldChange("basic_salary", Number(e.target.value))} className={errCls("basic_salary")} />
              </FormField>
              <FormField label="Allowances" error={fe.allowances}>
                <Input type="number" value={form.allowances} onChange={(e) => handleFieldChange("allowances", Number(e.target.value))} className={errCls("allowances")} />
              </FormField>
              <FormField label="Deductions" error={fe.deductions}>
                <Input type="number" value={form.deductions} onChange={(e) => handleFieldChange("deductions", Number(e.target.value))} className={errCls("deductions")} />
              </FormField>
            </div>

            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Net Salary</p>
              <p className="text-xl font-bold">{formatCurrency(netSalary)}</p>
            </div>

            <FormField label="Payment Status">
              <Select value={form.payment_status || "PENDING"} onValueChange={(v) => v && handleFieldChange("payment_status", v)}>
                <SelectTrigger><SelectValue>{form.payment_status || "PENDING"}</SelectValue></SelectTrigger>
                <SelectContent>{PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Payroll" description="Are you sure you want to delete this payroll record?" onConfirm={handleDelete} variant="danger" confirmText="Delete" />
      <ConfirmDialog open={payOpen} onOpenChange={setPayOpen} title="Process Payment" description={paying ? `Mark payroll for ${paying.employee_name || "this employee"} (${MONTHS[paying.month - 1]} ${paying.year}) as PAID? Net: ${formatCurrency(paying.net_salary)}` : ""} onConfirm={handleMarkAsPaid} confirmText="Confirm Payment" />
    </div>
  );
}
