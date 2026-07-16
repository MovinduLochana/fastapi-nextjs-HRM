"use client";

import { useEffect, useState, useRef } from "react";
import { employeesApi, departmentsApi, positionsApi } from "@/lib/api";
import type { Employee, EmployeeFormData, EmployeeDocument } from "@/types/employee";
import type { Department } from "@/types/department";
import type { Position } from "@/types/position";
import { employeeSchema } from "@/lib/validations";
import { getApiErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField, FormErrorBanner } from "@/components/ui/form-field";
import { Plus, Pencil, Trash2, Search, Users, Upload, Eye, FileText, X } from "lucide-react";
import { toast } from "sonner";

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"];
const STATUSES = ["ACTIVE", "INACTIVE", "ONBOARDING", "TERMINATED"];
const DOC_TYPES = ["NIC/ID Copy", "Passport Copy", "CV/Resume", "Education Certificate", "Employment Letter", "Bank Details", "Signed Contract", "Other"];

const emptyForm: EmployeeFormData = {
  first_name: "", last_name: "", email: "", phone: "+94071234567", address: "",
  department_id: undefined, position_id: undefined, joining_date: "",
  employment_type: "FULL_TIME", basic_salary: 0, status: "ONBOARDING",
};

interface PendingFile { file: File; docType: string; }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EmployeeFormData>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params: Record<string, string | number> = {};
        if (filterDept !== "all") params.department_id = Number(filterDept);
        if (filterStatus !== "all") params.status = filterStatus;
        if (search) params.search = search;
        const [empData, deptData, posData] = await Promise.all([
          employeesApi.getAll(params as { department_id?: number; status?: string; search?: string }),
          departmentsApi.getAll(),
          positionsApi.getAll(),
        ]);
        setEmployees(empData);
        setDepartments(deptData);
        setPositions(posData);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search, filterDept, filterStatus, refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);
  const clearErrors = () => { setFieldErrors({}); setServerError(""); };

  const getDeptName = (id: number | null | undefined) =>
    id ? departments.find((d) => d.id === id)?.name || "—" : "—";
  const getPosTitle = (id: number | null | undefined) =>
    id ? positions.find((p) => p.id === id)?.title || "—" : "—";

  const handleFieldChange = (field: string, value: string | number | boolean | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
    if (serverError) setServerError("");
  };

  const loadDocuments = async (empId: number) => {
    try {
      const docs = await employeesApi.getDocuments(empId);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDocuments([]);
    setPendingFiles([]);
    clearErrors();
    setDialogOpen(true);
  };

  const openEdit = async (emp: Employee) => {
    setEditing(emp);
    setForm({
      employee_code: emp.employee_code,
      first_name: emp.first_name, 
      last_name: emp.last_name,
       email: emp.email,
      phone: emp.phone || "",
       address: emp.address || "",
      department_id: emp.department_id ?? undefined, 
      position_id: emp.position_id ?? undefined,
      joining_date: emp.joining_date, 
      employment_type: emp.employment_type,
      basic_salary: emp.basic_salary,
       status: emp.status,
    });
    setPendingFiles([]);
    clearErrors();
    await loadDocuments(emp.id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const result = employeeSchema.safeParse(form);
    if (!result.success) {
      console.log("Validation errors:", result.error.issues);
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
        await employeesApi.update(editing.id, form);
        toast.success("Employee updated");
      } else {
        const created = await employeesApi.create(form);
        if (pendingFiles.length > 0) {
          for (const pf of pendingFiles) {
            try { await employeesApi.uploadDocument(created.id, pf.file, pf.docType); }
            catch { toast.error(`Failed to upload ${pf.file.name}`); }
          }
        }
        toast.success("Employee created");
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
      await employeesApi.delete(deleting.id);
      toast.success("Employee deleted");
      setDeleteOpen(false);
      setDeleting(null);
      reload();
    } catch (err: unknown) { toast.error(getApiErrorMessage(err)); }
  };

  const handleUploadDoc = async () => {
    if (!editing || !docFile) return;
    setUploading(true);
    try {
      await employeesApi.uploadDocument(editing.id, docFile, docType);
      toast.success("Document uploaded");
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments(editing.id);
    } catch (err: unknown) { toast.error(getApiErrorMessage(err)); }
    finally { setUploading(false); }
  };

  const handleDeleteDoc = async (docId: number) => {
    try {
      await employeesApi.deleteDocument(docId);
      toast.success("Document deleted");
      if (editing) await loadDocuments(editing.id);
    } catch (err: unknown) { toast.error(getApiErrorMessage(err)); }
  };

  const addPendingFile = () => {
    if (!docFile) return;
    setPendingFiles([...pendingFiles, { file: docFile, docType }]);
    setDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => setPendingFiles(pendingFiles.filter((_, i) => i !== index));

  const handleViewDoc = (doc: EmployeeDocument) => {
    const url = employeesApi.downloadDocument(doc.id);
    if (doc.mime_type.startsWith("image/")) { setPreviewUrl(url); setPreviewName(doc.original_file_name); }
    else { window.open(url, "_blank"); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const filteredPositions = form.department_id ? positions.filter((p) => p.department_id === form.department_id) : positions;
  const filtered = employees.filter((e) => `${e.first_name} ${e.last_name} ${e.email} ${e.employee_code}`.toLowerCase().includes(search.toLowerCase()));
  const fe = fieldErrors;
  const errCls = (field: string) => fe[field] ? "border-hrm-red focus-visible:ring-hrm-red/20" : "";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
          <p className="text-sm text-muted-foreground">Manage employee records and documents</p>
        </div>
        <Button onClick={openCreate} size="lg"><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterDept} onValueChange={(v) => setFilterDept(v ?? "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department">{filterDept === "all" ? "All Departments" : getDeptName(Number(filterDept))}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status">{filterStatus === "all" ? "All Statuses" : filterStatus}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No employees found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead>
                  <TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Joining</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                    <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                    <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                    <TableCell>{emp.department_name || getDeptName(emp.department_id)}</TableCell>
                    <TableCell><StatusBadge status={emp.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(emp.joining_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} title="View documents" className="text-hrm-blue">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleting(emp); setDeleteOpen(true); }} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-none">
          <DialogHeader><DialogTitle>{editing ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>

          <FormErrorBanner message={serverError} />

          <div className="space-y-6 py-2">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-5">
                <FormField label="First Name" required error={fe.first_name}>
                  <Input value={form.first_name} onChange={(e) => handleFieldChange("first_name", e.target.value)} className={errCls("first_name")} />
                </FormField>
                <FormField label="Last Name" required error={fe.last_name}>
                  <Input value={form.last_name} onChange={(e) => handleFieldChange("last_name", e.target.value)} className={errCls("last_name")} />
                </FormField>
                <FormField label="Email" required error={fe.email}>
                  <Input type="email" value={form.email} onChange={(e) => handleFieldChange("email", e.target.value)} className={errCls("email")} />
                </FormField>
                <FormField label="Phone" error={fe.phone}>
                  <Input  value={form.phone} onChange={(e) => handleFieldChange("phone", e.target.value)} className={errCls("phone")} />
                </FormField>
              </div>
              <div className="mt-4">
                <FormField label="Address">
                  <Textarea value={form.address} onChange={(e) => handleFieldChange("address", e.target.value)} rows={2} />
                </FormField>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Employment Information</h3>
              <div className="grid grid-cols-3 gap-5">
                <FormField label="Employee Code (Auto-generated)">
                  <Input value={form.employee_code || ""} onChange={(e) => handleFieldChange("employee_code", e.target.value)} placeholder="Type to add a Custom Code" />
                </FormField>
                <FormField label="Joining Date" required error={fe.joining_date}>
                  <Input type="date" value={form.joining_date} onChange={(e) => handleFieldChange("joining_date", e.target.value)} className={errCls("joining_date")} />
                </FormField>
                <FormField label="Department">
                  <Select value={form.department_id ? String(form.department_id) : ""} onValueChange={(v) => { handleFieldChange("department_id", v ? Number(v) : undefined); handleFieldChange("position_id", undefined); }}>
                    <SelectTrigger><SelectValue placeholder="Select department">{form.department_id ? getDeptName(form.department_id) : "Select department"}</SelectValue></SelectTrigger>
                    <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label="Position">
                  <Select value={form.position_id ? String(form.position_id) : ""} onValueChange={(v) => v && handleFieldChange("position_id", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select position">{form.position_id ? getPosTitle(form.position_id) : "Select position"}</SelectValue></SelectTrigger>
                    <SelectContent>{filteredPositions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label="Employment Type" required error={fe.employment_type}>
                  <Select value={form.employment_type} onValueChange={(v) => v && handleFieldChange("employment_type", v)}>
                    <SelectTrigger className={errCls("employment_type")}><SelectValue>{form.employment_type.replace(/_/g, " ")}</SelectValue></SelectTrigger>
                    <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label="Basic Salary" required error={fe.basic_salary}>
                  <Input type="number" step="any" value={form.basic_salary} onChange={(e) => handleFieldChange("basic_salary", Number(e.target.valueAsNumber))} className={errCls("basic_salary")} />
                </FormField>
                <FormField label="Status">
                  <Select value={form.status || "ONBOARDING"} onValueChange={(v) => v && handleFieldChange("status", v)}>
                    <SelectTrigger><SelectValue>{form.status || "ONBOARDING"}</SelectValue></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Documents</h3>
              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-4 mb-4">
                <FormField label="Document Type">
                  <Select value={docType} onValueChange={(v) => v && setDocType(v)}>
                    <SelectTrigger><SelectValue>{docType}</SelectValue></SelectTrigger>
                    <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label="File (PDF, JPG, PNG, max 5MB)">
                  <Input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
                </FormField>
                {editing ? (
                  <Button onClick={handleUploadDoc} disabled={!docFile || uploading} size="lg">
                    <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading..." : "Upload"}
                  </Button>
                ) : (
                  <Button onClick={addPendingFile} disabled={!docFile} size="lg" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />Add
                  </Button>
                )}
              </div>

              {!editing && pendingFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-muted-foreground">Files to upload after creation:</p>
                  {pendingFiles.map((pf, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{pf.file.name}</p>
                          <p className="text-xs text-muted-foreground">{pf.docType} · {formatFileSize(pf.file.size)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removePendingFile(i)}><X className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              )}

              {editing && documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.original_file_name}</p>
                          <p className="text-xs text-muted-foreground">{doc.document_type} · {formatFileSize(doc.file_size)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDoc(doc)} title="View file"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc.id)} title="Delete"><X className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editing && documents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{previewName}</DialogTitle></DialogHeader>
          {previewUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={previewUrl} alt={previewName} className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete ${deleting?.first_name} ${deleting?.last_name}? This will also remove all their payroll records and documents.`}
        onConfirm={handleDelete}
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}
