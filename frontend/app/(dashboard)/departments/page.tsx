"use client";

import { useEffect, useState } from "react";
import { departmentsApi } from "@/lib/api";
import type { Department, DepartmentFormData } from "@/types/department";
import { departmentSchema } from "@/lib/validations";
import { getApiErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField, FormErrorBanner } from "@/components/ui/form-field";
import { Plus, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<DepartmentFormData>({ name: "", description: "", is_active: true });
  const [refreshKey, setRefreshKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentsApi.getAll(search || undefined);
        setDepartments(data);
      } catch {
        toast.error("Failed to load departments");
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, [search, refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);
  const clearErrors = () => { setFieldErrors({}); setServerError(""); };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", is_active: true });
    clearErrors();
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || "", is_active: dept.is_active });
    clearErrors();
    setDialogOpen(true);
  };

  const handleFieldChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async () => {
    const result = departmentSchema.safeParse(form);
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
        await departmentsApi.update(editing.id, form);
        toast.success("Department updated");
      } else {
        await departmentsApi.create(form);
        toast.success("Department created");
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
      await departmentsApi.delete(deleting.id);
      toast.success("Department deleted");
      setDeleteOpen(false);
      setDeleting(null);
      reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
          <p className="text-sm text-muted-foreground">Manage organizational departments</p>
        </div>
        <Button onClick={openCreate} size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No departments found</p>
              <p className="text-sm">Create your first department to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{dept.description || "—"}</TableCell>
                    <TableCell><StatusBadge status={dept.is_active ? "ACTIVE" : "INACTIVE"} /></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(dept.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(dept)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleting(dept); setDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
          </DialogHeader>

          <FormErrorBanner message={serverError} />

          <div className="space-y-4 py-2">
            <FormField label="Name" required error={fieldErrors.name} htmlFor="dept-name">
              <Input
                id="dept-name"
                value={form.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g. Engineering"
                className={fieldErrors.name ? "border-hrm-red focus-visible:ring-hrm-red/20" : ""}
              />
            </FormField>

            <FormField label="Description" htmlFor="dept-desc">
              <Textarea
                id="dept-desc"
                value={form.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Department description..."
                rows={3}
              />
            </FormField>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="dept-active" checked={form.is_active} onChange={(e) => handleFieldChange("is_active", e.target.checked)} className="h-4 w-4 rounded border-border accent-hrm-blue" />
              <label htmlFor="dept-active" className="text-sm font-medium">Active</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Department"
        description={`Are you sure you want to delete "${deleting?.name}"? All positions under this department will also be deleted.`}
        onConfirm={handleDelete}
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}
