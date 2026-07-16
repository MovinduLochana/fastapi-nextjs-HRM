"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import type { DashboardStats } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Users, Building2, Briefcase, Wallet, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";

const statCards = [
  { key: "total_employees" as const, label: "Total Employees", icon: Users, gradient: "from-blue-500 to-blue-600", bgLight: "bg-blue-50", iconColor: "text-blue-600" },
  { key: "total_departments" as const, label: "Total Departments", icon: Building2, gradient: "from-purple-500 to-purple-600", bgLight: "bg-purple-50", iconColor: "text-purple-600" },
  { key: "total_positions" as const, label: "Total Positions", icon: Briefcase, gradient: "from-emerald-500 to-emerald-600", bgLight: "bg-emerald-50", iconColor: "text-emerald-600" },
  { key: "monthly_payroll_total" as const, label: "Monthly Payroll", icon: Wallet, gradient: "from-amber-500 to-amber-600", bgLight: "bg-amber-50", iconColor: "text-amber-600" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

      const loadStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

    loadStats();
  }, []);



  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-40 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          const displayValue = card.key === "monthly_payroll_total" ? formatCurrency(value) : value;
          return (
            <Card key={card.key} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{displayValue}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bgLight} transition-transform group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Employees */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Recent Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_employees?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent_employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                      <TableCell className="text-muted-foreground">{emp.employee_code}</TableCell>
                      <TableCell><StatusBadge status={emp.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">No employees yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payrolls */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Pending Payrolls</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.pending_payrolls?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.pending_payrolls.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.month}/{p.year}</TableCell>
                      <TableCell>{formatCurrency(p.net_salary)}</TableCell>
                      <TableCell><StatusBadge status={p.payment_status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Wallet className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">No pending payrolls</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
