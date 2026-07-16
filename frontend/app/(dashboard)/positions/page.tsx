"use client";

import { useEffect, useState } from "react";
import { positionsApi, departmentsApi } from "@/lib/api";
import type { Position, PositionFormData } from "@/types/position";
import type { Department } from "@/types/department";
import { positionSchema } from "@/lib/validations";
import { getApiErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField, FormErrorBanner } from "@/components/ui/form-field";
import { Plus, Pencil, Trash2, Search, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [deleting, setDeleting] = useState<Position | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PositionFormData>({ department_id: 0, title: "", description: "", is_active: true });
  const [refreshKey, setRefreshKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [posData, deptData] = await Promise.all([
          positionsApi.getAll(filterDept !== "all" ? Number(filterDept) : undefined, search || undefined),
          departmentsApi.getAll(),
        ]);
        setPositions(posData);
        setDepartments(deptData);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterDept, search, refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);
  const clearErrors = () => { setFieldErrors({}); setServerError(""); };

  const getDeptName = (id: number) => departments.find((d) => d.id === id)?.name || "—";

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
    if (serverError) setServerError("");
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ department_id: 0, title: "", description: "", is_active: true });
    clearErrors();
    setDialogOpen(true);
  };

  const openEdit = (pos: Position) => {
    setEditing(pos);
    setForm({ department_id: pos.department_id, title: pos.title, description: pos.description || "", is_active: pos.is_active });
    clearErrors();
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const result = positionSchema.safeParse(form);
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
        await positionsApi.update(editing.id, form);
        toast.success("Position updated");
      } else {
        await positionsApi.create(form);
        toast.success("Position created");
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
      await positionsApi.delete(deleting.id);
      toast.success("Position deleted");
      setDeleteOpen(false);
      setDeleting(null);
      reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const filtered = positions.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedDeptLabel = form.department_id ? getDeptName(form.department_id) : undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Positions</h2>
          <p className="text-sm text-muted-foreground">Manage job positions and roles</p>
        </div>
        <Button onClick={openCreate} size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Position
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search positions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterDept} onValueChange={(v) => setFilterDept(v ?? "all")}>
          <SelectTrigger className="w-50"><SelectValue placeholder="All Departments">{filterDept === "all" ? "All Departments" : getDeptName(Number(filterDept))}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Briefcase className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No positions found</p>
              <p className="text-sm">Create your first position to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium">{pos.title}</TableCell>
                    <TableCell>{pos.department_name || getDeptName(pos.department_id)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{pos.description || "—"}</TableCell>
                    <TableCell><StatusBadge status={pos.is_active ? "ACTIVE" : "INACTIVE"} /></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(pos.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(pos)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleting(pos); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Position" : "Add Position"}</DialogTitle></DialogHeader>

          <FormErrorBanner message={serverError} />

          <div className="space-y-4 py-2">
            <FormField label="Title" required error={fieldErrors.title}>
              <Input
                value={form.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="e.g. Software Engineer"
                className={fieldErrors.title ? "border-hrm-red focus-visible:ring-hrm-red/20" : ""}
              />
            </FormField>

            <FormField label="Department" required error={fieldErrors.department_id}>
              <Select
                value={form.department_id ? String(form.department_id) : ""}
                onValueChange={(v) => v && handleFieldChange("department_id", Number(v))}
              >
                <SelectTrigger className={fieldErrors.department_id ? "border-hrm-red focus-visible:ring-hrm-red/20" : ""}>
                  <SelectValue placeholder="Select department">{selectedDeptLabel || "Select department"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Description">
              <Textarea value={form.description} onChange={(e) => handleFieldChange("description", e.target.value)} rows={3} />
            </FormField>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="pos-active" checked={form.is_active} onChange={(e) => handleFieldChange("is_active", e.target.checked)} className="h-4 w-4 rounded border-border accent-hrm-blue" />
              <label htmlFor="pos-active" className="text-sm font-medium">Active</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Position" description={`Are you sure you want to delete "${deleting?.title}"?`} onConfirm={handleDelete} variant="danger" confirmText="Delete" />
    </div>
  );
}
